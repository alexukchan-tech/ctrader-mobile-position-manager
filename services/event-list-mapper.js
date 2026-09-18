const POSITION_OPEN = 1;
const ORDER_ACCEPTED = 1;
const PENDING_ENTRY_TYPES = new Set([2, 3, 6]);

const SIDE = Object.freeze({ 1: "Buy", 2: "Sell" });
const ORDER_TYPE = Object.freeze({ 2: "Limit", 3: "Stop", 6: "Stop Limit" });

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeVolume(rawVolume, rawLotSize) {
  const volumeRaw = toNumber(rawVolume);
  const lotSizeRaw = toNumber(rawLotSize);
  return {
    units: volumeRaw / 100,
    lots: lotSizeRaw > 0 ? volumeRaw / lotSizeRaw : null
  };
}

export function mapTrackedPositions(ledger) {
  return [...ledger.positions.entries()]
    .map(([id, record]) => {
      const position = record.data || {};
      const trade = position.tradeData || {};
      const volume = normalizeVolume(trade.volume, trade.lotSize);
      return {
        id,
        symbolId: trade.symbolId ?? null,
        side: SIDE[trade.tradeSide] || `Side ${trade.tradeSide ?? "?"}`,
        volumeUnits: volume.units,
        volumeLots: volume.lots,
        measurementUnits: trade.measurementUnits || "units",
        entryPrice: position.price ?? null,
        stopLoss: position.stopLoss ?? null,
        takeProfit: position.takeProfit ?? null,
        positionStatus: position.positionStatus,
        commission: toNumber(position.commission) / Math.pow(10, toNumber(position.moneyDigits, 2)),
        moneyDigits: toNumber(position.moneyDigits, 2),
        openTimestamp: trade.openTimestamp ?? null,
        lastUpdateTimestamp: position.utcLastUpdateTimestamp ?? null,
        lastReceivedAt: record.lastReceivedAt,
        source: record.source
      };
    })
    .filter(position => position.positionStatus === POSITION_OPEN && position.volumeUnits > 0)
    .sort((a, b) => toNumber(b.lastUpdateTimestamp) - toNumber(a.lastUpdateTimestamp));
}

export function mapTrackedPendingOrders(ledger) {
  return [...ledger.orders.entries()]
    .map(([id, record]) => {
      const order = record.data || {};
      const trade = order.tradeData || {};
      const volume = normalizeVolume(trade.volume, trade.lotSize);
      return {
        id,
        positionId: order.positionId ? String(order.positionId) : null,
        symbolId: trade.symbolId ?? null,
        side: SIDE[trade.tradeSide] || `Side ${trade.tradeSide ?? "?"}`,
        orderType: ORDER_TYPE[order.orderType] || `Type ${order.orderType ?? "?"}`,
        orderTypeCode: order.orderType,
        orderStatus: order.orderStatus,
        closingOrder: order.closingOrder === true,
        volumeUnits: volume.units,
        volumeLots: volume.lots,
        measurementUnits: trade.measurementUnits || "units",
        entryPrice: order.limitPrice ?? order.stopPrice ?? null,
        limitPrice: order.limitPrice ?? null,
        stopPrice: order.stopPrice ?? null,
        stopLoss: order.stopLoss ?? null,
        takeProfit: order.takeProfit ?? null,
        openTimestamp: trade.openTimestamp ?? null,
        lastUpdateTimestamp: order.utcLastUpdateTimestamp ?? null,
        lastReceivedAt: record.lastReceivedAt,
        source: record.source
      };
    })
    .filter(order => order.orderStatus === ORDER_ACCEPTED && !order.closingOrder && PENDING_ENTRY_TYPES.has(order.orderTypeCode))
    .sort((a, b) => toNumber(b.lastUpdateTimestamp) - toNumber(a.lastUpdateTimestamp));
}
