import * as sdk from "https://esm.sh/@spotware-web-team/sdk";

const SENSITIVE_KEY = /^(name|email|login|traderid|groupid|clientmsgid|uuid)$/i;
const SECRET_KEY = /token|secret|password|credential/i;

export function sanitizeDeep(value) {
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) || SECRET_KEY.test(key) ? "[REDACTED]" : sanitizeDeep(item)
    ]));
  }
  return value;
}

export function discoverSdkCapabilities() {
  const names = Object.keys(sdk).sort();
  const relevant = names.filter(name => /server|data|position|order|reconcile|account|execution/i.test(name));
  return { totalExports: names.length, relevantExports: relevant };
}

export class SnapshotDiscoveryService {
  constructor({ adapter, logger, onCapture }) {
    this.adapter = adapter;
    this.logger = logger;
    this.onCapture = onCapture;
    this.subscriptions = [];
  }

  startPassiveCapture() {
    const candidateNames = ["serverDataEvent", "reconcileEvent", "positionEvent", "orderEvent"];
    const active = [];

    for (const name of candidateNames) {
      const factory = sdk[name];
      if (typeof factory !== "function") continue;
      try {
        const subscription = factory(this.adapter).subscribe({
          next: event => this.onCapture({ source: name, event: sanitizeDeep(event) }),
          error: error => this.logger?.error?.(`${name} failed`, String(error?.message || error))
        });
        this.subscriptions.push(subscription);
        active.push(name);
      } catch (error) {
        this.logger?.error?.(`${name} could not start`, String(error?.message || error));
      }
    }
    return active;
  }

  stop() {
    this.subscriptions.forEach(subscription => subscription?.unsubscribe?.());
    this.subscriptions = [];
  }
}
