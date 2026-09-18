import { MarketDataService } from "./services/market-data-service.js";
import { loadSessionEvents, saveSessionEvents, clearSessionEvents } from "./services/session-event-store.js";
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
let renderEventLedger = () => {};
let renderSubscriptionMonitor = () => {};
const provider = initialMode === AppMode.CONNECTING
  ? new CTraderProvider({
      logger,
      onStageChange: (stage, detail) => {
        if (stageOutput) stageOutput.textContent = `${stage}${detail ? `\n${detail}` : ""}`;
      }
    })
  : new DemoProvider();

const platform = {
  version: "5.2-readonly-console",
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
  eventLedger: new EventLedger({ maximumEvents: 100 }),
  marketDataService: null,
  marketDataStatus: "Not started",
  subscriptionMonitor: {
    state: "Not started",
    rawEventCount: 0,
    lastEventAt: null,
    lastError: null
  }
};
window.positionManagerPlatform = platform;

function setStatus(text, cls) {
  const element = document.getElementById("connectionStatus");
  if (!element) return;
  element.textContent = text;
  element.className = `status ${cls}`;
}

function ensurePartialViewBanner() {
  if (document.getElementById("partialViewBanner")) return;
  const tabBar = document.querySelector(".tab-bar");
  if (!tabBar) return;
  const banner = document.createElement("section");
  banner.id = "partialViewBanner";
  banner.className = "partial-view-banner";
  banner.innerHTML = `<div><strong>Partial Account View</strong><span>Only positions and pending orders observed through execution events are shown. Existing records may be missing.</span></div><span class="read-only-pill">READ-ONLY</span>`;
  tabBar.before(banner);
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
  section.className = "content-section diagnostic-panel collapsed";
  section.innerHTML = `
    <button id="toggleDiagnostics" class="diagnostic-toggle" type="button" aria-expanded="false">
      <span><strong>Connection diagnostics</strong><small id="diagnosticStatusText">Read-only monitor</small></span>
      <span id="diagnosticChevron">Show</span>
    </button>
    <div id="diagnosticBody" class="diagnostic-body" hidden>
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
    <p class="field-label sdk-response-label">Build and subscription monitor</p>
    <div class="monitor-grid">
      <div><span>Build</span><strong id="visibleBuildVersion">Loading...</strong></div>
      <div><span>Execution subscription</span><strong id="subscriptionState">Not started</strong></div>
      <div><span>Raw events received</span><strong id="rawEventCount">0</strong></div>
      <div><span>Market data</span><strong id="marketDataStatus">Not started</strong></div>
      <div><span>Last event received</span><strong id="lastRawEventAt">Never</strong></div>
      <div class="monitor-wide"><span>Subscription error</span><strong id="subscriptionError">None</strong></div>
    </div>
    <button id="resetSessionLedger" type="button" class="secondary-button">Reset Session Ledger</button>
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
    <div id="trackedOpenPositionLabel" hidden>0</div>
    <div id="trackedPendingOrderLabel" hidden>0</div>
    <div id="trackedPositionList" hidden></div>
    <div id="trackedOrderList" hidden></div>
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
    <pre id="sdkDiscoveryOutput" class="sdk-output">Waiting for a probe...</pre>
    </div>`;
  document.querySelector(".app-shell").prepend(section);
  const toggleDiagnostics = document.getElementById("toggleDiagnostics");
  const diagnosticBody = document.getElementById("diagnosticBody");
  const diagnosticChevron = document.getElementById("diagnosticChevron");
  toggleDiagnostics.onclick = () => {
    const expanded = toggleDiagnostics.getAttribute("aria-expanded") === "true";
    toggleDiagnostics.setAttribute("aria-expanded", String(!expanded));
    diagnosticBody.hidden = expanded;
    diagnosticChevron.textContent = expanded ? "Show" : "Hide";
    section.classList.toggle("collapsed", expanded);
  };
  stageOutput = document.getElementById("sdkStageOutput");
  document.getElementById("retrySdkConnection").onclick = connectReadOnly;
  renderSubscriptionMonitor = () => {
    const monitor = platform.subscriptionMonitor;
    document.getElementById("subscriptionState").textContent = monitor.state;
    document.getElementById("rawEventCount").textContent = String(monitor.rawEventCount);
    document.getElementById("lastRawEventAt").textContent = monitor.lastEventAt || "Never";
    document.getElementById("subscriptionError").textContent = monitor.lastError || "None";
    document.getElementById("marketDataStatus").textContent = platform.marketDataStatus;
    const compact = document.getElementById("diagnosticStatusText");
    if (compact) compact.textContent = `${monitor.state} | Events ${monitor.rawEventCount} | ${platform.marketDataStatus}`;
  };
  document.getElementById("visibleBuildVersion").textContent = platform.version;
  renderSubscriptionMonitor();
  document.getElementById("resetSessionLedger").onclick = () => {
    clearSessionEvents();
    platform.eventLedger.clear();
    platform.subscriptionMonitor.rawEventCount = 0;
    platform.subscriptionMonitor.lastEventAt = null;
    platform.subscriptionMonitor.lastError = null;
    renderSubscriptionMonitor();
    renderEventLedger();
  };

  const restoredEvents = loadSessionEvents();
  restoredEvents.forEach(event => platform.eventLedger.ingest(event));
  platform.subscriptionMonitor.rawEventCount = restoredEvents.length;
  if (restoredEvents.length) platform.subscriptionMonitor.lastEventAt = "Restored from session";

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
        <div class="record-header"><div><div class="record-title-row"><h3>${escapeText(platform.marketDataService?.getSymbolName(position.symbolId) || `Symbol ID ${position.symbolId}`)}</h3><span class="trade-badge ${position.side.toLowerCase()}">${escapeText(position.side)}</span></div><p class="record-id">Position #${escapeText(position.id)}</p></div><span class="source-badge">Execution event</span></div>
        <div class="details-grid">
          <div><span>Volume</span><strong>${escapeText(formatTrackedVolume(position))}</strong></div>
          <div><span>Entry</span><strong>${escapeText(position.entryPrice ?? "Not available")}</strong></div>
          <div><span>Stop Loss</span><strong>${escapeText(position.stopLoss ?? "Not set")}</strong></div>
          <div><span>Take Profit</span><strong>${escapeText(position.takeProfit ?? "Not set")}</strong></div>
          <div><span>Commission</span><strong>${escapeText(position.commission)}</strong></div>
          <div><span>Opened</span><strong>${escapeText(formatTrackedTimestamp(position.openTimestamp))}</strong></div>
          <div><span>Live Bid</span><strong>${escapeText((() => { const quote = platform.marketDataService?.getQuote(position.symbolId); const price = platform.marketDataService?.normalizeQuotePrice(position.symbolId, quote?.bid); return price ?? "Waiting for quote"; })())}</strong></div>
        </div>
        <button type="button" disabled>Management Locked</button>
      </article>`).join("") : '<div class="empty-state">No event-tracked open positions.</div>';
    document.getElementById("trackedOrderList").innerHTML = orders.length ? orders.map(order => `
      <article class="record-card tracked-card">
        <div class="record-header"><div><div class="record-title-row"><h3>${escapeText(platform.marketDataService?.getSymbolName(order.symbolId) || `Symbol ID ${order.symbolId}`)}</h3><span class="order-badge">${escapeText(order.side)} ${escapeText(order.orderType)}</span></div><p class="record-id">Order #${escapeText(order.id)}</p></div><span class="source-badge">Execution event</span></div>
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
  const quoteSnapshot = record => {
    const service = platform.marketDataService;
    const quote = service?.getQuote(record.symbolId);
    if (!service || !quote) return { bid: null, ask: null, updatedAt: null, stale: true };
    const bid = service.normalizeQuotePrice(record.symbolId, quote.bid);
    const ask = service.normalizeQuotePrice(record.symbolId, quote.ask);
    const timestamp = Number(quote.timestamp || quote.utcTimestamp || Date.now());
    const updatedAt = Number.isFinite(timestamp) ? new Date(timestamp).toLocaleTimeString() : "Unknown";
    return { bid, ask, updatedAt, stale: Number.isFinite(timestamp) ? Date.now() - timestamp > 15000 : false };
  };

  const estimatePositionPnl = position => {
    const quote = quoteSnapshot(position);
    const exitPrice = position.side === "Sell" ? quote.ask : quote.bid;
    if (!Number.isFinite(exitPrice) || !Number.isFinite(Number(position.entryPrice))) {
      return { value: null, quote };
    }
    const movement = position.side === "Sell"
      ? Number(position.entryPrice) - exitPrice
      : exitPrice - Number(position.entryPrice);
    const value = movement * Number(position.volumeUnits || 0) + Number(position.commission || 0);
    return { value, quote };
  };

  const renderPrimaryReadOnlyLists = () => {
    const positions = mapTrackedPositions(platform.eventLedger);
    const orders = mapTrackedPendingOrders(platform.eventLedger);
    const positionsList = document.getElementById("positionsList");
    const ordersList = document.getElementById("ordersList");
    const positionCount = document.getElementById("positionCount");
    const pendingOrderCount = document.getElementById("pendingOrderCount");
    const floatingProfit = document.getElementById("floatingProfit");
    const positionsStatus = document.getElementById("positionsStatus");
    const ordersStatus = document.getElementById("ordersStatus");

    positionCount.textContent = String(positions.length);
    pendingOrderCount.textContent = String(orders.length);
    positionsStatus.textContent = `${positions.length} event-tracked, partial view`;
    ordersStatus.textContent = `${orders.length} event-tracked, partial view`;

    const pnlValues = positions.map(estimatePositionPnl);
    const completePnl = pnlValues.length > 0 && pnlValues.every(item => Number.isFinite(item.value));
    const totalPnl = pnlValues.reduce((sum, item) => sum + (Number.isFinite(item.value) ? item.value : 0), 0);
    floatingProfit.textContent = completePnl
      ? `${totalPnl >= 0 ? "+" : ""}${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPnl)} est.`
      : "Waiting for quotes";
    floatingProfit.className = completePnl ? (totalPnl >= 0 ? "profit" : "loss") : "";

    positionsList.innerHTML = positions.length ? positions.map(position => {
      const estimate = estimatePositionPnl(position);
      const symbolName = platform.marketDataService?.getSymbolName(position.symbolId) || `Symbol ID ${position.symbolId}`;
      const symbolInfo = platform.marketDataService?.getSymbolInfo(position.symbolId) || {};
      const symbolDigits = Number(symbolInfo.digits ?? 5);
      const formatPrice = value => Number.isFinite(Number(value)) ? Number(value).toFixed(symbolDigits) : "Waiting for quote";
      const quoteText = estimate.quote.bid == null
        ? "Waiting for quote"
        : `Bid ${formatPrice(estimate.quote.bid)} | Ask ${formatPrice(estimate.quote.ask)}${estimate.quote.stale ? " | STALE" : ""}`;
      const pnlText = Number.isFinite(estimate.value)
        ? `${estimate.value >= 0 ? "+" : ""}${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(estimate.value)}`
        : "Unavailable";
      return `
        <article class="record-card tracked-card">
          <div class="record-header">
            <div><div class="record-title-row"><h3>${escapeText(symbolName)}</h3><span class="trade-badge ${position.side.toLowerCase()}">${escapeText(position.side)}</span></div><p class="record-id">Position #${escapeText(position.id)}</p></div>
            <span class="source-badge">Partial live view</span>
          </div>
          <div class="details-grid">
            <div><span>Volume</span><strong>${escapeText(formatTrackedVolume(position))}</strong></div>
            <div><span>Entry</span><strong>${escapeText(position.entryPrice ?? "Unavailable")}</strong></div>
            <div><span>Stop Loss</span><strong>${escapeText(position.stopLoss ?? "Not set")}</strong></div>
            <div><span>Take Profit</span><strong>${escapeText(position.takeProfit ?? "Not set")}</strong></div>
            <div><span>Estimated P/L</span><strong>${escapeText(pnlText)}</strong></div>
            <div><span>Live quote</span><strong>${escapeText(quoteText)}</strong></div>
            <div><span>Quote update</span><strong>${escapeText(estimate.quote.updatedAt || "Never")}</strong></div>
            <div><span>Opened</span><strong>${escapeText(formatTrackedTimestamp(position.openTimestamp))}</strong></div>
          </div>
          <p class="read-only-note">Event-tracked record only. Management is locked.</p>
        </article>`;
    }).join("") : '<div class="empty-state">No event-tracked open positions. Existing account positions may be missing.</div>';

    ordersList.innerHTML = orders.length ? orders.map(order => {
      const symbolName = platform.marketDataService?.getSymbolName(order.symbolId) || `Symbol ID ${order.symbolId}`;
      return `
        <article class="record-card tracked-card">
          <div class="record-header">
            <div><div class="record-title-row"><h3>${escapeText(symbolName)}</h3><span class="order-badge">${escapeText(order.side)} ${escapeText(order.orderType)}</span></div><p class="record-id">Order #${escapeText(order.id)}</p></div>
            <span class="source-badge">Partial live view</span>
          </div>
          <div class="details-grid">
            <div><span>Volume</span><strong>${escapeText(formatTrackedVolume(order))}</strong></div>
            <div><span>Entry</span><strong>${escapeText(order.entryPrice ?? "Unavailable")}</strong></div>
            <div><span>Stop Loss</span><strong>${escapeText(order.stopLoss ?? "Not set")}</strong></div>
            <div><span>Take Profit</span><strong>${escapeText(order.takeProfit ?? "Not set")}</strong></div>
            <div><span>Created</span><strong>${escapeText(formatTrackedTimestamp(order.openTimestamp))}</strong></div>
            <div><span>Status</span><strong>Accepted, action locked</strong></div>
          </div>
        </article>`;
    }).join("") : '<div class="empty-state">No event-tracked pending entry orders. Existing account orders may be missing.</div>';
  };

  renderEventLedger = () => {
    const report = platform.eventLedger.export();
    const openPositions = mapTrackedPositions(platform.eventLedger);
    const pendingOrders = mapTrackedPendingOrders(platform.eventLedger);
    document.getElementById("trackedPositionCount").textContent = String(openPositions.length);
    document.getElementById("trackedOrderCount").textContent = String(pendingOrders.length);
    document.getElementById("capturedEventCount").textContent = String(report.events.length);
    ledgerOutput.textContent = report.events.length ? JSON.stringify(report, null, 2) : "Waiting for execution events...";
    renderTrackedLists();
    renderPrimaryReadOnlyLists();
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
    clearSessionEvents();
    platform.eventLedger.clear();
    renderEventLedger();
  };
  renderEventLedger();
  renderSubscriptionMonitor();

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
  ensurePartialViewBanner();
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
    platform.marketDataStatus = "Starting";
    renderSubscriptionMonitor();
    platform.marketDataService = new MarketDataService({
      adapter: provider.adapter,
      logger,
      onStatus: status => {
        platform.marketDataStatus = status;
        renderSubscriptionMonitor();
      },
      onQuote: () => renderEventLedger()
    });
    try {
      await platform.marketDataService.initialize();
    } catch (marketDataError) {
      platform.marketDataStatus = `Error: ${marketDataError?.message || String(marketDataError)}`;
      renderSubscriptionMonitor();
    }

    platform.subscriptionMonitor.state = "Starting";
    platform.subscriptionMonitor.lastError = null;
    renderSubscriptionMonitor();
    try {
      provider.subscribeToExecutionEvents(event => {
        platform.subscriptionMonitor.rawEventCount += 1;
        platform.subscriptionMonitor.lastEventAt = new Date().toISOString();
        platform.subscriptionMonitor.state = "Active";
        renderSubscriptionMonitor();

        platform.lastExecutionEvent = sanitize(event);
        const storedEvents = loadSessionEvents();
        storedEvents.push(event);
        saveSessionEvents(storedEvents);
        const result = platform.eventLedger.ingest(event);
        logger.info("Execution event received", result);
        renderEventLedger();
        const trackedPositions = mapTrackedPositions(platform.eventLedger);
        const trackedOrders = mapTrackedPendingOrders(platform.eventLedger);
        const symbolIds = [...trackedPositions, ...trackedOrders].map(record => record.symbolId);
        platform.marketDataService?.ensureSymbols(symbolIds)
          .then(() => renderEventLedger())
          .catch(error => {
            platform.marketDataStatus = `Error: ${error?.message || String(error)}`;
            renderSubscriptionMonitor();
          });
      });
      platform.subscriptionMonitor.state = "Active";
      renderSubscriptionMonitor();
    } catch (subscriptionError) {
      platform.subscriptionMonitor.state = "Error";
      platform.subscriptionMonitor.lastError = String(subscriptionError?.message || subscriptionError);
      renderSubscriptionMonitor();
      throw subscriptionError;
    }
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
