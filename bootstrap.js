import { mapTrackedPositions, mapTrackedPendingOrders } from "./services/event-list-mapper.js";
import { EventLedger } from "./services/event-ledger-service.js";
import { inspectServerInterfaces } from "./services/server-interface-inspector.js";
import { probePresets, runServerDataProbe } from "./services/server-data-probe-service.js";
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
  version: "4.8-event-tracked-live-lists",
  initialMode,
  currentMode: initialMode,
  provider,
  logger,
  settingsService,
  formatService,
  liveTradingLocked: true,
  accountSnapshot: null,
  lastExecutionEvent: null,
  connectionError: null,
  discoveryService: null,
  discoveryCaptures: [],
  eventLedger: new EventLedger({ maximumEvents: 100 })
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
      <button id="copySdkResponse" type="button" disabled>Copy Account Response</button>
    </div>
    <p class="field-label">Connection stage</p>
    <pre id="sdkStageOutput" class="sdk-output sdk-stage-output">Preparing connection...</pre>
    <p class="field-label sdk-response-label">Sanitized account response</p>
    <pre id="sdkOutput" class="sdk-output">Waiting for account information...</pre>
    <p class="field-label sdk-response-label">Execution Event Ledger</p>
    <div class="ledger-warning">Initial account snapshot unavailable. The ledger includes only positions and orders observed in execution events after this plugin instance connected.</div>
    <div class="ledger-summary">
      <div><span>Tracked positions</span><strong id="trackedPositionCount">0</strong></div>
      <div><span>Tracked orders</span><strong id="trackedOrderCount">0</strong></div>
      <div><span>Captured events</span><strong id="capturedEventCount">0</strong></div>
    </div>
    <div class="action-row">
      <button id="copyEventLedger" type="button">Copy Event Ledger</button>
      <button id="clearEventLedger" type="button">Clear Ledger</button>
    </div>
    <pre id="eventLedgerOutput" class="sdk-output">Waiting for execution events...</pre>
    <p class="field-label sdk-response-label">Event-tracked live lists</p>
    <div class="ledger-warning">Partial view only. Records that existed before this plugin connected may be missing. Management actions remain locked.</div>
    <div class="tracked-list-heading"><strong>Tracked open positions</strong><span id="trackedOpenPositionLabel">0</span></div>
    <div id="trackedPositionList" class="record-list"><div class="empty-state">No event-tracked open positions.</div></div>
    <div class="tracked-list-heading"><strong>Tracked pending entry orders</strong><span id="trackedPendingOrderLabel">0</span></div>
    <div id="trackedOrderList" class="record-list"><div class="empty-state">No event-tracked pending entry orders.</div></div>
    <p class="field-label sdk-response-label">SDK ServerInterfaces inspector</p>
    <div class="action-row">
      <button id="refreshInterfaceReport" type="button">Refresh Interface Report</button>
      <button id="copyInterfaceReport" type="button">Copy Interface Report</button>
    </div>
    <pre id="sdkInterfaceOutput" class="sdk-output">Inspecting ServerInterfaces...</pre>
    <p class="field-label sdk-response-label">Read-only getServerData probe</p>
    <select id="serverDataPreset"></select>
    <textarea id="serverDataPayload" class="sdk-probe-input" rows="3" spellcheck="false">{}</textarea>
    <div class="action-row">
      <button id="runServerDataProbe" type="button">Run Selected Probe</button>
      <button id="copyDiscoveryReport" type="button">Copy Probe Report</button>
      <button id="clearDiscoveryReport" type="button">Clear Report</button>
    </div>
    <p class="calculation-note">These calls request data only. No order, close, cancel, or protection method is invoked.</p>
    <pre id="sdkDiscoveryOutput" class="sdk-output">Waiting for a probe...</pre>`;
  document.querySelector(".app-shell").prepend(section);
  stageOutput = document.getElementById("sdkStageOutput");
  document.getElementById("retrySdkConnection").onclick = connectReadOnly;
  const ledgerOutput = document.getElementById("eventLedgerOutput");
  const escapeText = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[character]);
  const formatTrackedTimestamp = value => value ? new Date(Number(value)).toLocaleString() : "Not available";
  const formatTrackedVolume = record => {
    const preference = window.tradePanelPreferences?.volumeDisplay || "both";
    const units = `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(record.volumeUnits)} ${record.measurementUnits}`;
    const lots = record.volumeLots == null ? "Lots unavailable" : `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(record.volumeLots)} lots`;
    return preference === "units" ? units : preference === "lots" ? lots : `${units} / ${lots}`;
  };
  const renderTrackedLists = () => {
    const positions = mapTrackedPositions(platform.eventLedger);
    const orders = mapTrackedPendingOrders(platform.eventLedger);
    document.getElementById("trackedOpenPositionLabel").textContent = String(positions.length);
    document.getElementById("trackedPendingOrderLabel").textContent = String(orders.length);
    document.getElementById("trackedPositionList").innerHTML = positions.length ? positions.map(position => `
      <article class="record-card tracked-card">
        <div class="record-header"><div><div class="record-title-row"><h3>Symbol ID ${escapeText(position.symbolId)}</h3><span class="trade-badge ${position.side.toLowerCase()}">${escapeText(position.side)}</span></div><p class="record-id">Position #${escapeText(position.id)}</p></div><span class="source-badge">Execution event</span></div>
        <div class="details-grid">
          <div><span>Volume</span><strong>${escapeText(formatTrackedVolume(position))}</strong></div>
          <div><span>Entry</span><strong>${escapeText(position.entryPrice ?? "Not available")}</strong></div>
          <div><span>Stop Loss</span><strong>${escapeText(position.stopLoss ?? "Not set")}</strong></div>
          <div><span>Take Profit</span><strong>${escapeText(position.takeProfit ?? "Not set")}</strong></div>
          <div><span>Commission</span><strong>${escapeText(position.commission)}</strong></div>
          <div><span>Opened</span><strong>${escapeText(formatTrackedTimestamp(position.openTimestamp))}</strong></div>
        </div>
        <button type="button" disabled>Management Locked</button>
      </article>`).join("") : '<div class="empty-state">No event-tracked open positions.</div>';
    document.getElementById("trackedOrderList").innerHTML = orders.length ? orders.map(order => `
      <article class="record-card tracked-card">
        <div class="record-header"><div><div class="record-title-row"><h3>Symbol ID ${escapeText(order.symbolId)}</h3><span class="order-badge">${escapeText(order.side)} ${escapeText(order.orderType)}</span></div><p class="record-id">Order #${escapeText(order.id)}</p></div><span class="source-badge">Execution event</span></div>
        <div class="details-grid">
          <div><span>Volume</span><strong>${escapeText(formatTrackedVolume(order))}</strong></div>
          <div><span>Entry</span><strong>${escapeText(order.entryPrice ?? "Not available")}</strong></div>
          <div><span>Stop Loss</span><strong>${escapeText(order.stopLoss ?? "Not set")}</strong></div>
          <div><span>Take Profit</span><strong>${escapeText(order.takeProfit ?? "Not set")}</strong></div>
          <div><span>Created</span><strong>${escapeText(formatTrackedTimestamp(order.openTimestamp))}</strong></div>
          <div><span>Source</span><strong>Execution event</strong></div>
        </div>
        <button type="button" disabled>Order Action Locked</button>
      </article>`).join("") : '<div class="empty-state">No event-tracked pending entry orders.</div>';
  };
  const renderLedger = () => {
    const report = platform.eventLedger.export();
    const openPositions = mapTrackedPositions(platform.eventLedger);
    const pendingOrders = mapTrackedPendingOrders(platform.eventLedger);
    document.getElementById("trackedPositionCount").textContent = String(openPositions.length);
    document.getElementById("trackedOrderCount").textContent = String(pendingOrders.length);
    document.getElementById("capturedEventCount").textContent = String(report.events.length);
    ledgerOutput.textContent = report.events.length ? JSON.stringify(report, null, 2) : "Waiting for execution events...";
    renderTrackedLists();
  };
  document.getElementById("copyEventLedger").onclick = async () => {
    const text = JSON.stringify(platform.eventLedger.export(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      document.getElementById("copyEventLedger").textContent = "Copied";
    } catch {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ctrader-event-ledger.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  };
  document.getElementById("clearEventLedger").onclick = () => {
    platform.eventLedger.clear();
    renderLedger();
  };
  renderLedger();

  const interfaceOutput = document.getElementById("sdkInterfaceOutput");
  const renderInterfaceReport = () => {
    const report = inspectServerInterfaces();
    platform.serverInterfaceReport = report;
    interfaceOutput.textContent = JSON.stringify(report, null, 2);
  };
  document.getElementById("refreshInterfaceReport").onclick = renderInterfaceReport;
  document.getElementById("copyInterfaceReport").onclick = async () => {
    const report = JSON.stringify(platform.serverInterfaceReport || inspectServerInterfaces(), null, 2);
    try {
      await navigator.clipboard.writeText(report);
      document.getElementById("copyInterfaceReport").textContent = "Copied";
    } catch {
      const blob = new Blob([report], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ctrader-server-interfaces.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  };
  renderInterfaceReport();

  const discoveryOutput = document.getElementById("sdkDiscoveryOutput");
  const presetSelect = document.getElementById("serverDataPreset");
  const payloadInput = document.getElementById("serverDataPayload");
  probePresets.forEach((preset, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = preset.label;
    presetSelect.appendChild(option);
  });
  presetSelect.onchange = () => { payloadInput.value = probePresets[Number(presetSelect.value)].data; };
  document.getElementById("runServerDataProbe").onclick = async () => {
    const button = document.getElementById("runServerDataProbe");
    if (!provider?.adapter || !provider?.connected) {
      discoveryOutput.textContent = "Connect to cTrader first.";
      return;
    }
    button.disabled = true;
    discoveryOutput.textContent = "Requesting server data...";
    const result = await runServerDataProbe(provider.adapter, payloadInput.value.trim());
    platform.discoveryCaptures.push(result);
    platform.discoveryCaptures = platform.discoveryCaptures.slice(-20);
    discoveryOutput.textContent = JSON.stringify(platform.discoveryCaptures, null, 2);
    button.disabled = false;
  };
  document.getElementById("copyDiscoveryReport").onclick = async () => {
    const report = JSON.stringify({ version: platform.version, results: platform.discoveryCaptures }, null, 2);
    try { await navigator.clipboard.writeText(report); }
    catch {
      const blob = new Blob([report], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = "ctrader-server-data-probe.json";
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    }
  };
  document.getElementById("clearDiscoveryReport").onclick = () => {
    platform.discoveryCaptures = [];
    discoveryOutput.textContent = "Waiting for a probe...";
  };

  document.getElementById("copySdkResponse").onclick = async () => {
    const button = document.getElementById("copySdkResponse");
    const accountText = document.getElementById("sdkOutput").textContent;
    try {
      await navigator.clipboard.writeText(accountText);
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = "Copy Account Response"; }, 1500);
    } catch (error) {
      const blob = new Blob([accountText], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ctrader-account-response.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      button.textContent = "Downloaded";
      setTimeout(() => { button.textContent = "Copy Account Response"; }, 1500);
    }
  };
}

function sanitize(value) {
  const blocked = /token|secret|password|credential|^(name|email|login|traderid|groupid|clientmsgid|uuid)$/i;
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
    document.getElementById("sdkOutput").textContent = JSON.stringify(sanitize(snapshot), null, 2);
    stageOutput.textContent = "Connected. Account information received.";
    copy.disabled = false;
    copy.removeAttribute("disabled");
    copy.setAttribute("aria-disabled", "false");
    provider.subscribeToExecutionEvents(event => {
      platform.lastExecutionEvent = sanitize(event);
      const result = platform.eventLedger.ingest(event);
      logger.info("Execution event received", result);
      renderLedger();
    });
  } catch (error) {
    platform.currentMode = AppMode.CONNECTION_ERROR;
    platform.connectionError = String(error?.message || error);
    setStatus("Connection Failed", "disconnected");
    stageOutput.textContent = `Connection failed\n\n${platform.connectionError}\n\nReload the published cTrader placement, then retry once.`;
    document.getElementById("sdkOutput").textContent = "No account response received.";
  } finally {
    retry.disabled = false;
  }
}

logger.info("Application platform initialized", { version: platform.version, initialMode, liveTradingLocked: true });
if (initialMode === AppMode.CONNECTING) {
  window.addEventListener("DOMContentLoaded", () => setTimeout(connectReadOnly, 100), { once: true });
}
