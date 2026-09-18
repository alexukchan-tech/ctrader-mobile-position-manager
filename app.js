"use strict";

const DEMO_MODE = true;

const demoPositions = [
    {
        id: "12345678",
        symbol: "EURUSD",
        direction: "Buy",
        volumeUnits: 25000,
        volumeLots: 0.25,
        entryPrice: 1.10000,
        currentPrice: 1.10320,
        stopLoss: 1.09800,
        takeProfit: 1.10600,
        grossProfit: 640.00,
        netProfit: 612.50,
        profitPips: 32.0,
        commission: -22.50,
        swap: -5.00,
        currency: "HKD",
        openedAt: "2026-09-18 08:12",
        label: "Desktop Trade Panel"
    },
    {
        id: "12345679",
        symbol: "XAUUSD",
        direction: "Sell",
        volumeUnits: 100,
        volumeLots: 0.10,
        entryPrice: 2680.00,
        currentPrice: 2675.40,
        stopLoss: 2690.00,
        takeProfit: 2650.00,
        grossProfit: 460.00,
        netProfit: 438.00,
        profitPips: 46.0,
        commission: -18.00,
        swap: -4.00,
        currency: "HKD",
        openedAt: "2026-09-18 07:45",
        label: "Manual"
    },
    {
        id: "12345680",
        symbol: "GBPUSD",
        direction: "Buy",
        volumeUnits: 15000,
        volumeLots: 0.15,
        entryPrice: 1.27400,
        currentPrice: 1.27250,
        stopLoss: 1.27000,
        takeProfit: 1.28200,
        grossProfit: -225.00,
        netProfit: -243.50,
        profitPips: -15.0,
        commission: -16.50,
        swap: -2.00,
        currency: "HKD",
        openedAt: "2026-09-17 22:20",
        label: "Manual"
    }
];

const demoPendingOrders = [
    {
        id: "87654321",
        symbol: "EURUSD",
        type: "Buy Limit",
        volumeUnits: 20000,
        volumeLots: 0.20,
        entryPrice: 1.09800,
        currentPrice: 1.10320,
        stopLoss: 1.09500,
        takeProfit: 1.10400,
        distancePips: 52.0,
        createdAt: "2026-09-18 08:45",
        expiration: "No expiration",
        label: "Mobile Preview"
    },
    {
        id: "87654322",
        symbol: "XAUUSD",
        type: "Sell Stop",
        volumeUnits: 100,
        volumeLots: 0.10,
        entryPrice: 2668.00,
        currentPrice: 2675.40,
        stopLoss: 2680.00,
        takeProfit: 2640.00,
        distancePips: 74.0,
        createdAt: "2026-09-18 09:05",
        expiration: "2026-09-19 23:59",
        label: "Mobile Preview"
    }
];

const state = {
    activeTab: "positions",
    selectedPositionId: null,
    positions: DEMO_MODE ? [...demoPositions] : [],
    pendingOrders: DEMO_MODE ? [...demoPendingOrders] : []
};

const elements = {
    connectionStatus: document.getElementById("connectionStatus"),
    positionCount: document.getElementById("positionCount"),
    pendingOrderCount: document.getElementById("pendingOrderCount"),
    floatingProfit: document.getElementById("floatingProfit"),
    positionsTab: document.getElementById("positionsTab"),
    ordersTab: document.getElementById("ordersTab"),
    positionsView: document.getElementById("positionsView"),
    ordersView: document.getElementById("ordersView"),
    positionsStatus: document.getElementById("positionsStatus"),
    ordersStatus: document.getElementById("ordersStatus"),
    positionsList: document.getElementById("positionsList"),
    ordersList: document.getElementById("ordersList"),
    closeSymbolButton: document.getElementById("closeSymbolButton"),
    closeAllButton: document.getElementById("closeAllButton")
};

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatMoney(value, currency = "HKD") {
    const sign = value > 0 ? "+" : "";
    return `${sign}${new Intl.NumberFormat("en-HK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value)} ${currency}`;
}

function formatNumber(value, maximumFractionDigits = 5) {
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits
    }).format(value);
}

function profitClass(value) {
    if (value > 0) return "positive";
    if (value < 0) return "negative";
    return "neutral";
}

function renderSummary() {
    const floatingProfit = state.positions.reduce(
        (total, position) => total + position.netProfit,
        0
    );

    elements.positionCount.textContent = String(state.positions.length);
    elements.pendingOrderCount.textContent = String(state.pendingOrders.length);
    elements.floatingProfit.textContent = formatMoney(floatingProfit);
    elements.floatingProfit.className = profitClass(floatingProfit);
}

function renderPositions() {
    elements.positionsStatus.textContent = `${state.positions.length} demo position${state.positions.length === 1 ? "" : "s"}`;

    if (state.positions.length === 0) {
        elements.positionsList.innerHTML = '<div class="empty-state">No open positions.</div>';
        return;
    }

    elements.positionsList.innerHTML = state.positions.map((position) => `
        <article class="record-card position-card">
            <div class="record-header">
                <div>
                    <div class="record-title-row">
                        <h3>${escapeHtml(position.symbol)}</h3>
                        <span class="trade-badge ${position.direction.toLowerCase()}">
                            ${escapeHtml(position.direction)}
                        </span>
                    </div>
                    <p class="record-id">Position #${escapeHtml(position.id)}</p>
                </div>
                <strong class="record-profit ${profitClass(position.netProfit)}">
                    ${formatMoney(position.netProfit, position.currency)}
                </strong>
            </div>

            <div class="details-grid">
                <div><span>Volume</span><strong>${formatNumber(position.volumeUnits, 0)} units</strong></div>
                <div><span>Lots</span><strong>${formatNumber(position.volumeLots, 2)}</strong></div>
                <div><span>Entry</span><strong>${formatNumber(position.entryPrice)}</strong></div>
                <div><span>Current</span><strong>${formatNumber(position.currentPrice)}</strong></div>
                <div><span>Stop Loss</span><strong>${position.stopLoss == null ? "Not set" : formatNumber(position.stopLoss)}</strong></div>
                <div><span>Take Profit</span><strong>${position.takeProfit == null ? "Not set" : formatNumber(position.takeProfit)}</strong></div>
                <div><span>Pips</span><strong class="${profitClass(position.profitPips)}">${position.profitPips > 0 ? "+" : ""}${formatNumber(position.profitPips, 1)}</strong></div>
                <div><span>Opened</span><strong>${escapeHtml(position.openedAt)}</strong></div>
            </div>

            <button
                type="button"
                class="primary-button manage-position-button"
                data-position-id="${escapeHtml(position.id)}"
            >
                Manage Position
            </button>
        </article>
    `).join("");

    document.querySelectorAll(".manage-position-button").forEach((button) => {
        button.addEventListener("click", () => openPositionManager(button.dataset.positionId));
    });
}

function renderPendingOrders() {
    elements.ordersStatus.textContent = `${state.pendingOrders.length} demo order${state.pendingOrders.length === 1 ? "" : "s"}`;

    if (state.pendingOrders.length === 0) {
        elements.ordersList.innerHTML = '<div class="empty-state">No pending orders.</div>';
        return;
    }

    elements.ordersList.innerHTML = state.pendingOrders.map((order) => `
        <article class="record-card">
            <div class="record-header">
                <div>
                    <div class="record-title-row">
                        <h3>${escapeHtml(order.symbol)}</h3>
                        <span class="order-badge">${escapeHtml(order.type)}</span>
                    </div>
                    <p class="record-id">Order #${escapeHtml(order.id)}</p>
                </div>
            </div>

            <div class="details-grid">
                <div><span>Volume</span><strong>${formatNumber(order.volumeUnits, 0)} units</strong></div>
                <div><span>Lots</span><strong>${formatNumber(order.volumeLots, 2)}</strong></div>
                <div><span>Entry</span><strong>${formatNumber(order.entryPrice)}</strong></div>
                <div><span>Current</span><strong>${formatNumber(order.currentPrice)}</strong></div>
                <div><span>Stop Loss</span><strong>${order.stopLoss == null ? "Not set" : formatNumber(order.stopLoss)}</strong></div>
                <div><span>Take Profit</span><strong>${order.takeProfit == null ? "Not set" : formatNumber(order.takeProfit)}</strong></div>
                <div><span>Distance</span><strong>${formatNumber(order.distancePips, 1)} pips</strong></div>
                <div><span>Expiration</span><strong>${escapeHtml(order.expiration)}</strong></div>
            </div>

            <div class="read-only-note">Read-only during the browser demo.</div>
        </article>
    `).join("");
}

function setActiveTab(tabName) {
    const showPositions = tabName === "positions";
    state.activeTab = tabName;

    elements.positionsTab.classList.toggle("active", showPositions);
    elements.ordersTab.classList.toggle("active", !showPositions);
    elements.positionsTab.setAttribute("aria-selected", String(showPositions));
    elements.ordersTab.setAttribute("aria-selected", String(!showPositions));

    elements.positionsView.classList.toggle("hidden", !showPositions);
    elements.ordersView.classList.toggle("hidden", showPositions);
    elements.positionsView.hidden = !showPositions;
    elements.ordersView.hidden = showPositions;
}

function closeModal() {
    document.getElementById("positionModal")?.remove();
    state.selectedPositionId = null;
}

function showDemoNotice(message) {
    window.alert(`${message}\n\nDemo mode only. No cTrader account action was sent.`);
}

function openPositionManager(positionId) {
    const position = state.positions.find((item) => item.id === positionId);
    if (!position) return;

    state.selectedPositionId = positionId;
    closeModal();
    state.selectedPositionId = positionId;

    const modal = document.createElement("div");
    modal.id = "positionModal";
    modal.className = "modal-backdrop";
    modal.innerHTML = `
        <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="positionModalTitle">
            <div class="modal-header">
                <div>
                    <p class="eyebrow">Manage Position</p>
                    <h2 id="positionModalTitle">${escapeHtml(position.symbol)} ${escapeHtml(position.direction)}</h2>
                    <p class="record-id">#${escapeHtml(position.id)}</p>
                </div>
                <button type="button" class="icon-button" id="closeModalButton" aria-label="Close dialog">×</button>
            </div>

            <div class="details-grid modal-details">
                <div><span>Volume</span><strong>${formatNumber(position.volumeUnits, 0)} units</strong></div>
                <div><span>Net P/L</span><strong class="${profitClass(position.netProfit)}">${formatMoney(position.netProfit, position.currency)}</strong></div>
                <div><span>Entry</span><strong>${formatNumber(position.entryPrice)}</strong></div>
                <div><span>Current SL</span><strong>${position.stopLoss == null ? "Not set" : formatNumber(position.stopLoss)}</strong></div>
            </div>

            <div class="management-block">
                <h3>Breakeven</h3>
                <div class="form-row">
                    <label for="beBuffer">Buffer</label>
                    <input id="beBuffer" type="number" value="0" min="0" step="0.1" inputmode="decimal">
                    <select id="beUnit" aria-label="Breakeven buffer unit">
                        <option value="pips">Pips</option>
                        <option value="r">R</option>
                    </select>
                </div>
                <button type="button" class="primary-button" id="breakevenButton">Review Breakeven</button>
            </div>

            <div class="management-block">
                <h3>Partial Close</h3>
                <div class="preset-row">
                    <button type="button" class="preset-button" data-percent="25">25%</button>
                    <button type="button" class="preset-button" data-percent="50">50%</button>
                    <button type="button" class="preset-button" data-percent="75">75%</button>
                </div>
                <div class="form-row">
                    <label for="partialClosePercent">Close</label>
                    <input id="partialClosePercent" type="number" value="25" min="1" max="99" step="1" inputmode="numeric">
                    <span>%</span>
                </div>
                <p id="partialClosePreview" class="calculation-note"></p>
                <button type="button" class="primary-button" id="partialCloseButton">Review Partial Close</button>
            </div>

            <div class="management-block destructive-block">
                <h3>Danger Zone</h3>
                <button type="button" class="danger-button" id="closeSelectedButton">Review Close This Position</button>
            </div>
        </section>
    `;

    document.body.appendChild(modal);

    const percentInput = document.getElementById("partialClosePercent");
    const preview = document.getElementById("partialClosePreview");

    function updatePartialPreview() {
        const percent = Math.min(99, Math.max(1, Number(percentInput.value) || 0));
        const requested = position.volumeUnits * percent / 100;
        const rounded = Math.floor(requested / 1000) * 1000;
        const remaining = position.volumeUnits - rounded;
        preview.textContent = `Demo estimate: close ${formatNumber(rounded, 0)} units; remaining ${formatNumber(remaining, 0)} units.`;
    }

    document.getElementById("closeModalButton").addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    document.querySelectorAll(".preset-button").forEach((button) => {
        button.addEventListener("click", () => {
            percentInput.value = button.dataset.percent;
            updatePartialPreview();
        });
    });

    percentInput.addEventListener("input", updatePartialPreview);
    updatePartialPreview();

    document.getElementById("breakevenButton").addEventListener("click", () => {
        const buffer = Number(document.getElementById("beBuffer").value) || 0;
        const unit = document.getElementById("beUnit").value === "r" ? "R" : "pips";
        showDemoNotice(`Breakeven preview for ${position.symbol} #${position.id}: buffer ${buffer} ${unit}.`);
    });

    document.getElementById("partialCloseButton").addEventListener("click", () => {
        showDemoNotice(`Partial-close preview for ${position.symbol} #${position.id}: ${percentInput.value}% of current volume.`);
    });

    document.getElementById("closeSelectedButton").addEventListener("click", () => {
        showDemoNotice(`Close-position preview for ${position.symbol} ${position.direction} #${position.id}.`);
    });
}

function initializeDemo() {
    elements.connectionStatus.textContent = "Demo Mode";
    elements.connectionStatus.classList.remove("disconnected");
    elements.connectionStatus.classList.add("demo");

    elements.closeSymbolButton.disabled = false;
    elements.closeAllButton.disabled = false;

    elements.positionsTab.addEventListener("click", () => setActiveTab("positions"));
    elements.ordersTab.addEventListener("click", () => setActiveTab("orders"));

    renderSummary();
    renderPositions();
    renderPendingOrders();
    setActiveTab("positions");
}

document.addEventListener("DOMContentLoaded", initializeDemo);

// Demo v2 enhancement layer. No requests are sent to cTrader.
(function enableDemoV2() {
    const originalPositions = JSON.parse(JSON.stringify(demoPositions));
    let symbolFilter = "ALL";
    let directionFilter = "ALL";
    let sortMode = "NEWEST";

    const sectionHeading = elements.positionsView.querySelector(".section-heading");
    const toolbar = document.createElement("div");
    toolbar.className = "toolbar-grid";
    toolbar.innerHTML = `
        <select id="symbolFilter" aria-label="Filter positions by symbol"></select>
        <select id="directionFilter" aria-label="Filter positions by direction">
            <option value="ALL">All directions</option>
            <option value="Buy">Buy only</option>
            <option value="Sell">Sell only</option>
        </select>
        <select id="positionSort" aria-label="Sort positions">
            <option value="NEWEST">Newest first</option>
            <option value="PROFIT">Highest profit</option>
            <option value="LOSS">Largest loss</option>
            <option value="SYMBOL">Symbol</option>
            <option value="VOLUME">Largest volume</option>
        </select>
        <button id="resetDemoButton" class="secondary-button" type="button">Reset Demo Data</button>`;
    sectionHeading.insertAdjacentElement("afterend", toolbar);

    function rebuildSymbolFilter() {
        const symbols = [...new Set(state.positions.map(p => p.symbol))].sort();
        const select = document.getElementById("symbolFilter");
        select.innerHTML = '<option value="ALL">All symbols</option>' +
            symbols.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
        if (symbols.includes(symbolFilter)) select.value = symbolFilter;
        else symbolFilter = "ALL";
    }

    function filteredPositions() {
        let rows = state.positions.filter(p =>
            (symbolFilter === "ALL" || p.symbol === symbolFilter) &&
            (directionFilter === "ALL" || p.direction === directionFilter));
        rows = [...rows];
        if (sortMode === "PROFIT") rows.sort((a,b) => b.netProfit - a.netProfit);
        else if (sortMode === "LOSS") rows.sort((a,b) => a.netProfit - b.netProfit);
        else if (sortMode === "SYMBOL") rows.sort((a,b) => a.symbol.localeCompare(b.symbol));
        else if (sortMode === "VOLUME") rows.sort((a,b) => b.volumeUnits - a.volumeUnits);
        else rows.sort((a,b) => b.openedAt.localeCompare(a.openedAt));
        return rows;
    }

    const baseRenderPositions = renderPositions;
    renderPositions = function renderFilteredPositions() {
        const all = state.positions;
        const visible = filteredPositions();
        state.positions = visible;
        baseRenderPositions();
        elements.positionsStatus.textContent = `${visible.length} of ${all.length} demo positions`;
        state.positions = all;
    };

    function refreshAll(message) {
        rebuildSymbolFilter();
        renderSummary();
        renderPositions();
        renderPendingOrders();
        if (message) {
            const old = document.querySelector(".result-banner");
            old?.remove();
            const banner = document.createElement("div");
            banner.className = "result-banner";
            banner.textContent = message;
            elements.positionsView.insertBefore(banner, toolbar);
        }
    }

    function showConfirm({title, body, confirmText, typedPhrase, onConfirm}) {
        document.getElementById("actionConfirmModal")?.remove();
        const modal = document.createElement("div");
        modal.id = "actionConfirmModal";
        modal.className = "modal-backdrop";
        modal.innerHTML = `
          <section class="modal-panel" role="dialog" aria-modal="true">
            <div class="modal-header"><h2>${escapeHtml(title)}</h2>
              <button class="icon-button" id="cancelActionTop" type="button">×</button></div>
            <div class="confirm-summary">${body}</div>
            ${typedPhrase ? `<p class="confirm-warning">Type <strong>${escapeHtml(typedPhrase)}</strong> to enable confirmation.</p>
              <input id="typedConfirmation" class="typed-confirm" autocomplete="off">` : ""}
            <div class="action-row" style="margin-top:14px">
              <button id="cancelAction" type="button">Cancel</button>
              <button id="confirmAction" class="danger-button" type="button" ${typedPhrase ? "disabled" : ""}>${escapeHtml(confirmText)}</button>
            </div>
          </section>`;
        document.body.appendChild(modal);
        const close = () => modal.remove();
        document.getElementById("cancelActionTop").onclick = close;
        document.getElementById("cancelAction").onclick = close;
        modal.addEventListener("click", e => { if (e.target === modal) close(); });
        if (typedPhrase) {
            const input = document.getElementById("typedConfirmation");
            input.addEventListener("input", () => {
                document.getElementById("confirmAction").disabled = input.value.trim().toUpperCase() !== typedPhrase;
            });
        }
        document.getElementById("confirmAction").onclick = () => { close(); onConfirm(); };
    }

    function impactBody(rows) {
        const buys = rows.filter(p => p.direction === "Buy").length;
        const sells = rows.length - buys;
        const volume = rows.reduce((n,p) => n + p.volumeUnits, 0);
        const pnl = rows.reduce((n,p) => n + p.netProfit, 0);
        const symbols = [...new Set(rows.map(p => p.symbol))].join(", ");
        return `<strong>Positions:</strong> ${rows.length}<br>
          <strong>Buy / Sell:</strong> ${buys} / ${sells}<br>
          <strong>Total volume:</strong> ${formatNumber(volume,0)} units<br>
          <strong>Floating P/L:</strong> ${formatMoney(pnl)}<br>
          <strong>Symbols:</strong> ${escapeHtml(symbols || "None")}<br><br>
          <span class="confirm-warning">Demo mode only. This changes synthetic browser data.</span>`;
    }

    document.getElementById("symbolFilter").onchange = e => { symbolFilter = e.target.value; renderPositions(); };
    document.getElementById("directionFilter").onchange = e => { directionFilter = e.target.value; renderPositions(); };
    document.getElementById("positionSort").onchange = e => { sortMode = e.target.value; renderPositions(); };
    document.getElementById("resetDemoButton").onclick = () => {
        state.positions = JSON.parse(JSON.stringify(originalPositions));
        symbolFilter = "ALL";
        directionFilter = "ALL";
        sortMode = "NEWEST";
        document.getElementById("directionFilter").value = "ALL";
        document.getElementById("positionSort").value = "NEWEST";
        refreshAll("Demo positions restored.");
    };

    // Replace simple Close All demo notices with full review and confirmation.
    elements.closeSymbolButton.replaceWith(elements.closeSymbolButton.cloneNode(true));
    elements.closeAllButton.replaceWith(elements.closeAllButton.cloneNode(true));
    elements.closeSymbolButton = document.getElementById("closeSymbolButton");
    elements.closeAllButton = document.getElementById("closeAllButton");
    elements.closeSymbolButton.disabled = false;
    elements.closeAllButton.disabled = false;

    elements.closeSymbolButton.onclick = () => {
        const symbols = [...new Set(state.positions.map(p => p.symbol))].sort();
        if (!symbols.length) return;
        const selected = symbolFilter !== "ALL" ? symbolFilter : symbols[0];
        const rows = state.positions.filter(p => p.symbol === selected);
        showConfirm({
            title: `Close All ${selected} Positions`, body: impactBody(rows),
            confirmText: `Confirm Close ${selected}`,
            onConfirm: () => {
                state.positions = state.positions.filter(p => p.symbol !== selected);
                refreshAll(`Demo complete: ${rows.length} ${selected} position(s) removed.`);
            }
        });
    };

    elements.closeAllButton.onclick = () => {
        const rows = [...state.positions];
        if (!rows.length) return;
        showConfirm({
            title: "Close All Positions", body: impactBody(rows),
            confirmText: "Confirm Close All", typedPhrase: "CLOSE ALL",
            onConfirm: () => {
                state.positions = [];
                refreshAll(`Demo complete: ${rows.length} position(s) removed.`);
            }
        });
    };

    // Capture management actions and turn final browser demo actions into real state changes.
    document.addEventListener("click", event => {
        const closeButton = event.target.closest("#closeSelectedButton");
        if (closeButton && state.selectedPositionId) {
            event.stopImmediatePropagation();
            const p = state.positions.find(x => x.id === state.selectedPositionId);
            if (!p) return;

            const completeClose = () => {
                closeModal();
                state.positions = state.positions.filter(x => x.id !== p.id);
                refreshAll(`Demo complete: ${p.symbol} #${p.id} removed.`);
            };

            const requireConfirmation = window.tradePanelPreferences
                ? window.tradePanelPreferences.requireCloseSelectedConfirmation !== false
                : (() => {
                    try {
                        const saved = JSON.parse(localStorage.getItem("ctraderMobilePositionManager.demoSettings.v1") || "{}");
                        return saved.requireCloseSelectedConfirmation !== false;
                    } catch {
                        return true;
                    }
                })();

            if (!requireConfirmation) {
                completeClose();
                return;
            }

            showConfirm({
                title: "Close Selected Position",
                body: impactBody([p]), confirmText: "Confirm Close Position",
                onConfirm: completeClose
            });
        }
        const partialButton = event.target.closest("#partialCloseButton");
        if (partialButton && state.selectedPositionId) {
            event.stopImmediatePropagation();
            const p = state.positions.find(x => x.id === state.selectedPositionId);
            const percent = Math.min(99, Math.max(1, Number(document.getElementById("partialClosePercent")?.value) || 0));
            const closeUnits = Math.floor((p.volumeUnits * percent / 100) / 1000) * 1000;
            const remaining = p.volumeUnits - closeUnits;
            showConfirm({
                title: "Confirm Partial Close",
                body: `<strong>Position:</strong> ${p.symbol} #${p.id}<br><strong>Current:</strong> ${formatNumber(p.volumeUnits,0)} units<br><strong>Close:</strong> ${formatNumber(closeUnits,0)} units (${percent}%)<br><strong>Remaining:</strong> ${formatNumber(remaining,0)} units<br><br><span class="confirm-warning">Temporary demo step: 1,000 units.</span>`,
                confirmText: "Confirm Partial Close",
                onConfirm: () => {
                    if (closeUnits <= 0 || remaining <= 0) return;
                    p.volumeUnits = remaining;
                    p.volumeLots = Math.max(0, p.volumeLots * remaining / (remaining + closeUnits));
                    closeModal();
                    refreshAll(`Demo partial close complete for ${p.symbol} #${p.id}.`);
                }
            });
        }
    }, true);

    refreshAll();
})();


// Demo v3: pending-order details and local browser preferences.
(function enableDemoV3() {
    const SETTINGS_KEY = "ctraderMobilePositionManager.demoSettings.v1";
    const defaultSettings = {
        volumeDisplay: "both",
        defaultBeBuffer: 0,
        defaultBeUnit: "pips",
        defaultPartialPercent: 25,
        partialPreset1: 25,
        partialPreset2: 50,
        partialPreset3: 75,
        requireCloseSelectedConfirmation: true,
        requireTypedCloseAll: true
    };

    function loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
            return { ...defaultSettings, ...saved };
        } catch {
            return { ...defaultSettings };
        }
    }

    let demoSettings = loadSettings();
    window.tradePanelPreferences = { ...demoSettings };

    function saveSettings() {
        window.tradePanelPreferences = { ...demoSettings };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(demoSettings));
    }

    function addSettingsButton() {
        if (document.getElementById("settingsButton")) return;
        const header = document.querySelector(".app-header");
        const status = document.getElementById("connectionStatus");
        const group = document.createElement("div");
        group.className = "header-actions";
        status.replaceWith(group);
        group.appendChild(status);
        const button = document.createElement("button");
        button.id = "settingsButton";
        button.className = "settings-button";
        button.type = "button";
        button.textContent = "Settings";
        group.appendChild(button);
        button.addEventListener("click", openSettings);
    }

    function closeNamedModal(id) {
        document.getElementById(id)?.remove();
    }

    function openSettings() {
        closeNamedModal("settingsModal");
        const modal = document.createElement("div");
        modal.id = "settingsModal";
        modal.className = "modal-backdrop";
        modal.innerHTML = `
            <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
                <div class="modal-header">
                    <div>
                        <p class="eyebrow">Demo Preferences</p>
                        <h2 id="settingsTitle">Settings</h2>
                    </div>
                    <button class="icon-button" id="closeSettingsTop" type="button" aria-label="Close settings">×</button>
                </div>

                <div class="management-block">
                    <h3>Display</h3>
                    <label class="field-label" for="volumeDisplaySetting">Volume display</label>
                    <select id="volumeDisplaySetting">
                        <option value="units">Units</option>
                        <option value="lots">Lots</option>
                        <option value="both">Units and lots</option>
                    </select>
                </div>

                <div class="management-block">
                    <h3>Breakeven Defaults</h3>
                    <div class="form-row">
                        <label for="defaultBeBufferSetting">Buffer</label>
                        <input id="defaultBeBufferSetting" type="number" min="0" step="0.1" inputmode="decimal">
                        <select id="defaultBeUnitSetting" aria-label="Default breakeven unit">
                            <option value="pips">Pips</option>
                            <option value="r">R</option>
                        </select>
                    </div>
                </div>

                <div class="management-block">
                    <h3>Partial Close Defaults</h3>
                    <label class="field-label" for="defaultPartialSetting">Default percentage</label>
                    <input id="defaultPartialSetting" type="number" min="1" max="99" step="1" inputmode="numeric">
                    <div class="settings-preset-grid">
                        <label>Preset 1<input id="preset1Setting" type="number" min="1" max="99"></label>
                        <label>Preset 2<input id="preset2Setting" type="number" min="1" max="99"></label>
                        <label>Preset 3<input id="preset3Setting" type="number" min="1" max="99"></label>
                    </div>
                </div>

                <div class="management-block">
                    <h3>Safety</h3>
                    <label class="check-row">
                        <input id="closeSelectedConfirmSetting" type="checkbox">
                        <span>Require confirmation before closing a selected position</span>
                    </label>
                    <label class="check-row locked-setting">
                        <input type="checkbox" checked disabled>
                        <span>Review before partial close, permanently enabled</span>
                    </label>
                    <label class="check-row locked-setting">
                        <input id="typedCloseAllSetting" type="checkbox" checked disabled>
                        <span>Type CLOSE ALL for account-wide close, permanently enabled</span>
                    </label>
                </div>

                <p class="settings-note">
                    Demo preferences are stored only in this browser. No account credentials, live prices,
                    positions, orders, or executable instructions are stored.
                </p>

                <div class="action-row">
                    <button id="resetSettingsButton" type="button">Reset Defaults</button>
                    <button id="saveSettingsButton" class="primary-button" type="button">Save Settings</button>
                </div>
            </section>`;
        document.body.appendChild(modal);

        document.getElementById("volumeDisplaySetting").value = demoSettings.volumeDisplay;
        document.getElementById("defaultBeBufferSetting").value = demoSettings.defaultBeBuffer;
        document.getElementById("defaultBeUnitSetting").value = demoSettings.defaultBeUnit;
        document.getElementById("defaultPartialSetting").value = demoSettings.defaultPartialPercent;
        document.getElementById("preset1Setting").value = demoSettings.partialPreset1;
        document.getElementById("preset2Setting").value = demoSettings.partialPreset2;
        document.getElementById("preset3Setting").value = demoSettings.partialPreset3;
        const closeSelectedConfirmSetting = document.getElementById("closeSelectedConfirmSetting");
        closeSelectedConfirmSetting.checked = demoSettings.requireCloseSelectedConfirmation;
        closeSelectedConfirmSetting.addEventListener("change", () => {
            window.tradePanelPreferences = {
                ...(window.tradePanelPreferences || demoSettings),
                requireCloseSelectedConfirmation: closeSelectedConfirmSetting.checked
            };
        });

        const close = () => modal.remove();
        document.getElementById("closeSettingsTop").onclick = close;
        modal.addEventListener("click", event => { if (event.target === modal) close(); });

        document.getElementById("resetSettingsButton").onclick = () => {
            demoSettings = { ...defaultSettings };
            saveSettings();
            close();
            openSettings();
        };

        document.getElementById("saveSettingsButton").onclick = () => {
            const clampPercent = value => Math.min(99, Math.max(1, Math.round(Number(value) || 1)));
            demoSettings = {
                ...demoSettings,
                volumeDisplay: document.getElementById("volumeDisplaySetting").value,
                defaultBeBuffer: Math.max(0, Number(document.getElementById("defaultBeBufferSetting").value) || 0),
                defaultBeUnit: document.getElementById("defaultBeUnitSetting").value,
                defaultPartialPercent: clampPercent(document.getElementById("defaultPartialSetting").value),
                partialPreset1: clampPercent(document.getElementById("preset1Setting").value),
                partialPreset2: clampPercent(document.getElementById("preset2Setting").value),
                partialPreset3: clampPercent(document.getElementById("preset3Setting").value),
                requireCloseSelectedConfirmation: document.getElementById("closeSelectedConfirmSetting").checked,
                requireTypedCloseAll: true
            };
            saveSettings();
            close();
            window.alert("Demo preferences saved in this browser.");
        };
    }

    const previousRenderPendingOrders = renderPendingOrders;
    renderPendingOrders = function renderPendingOrdersV3() {
        previousRenderPendingOrders();
        document.querySelectorAll("#ordersList .record-card").forEach((card, index) => {
            const order = state.pendingOrders[index];
            if (!order || card.querySelector(".view-order-button")) return;
            const note = card.querySelector(".read-only-note");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "secondary-button view-order-button";
            button.dataset.orderId = order.id;
            button.textContent = "View Order Details";
            note?.replaceWith(button);
            button.addEventListener("click", () => openPendingOrderDetails(order.id));
        });
    };

    function openPendingOrderDetails(orderId) {
        const order = state.pendingOrders.find(item => item.id === orderId);
        if (!order) return;
        closeNamedModal("pendingOrderModal");
        const modal = document.createElement("div");
        modal.id = "pendingOrderModal";
        modal.className = "modal-backdrop";
        modal.innerHTML = `
            <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="pendingOrderTitle">
                <div class="modal-header">
                    <div>
                        <p class="eyebrow">Pending Order</p>
                        <h2 id="pendingOrderTitle">${escapeHtml(order.symbol)} ${escapeHtml(order.type)}</h2>
                        <p class="record-id">Order #${escapeHtml(order.id)}</p>
                    </div>
                    <button class="icon-button" id="closePendingOrderTop" type="button" aria-label="Close order details">×</button>
                </div>

                <div class="details-grid modal-details">
                    <div><span>Volume</span><strong>${formatNumber(order.volumeUnits, 0)} units</strong></div>
                    <div><span>Lots</span><strong>${formatNumber(order.volumeLots, 2)}</strong></div>
                    <div><span>Entry</span><strong>${formatNumber(order.entryPrice)}</strong></div>
                    <div><span>Current</span><strong>${formatNumber(order.currentPrice)}</strong></div>
                    <div><span>Stop Loss</span><strong>${order.stopLoss == null ? "Not set" : formatNumber(order.stopLoss)}</strong></div>
                    <div><span>Take Profit</span><strong>${order.takeProfit == null ? "Not set" : formatNumber(order.takeProfit)}</strong></div>
                    <div><span>Distance</span><strong>${formatNumber(order.distancePips, 1)} pips</strong></div>
                    <div><span>Created</span><strong>${escapeHtml(order.createdAt)}</strong></div>
                    <div><span>Expiration</span><strong>${escapeHtml(order.expiration)}</strong></div>
                    <div><span>Label</span><strong>${escapeHtml(order.label || "None")}</strong></div>
                </div>

                <div class="read-only-panel">
                    <strong>Read-only in Version 1</strong>
                    Pending-order cancellation and modification are intentionally excluded from the initial mobile scope.
                </div>
            </section>`;
        document.body.appendChild(modal);
        const close = () => modal.remove();
        document.getElementById("closePendingOrderTop").onclick = close;
        modal.addEventListener("click", event => { if (event.target === modal) close(); });
    }

    // Apply saved defaults each time the existing position manager opens.
    const previousOpenPositionManager = openPositionManager;
    openPositionManager = function openPositionManagerV3(positionId) {
        previousOpenPositionManager(positionId);
        const beBuffer = document.getElementById("beBuffer");
        const beUnit = document.getElementById("beUnit");
        const partial = document.getElementById("partialClosePercent");
        if (beBuffer) beBuffer.value = demoSettings.defaultBeBuffer;
        if (beUnit) beUnit.value = demoSettings.defaultBeUnit;
        if (partial) {
            partial.value = demoSettings.defaultPartialPercent;
            partial.dispatchEvent(new Event("input", { bubbles: true }));
        }
        const closeSelectedButton = document.getElementById("closeSelectedButton");
        if (closeSelectedButton) {
            const requireCloseConfirmation = window.tradePanelPreferences
                ? window.tradePanelPreferences.requireCloseSelectedConfirmation !== false
                : demoSettings.requireCloseSelectedConfirmation !== false;
            closeSelectedButton.textContent = requireCloseConfirmation
                ? "Review Close This Position"
                : "Close This Position";
        }
        const presetButtons = [...document.querySelectorAll(".preset-button")];
        const presets = [demoSettings.partialPreset1, demoSettings.partialPreset2, demoSettings.partialPreset3];
        presetButtons.forEach((button, index) => {
            if (presets[index] != null) {
                button.dataset.percent = String(presets[index]);
                button.textContent = `${presets[index]}%`;
            }
        });
    };

    addSettingsButton();
    renderPendingOrders();
})();

// Demo v3.1: enforce the saved volume-display preference everywhere.
(function enforceVolumeDisplayPreference() {
    const SETTINGS_KEY = "ctraderMobilePositionManager.demoSettings.v1";

    function getVolumeDisplay() {
        try {
            const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
            return ["units", "lots", "both"].includes(saved.volumeDisplay)
                ? saved.volumeDisplay
                : "both";
        } catch {
            return "both";
        }
    }

    function applyVolumeDisplay(root = document) {
        const mode = getVolumeDisplay();

        root.querySelectorAll(".details-grid").forEach(grid => {
            const items = [...grid.children];
            const volumeItem = items.find(item => item.querySelector("span")?.textContent.trim() === "Volume");
            const lotsItem = items.find(item => item.querySelector("span")?.textContent.trim() === "Lots");

            // Cards and pending-order screens already contain separate Volume and Lots rows.
            if (volumeItem && lotsItem) {
                volumeItem.hidden = mode === "lots";
                lotsItem.hidden = mode === "units";
                return;
            }

            // The Manage Position modal originally contains only one Volume row.
            // Convert that row instead of hiding it, so a volume section is always visible.
            if (volumeItem && grid.closest("#positionModal")) {
                const position = state.positions.find(item => item.id === state.selectedPositionId);
                const label = volumeItem.querySelector("span");
                const value = volumeItem.querySelector("strong");
                if (!position || !label || !value) return;

                volumeItem.hidden = false;
                if (mode === "lots") {
                    label.textContent = "Volume (Lots)";
                    value.textContent = formatNumber(position.volumeLots, 2);
                } else if (mode === "both") {
                    label.textContent = "Volume";
                    value.textContent = `${formatNumber(position.volumeUnits, 0)} units / ${formatNumber(position.volumeLots, 2)} lots`;
                } else {
                    label.textContent = "Volume";
                    value.textContent = `${formatNumber(position.volumeUnits, 0)} units`;
                }
            }
        });
    }

    // Observe cards and bottom sheets created after page load.
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    applyVolumeDisplay(node);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    applyVolumeDisplay();

    // Reapply immediately after saving or resetting Settings.
    document.addEventListener("click", event => {
        if (event.target.closest("#saveSettingsButton") ||
            event.target.closest("#resetSettingsButton")) {
            setTimeout(() => applyVolumeDisplay(), 0);
        }
    }, true);
})();
