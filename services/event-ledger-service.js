const sensitiveKey = /token|secret|password|credential|email|login|traderid|groupid|clientmsgid|uuid|name/i;

export function sanitizeEvent(value, depth = 0, seen = new WeakSet()) {
  if (depth > 10) return "[MAX_DEPTH]";
  if (value === null || value === undefined) return value;
  if (["string", "number", "boolean"].includes(typeof value)) return value;
  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, 200).map(item => sanitizeEvent(item, depth + 1, seen));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    sensitiveKey.test(key) ? "[REDACTED]" : sanitizeEvent(item, depth + 1, seen)
  ]));
}

function findObject(root, wantedKey) {
  if (!root || typeof root !== "object") return null;
  for (const [key, value] of Object.entries(root)) {
    if (key.toLowerCase() === wantedKey.toLowerCase() && value && typeof value === "object") return value;
  }
  for (const value of Object.values(root)) {
    const found = findObject(value, wantedKey);
    if (found) return found;
  }
  return null;
}

function readId(object, candidates) {
  if (!object || typeof object !== "object") return null;
  for (const candidate of candidates) {
    const key = Object.keys(object).find(item => item.toLowerCase() === candidate.toLowerCase());
    if (key && object[key] !== undefined && object[key] !== null) return String(object[key]);
  }
  return null;
}

export class EventLedger {
  constructor({ maximumEvents = 100 } = {}) {
    this.maximumEvents = maximumEvents;
    this.events = [];
    this.positions = new Map();
    this.orders = new Map();
  }

  ingest(rawEvent, { restored = false } = {}) {
    const event = sanitizeEvent(rawEvent);
    const wrapped = { receivedAt: new Date().toISOString(), event };
    this.events.unshift(wrapped);
    this.events = this.events.slice(0, this.maximumEvents);

    const position = findObject(event, "position");
    const order = findObject(event, "order");
    const positionId = readId(position, ["positionId", "id"]);
    const orderId = readId(order, ["orderId", "id"]);

    if (position && positionId) {
      this.positions.set(positionId, {
        source: restored ? "Restored session event" : "Current execution event",
        confirmationState: restored ? "restored-unconfirmed" : "current-session-observed",
        lastReceivedAt: wrapped.receivedAt,
        data: position
      });
    }

    if (order && orderId) {
      this.orders.set(orderId, {
        source: restored ? "Restored session event" : "Current execution event",
        confirmationState: restored ? "restored-unconfirmed" : "current-session-observed",
        lastReceivedAt: wrapped.receivedAt,
        data: order
      });
    }

    return { event: wrapped, positionId, orderId };
  }

  clear() {
    this.events = [];
    this.positions.clear();
    this.orders.clear();
  }

  export() {
    return {
      generatedAt: new Date().toISOString(),
      warning: "Event-tracked records may not represent the complete account portfolio.",
      positionCount: this.positions.size,
      orderCount: this.orders.size,
      positions: Object.fromEntries(this.positions),
      orders: Object.fromEntries(this.orders),
      events: this.events
    };
  }
}
