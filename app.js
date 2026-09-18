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

    elements.closeSymbolButton.addEventListener("click", () => {
        showDemoNotice("Close-all-for-symbol preview. Symbol selection will be added with the cTrader account connection.");
    });

    elements.closeAllButton.addEventListener("click", () => {
        showDemoNotice(`Close-all preview for ${state.positions.length} demo positions across all symbols.`);
    });

    elements.positionsTab.addEventListener("click", () => setActiveTab("positions"));
    elements.ordersTab.addEventListener("click", () => setActiveTab("orders"));

    renderSummary();
    renderPositions();
    renderPendingOrders();
    setActiveTab("positions");
}

document.addEventListener("DOMContentLoaded", initializeDemo);
