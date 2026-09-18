import { createClientAdapter } from "https://esm.sh/@spotware-web-team/sdk-external-api";
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation,
  executionEvent
} from "https://esm.sh/@spotware-web-team/sdk";
import { createLogger } from "https://esm.sh/@veksa/logger";
import { take } from "https://esm.sh/rxjs/operators";

function observableOnce(observable, timeoutMs, stage) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      subscription?.unsubscribe?.();
      reject(new Error(`${stage} timed out after ${Math.round(timeoutMs / 1000)} seconds`));
    }, timeoutMs);

    const subscription = observable.pipe(take(1)).subscribe({
      next: value => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      error: error => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new Error(`${stage} failed: ${error?.message || String(error)}`));
      },
      complete: () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new Error(`${stage} completed without a response`));
      }
    });
  });
}

export class CTraderProvider {
  constructor({ logger, onStageChange } = {}) {
    this.appLogger = logger;
    this.onStageChange = onStageChange || (() => {});
    this.mode = "live";
    this.connected = false;
    this.adapter = null;
    this.executionSubscription = null;
  }

  stage(name, detail = "") {
    this.onStageChange(name, detail);
    this.appLogger?.info?.(`SDK stage: ${name}`, detail);
  }

  async connect() {
    this.disconnect();
    this.stage("Creating adapter");
    const sdkLogger = createLogger(new URLSearchParams(location.search).get("showLogs") === "true");
    this.adapter = createClientAdapter({ logger: sdkLogger });

    this.stage("Sending first confirmation");
    handleConfirmEvent(this.adapter, {}).pipe(take(1)).subscribe({
      error: error => this.appLogger?.error?.("First confirmation failed", error)
    });

    this.stage("Waiting for host registration");
    await observableOnce(registerEvent(this.adapter), 15000, "Host registration");

    this.stage("Sending second confirmation");
    handleConfirmEvent(this.adapter, {}).pipe(take(1)).subscribe({
      error: error => this.appLogger?.error?.("Second confirmation failed", error)
    });

    this.connected = true;
    this.stage("Handshake complete");
    return { mode: this.mode, connected: true };
  }

  async getAccountSnapshot() {
    if (!this.connected || !this.adapter) throw new Error("The cTrader host is not connected.");
    this.stage("Requesting account information");
    const result = await observableOnce(
      getAccountInformation(this.adapter, {}),
      15000,
      "Account information request"
    );
    this.stage("Account information received");
    return result;
  }

  subscribeToExecutionEvents(handler) {
    if (!this.connected || !this.adapter) throw new Error("The cTrader host is not connected.");
    this.executionSubscription?.unsubscribe?.();
    this.executionSubscription = executionEvent(this.adapter).subscribe({
      next: handler,
      error: error => this.appLogger?.error?.("Execution event stream failed", error)
    });
    this.stage("Execution event stream subscribed");
  }

  disconnect() {
    this.executionSubscription?.unsubscribe?.();
    this.executionSubscription = null;
    this.connected = false;
    this.adapter = null;
  }

  async closePosition() {
    throw new Error("Live trading actions remain locked in the read-only build.");
  }
}
