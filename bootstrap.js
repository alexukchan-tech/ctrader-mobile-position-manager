import { DemoProvider } from "./services/demo-provider.js";
import { CTraderProvider } from "./services/ctrader-provider.js";
import { AppMode, detectInitialMode } from "./services/app-mode-service.js";
import { createDebugLogger } from "./services/debug-logger.js";
import * as settingsService from "./services/settings-service.js";
import * as formatService from "./services/format-service.js";

const logger = createDebugLogger();
const initialMode = detectInitialMode();
let stageOutput = null;
const provider = initialMode === AppMode.CONNECTING
  ? new CTraderProvider({
      logger,
      onStageChange: (stage, detail) => {
        if (stageOutput) stageOutput.textContent = `${stage}${detail ? `\n${detail}` : ""}`;
      }
    })
  : new DemoProvider();

const platform = {
  version: "4.2-read-only-diagnostic",
  initialMode,
  currentMode: initialMode,
  provider,
  logger,
  settingsService,
  formatService,
  liveTradingLocked: true,
  accountSnapshot: null,
  lastExecutionEvent: null,
  connectionError: null
};
window.positionManagerPlatform = platform;

function setStatus(text, cls) {
  const element = document.getElementById("connectionStatus");
  if (!element) return;
  element.textContent = text;
  element.className = `status ${cls}`;
}

function lockLiveInterface() {
  document.getElementById("positionCount").textContent = "--";
  document.getElementById("pendingOrderCount").textContent = "--";
  document.getElementById("floatingProfit").textContent = "--";
  document.getElementById("positionsStatus").textContent = "Awaiting live data";
  document.getElementById("ordersStatus").textContent = "Awaiting live data";
  document.getElementById("positionsList").innerHTML = '<div class="empty-state">Live positions will appear after read-only mapping.</div>';
  document.getElementById("ordersList").innerHTML = '<div class="empty-state">Live pending orders will appear after read-only mapping.</div>';
  document.getElementById("closeSymbolButton").disabled = true;
  document.getElementById("closeAllButton").disabled = true;
  document.querySelectorAll("#resetDemoButton,.manage-position-button").forEach(element => element.remove());
}

function addInspector() {
  if (document.getElementById("sdkInspector")) return;
  const section = document.createElement("section");
  section.id = "sdkInspector";
  section.className = "content-section";
  section.innerHTML = `
    <div class="section-heading"><h2>cTrader SDK Inspector</h2><span>Read-only</span></div>
    <p class="calculation-note">Connection diagnostics and sanitized account response. Trading actions are locked.</p>
    <div class="action-row">
      <button id="retrySdkConnection" type="button">Retry Connection</button>
      <button id="copySdkResponse" type="button" disabled>Copy Response</button>
    </div>
    <pre id="sdkOutput" class="sdk-output">Preparing connection...</pre>`;
  document.querySelector(".app-shell").prepend(section);
  stageOutput = document.getElementById("sdkOutput");
  document.getElementById("retrySdkConnection").onclick = connectReadOnly;
  document.getElementById("copySdkResponse").onclick = () => navigator.clipboard.writeText(stageOutput.textContent);
}

function sanitize(value) {
  const blocked = /token|secret|password|credential/i;
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, blocked.test(key) ? "[REDACTED]" : sanitize(item)]));
  }
  return value;
}

async function connectReadOnly() {
  if (initialMode !== AppMode.CONNECTING) return;
  addInspector();
  lockLiveInterface();
  setStatus("Connecting...", "disconnected");
  const retry = document.getElementById("retrySdkConnection");
  const copy = document.getElementById("copySdkResponse");
  retry.disabled = true;
  copy.disabled = true;
  try {
    await provider.connect();
    const snapshot = await provider.getAccountSnapshot();
    platform.accountSnapshot = snapshot;
    platform.currentMode = AppMode.LIVE;
    platform.connectionError = null;
    setStatus("Connected: Read-Only", "connected");
    stageOutput.textContent = JSON.stringify(sanitize(snapshot), null, 2);
    copy.disabled = false;
    provider.subscribeToExecutionEvents(event => {
      platform.lastExecutionEvent = event;
      logger.info("Execution event received", sanitize(event));
    });
  } catch (error) {
    platform.currentMode = AppMode.CONNECTION_ERROR;
    platform.connectionError = String(error?.message || error);
    setStatus("Connection Failed", "disconnected");
    stageOutput.textContent = `Connection failed\n\n${platform.connectionError}\n\nReload the published cTrader placement, then retry once.`;
  } finally {
    retry.disabled = false;
  }
}

logger.info("Application platform initialized", { version: platform.version, initialMode, liveTradingLocked: true });
if (initialMode === AppMode.CONNECTING) {
  window.addEventListener("DOMContentLoaded", () => setTimeout(connectReadOnly, 100), { once: true });
}
