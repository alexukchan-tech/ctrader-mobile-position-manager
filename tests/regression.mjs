import assert from 'node:assert/strict';
import { EventLedger, sanitizeEvent } from '../services/event-ledger-service.js';
import { mapTrackedPositions, mapTrackedPendingOrders, normalizeVolume } from '../services/event-list-mapper.js';

const q = value => value / 100000;
assert.equal(q(437576000), 4375.76);
assert.equal(q(114833), 1.14833);
assert.equal(q(15792600), 157.926);
assert.equal(q(7813148000), 78131.48);
assert.deepEqual(normalizeVolume(70000, 10000), { units: 700, lots: 7 });
const buy = (4377.82 - 4348.51) * 700 - 24.5;
const sell = (4348.51 - 4377.94) * 700 - 24.5;
assert.equal(Number(buy.toFixed(2)), 20492.5);
assert.equal(Number(sell.toFixed(2)), -20625.5);
assert.equal(sanitizeEvent({ token: 'x', email: 'x', nested: { password: 'y' } }).token, '[REDACTED]');

const ledger = new EventLedger();
ledger.ingest({ position: { positionId: 1, positionStatus: 1, price: 10, tradeData: { volume: 10000, lotSize: 10000, symbolId: 1, tradeSide: 1 } } }, { restored: true });
assert.equal(mapTrackedPositions(ledger)[0].confirmationState, 'restored-unconfirmed');
ledger.ingest({ position: { positionId: 1, positionStatus: 1, price: 10, tradeData: { volume: 5000, lotSize: 10000, symbolId: 1, tradeSide: 1 } } });
assert.equal(mapTrackedPositions(ledger)[0].confirmationState, 'current-session-observed');
assert.equal(mapTrackedPositions(ledger)[0].volumeUnits, 50);
ledger.ingest({ position: { positionId: 1, positionStatus: 2, price: 10, tradeData: { volume: 0, lotSize: 10000, symbolId: 1, tradeSide: 1 } } });
assert.equal(mapTrackedPositions(ledger).length, 0);
ledger.ingest({ order: { orderId: 2, orderStatus: 1, orderType: 2, closingOrder: false, tradeData: { volume: 10000, lotSize: 10000, symbolId: 1, tradeSide: 1 } } });
assert.equal(mapTrackedPendingOrders(ledger).length, 1);
ledger.ingest({ order: { orderId: 2, orderStatus: 5, orderType: 2, closingOrder: false, tradeData: { volume: 10000, lotSize: 10000, symbolId: 1, tradeSide: 1 } } });
assert.equal(mapTrackedPendingOrders(ledger).length, 0);
console.log('Regression tests passed: quote scales, P/L, lifecycle, restoration, filtering, redaction.');
