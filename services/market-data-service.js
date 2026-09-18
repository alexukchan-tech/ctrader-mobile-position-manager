import {
  getLightSymbolList,
  getSymbol,
  subscribeQuotes,
  quoteEvent
} from "https://esm.sh/@spotware-web-team/sdk";
import { take } from "https://esm.sh/rxjs/operators";

function once(observable, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let subscription;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      subscription?.unsubscribe?.();
      reject(new Error(`Market-data request timed out after ${timeoutMs / 1000} seconds`));
    }, timeoutMs);
    subscription = observable.pipe(take(1)).subscribe({
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
        reject(error);
      }
    });
  });
}

function readField(object, candidates) {
  if (!object || typeof object !== "object") return undefined;
  const keys = Object.keys(object);
  for (const candidate of candidates) {
    const key = keys.find(item => item.toLowerCase() === candidate.toLowerCase());
    if (key) return object[key];
  }
  return undefined;
}

function findArray(root, preferredKeys) {
  if (!root || typeof root !== "object") return [];
  for (const key of preferredKeys) {
    const value = readField(root, [key]);
    if (Array.isArray(value)) return value;
  }
  for (const value of Object.values(root)) {
    const found = findArray(value, preferredKeys);
    if (found.length) return found;
  }
  return [];
}

function findObject(root, preferredKeys) {
  if (!root || typeof root !== "object") return null;
  for (const key of preferredKeys) {
    const value = readField(root, [key]);
    if (value && typeof value === "object") return value;
  }
  for (const value of Object.values(root)) {
    const found = findObject(value, preferredKeys);
    if (found) return found;
  }
  return null;
}

export class MarketDataService {
  constructor({ adapter, logger, onQuote, onStatus }) {
    this.adapter = adapter;
    this.logger = logger;
    this.onQuote = onQuote || (() => {});
    this.onStatus = onStatus || (() => {});
    this.lightSymbols = new Map();
    this.symbolDetails = new Map();
    this.quotes = new Map();
    this.subscribedIds = new Set();
    this.quoteSubscription = null;
  }

  storeSymbol(targetMap, symbol) {
    const id = readField(symbol, ["symbolId", "id"]);
    if (id === undefined || id === null) return false;
    targetMap.set(String(id), symbol);
    return true;
  }

  async initialize() {
    this.onStatus("Loading symbol list");
    const response = await once(getLightSymbolList(this.adapter, {}));
    const symbols = findArray(response, ["symbol", "symbols"]);
    symbols.forEach(symbol => this.storeSymbol(this.lightSymbols, symbol));
    this.onStatus(`Symbol list loaded: ${this.lightSymbols.size}`);
    this.quoteSubscription?.unsubscribe?.();
    this.quoteSubscription = quoteEvent(this.adapter).subscribe({
      next: event => this.handleQuote(event),
      error: error => this.onStatus(`Quote stream error: ${error?.message || String(error)}`)
    });
  }

  async ensureSymbols(symbolIds) {
    const unique = [...new Set(symbolIds.filter(id => id !== null && id !== undefined).map(String))];
    const missing = unique.filter(id => !this.symbolDetails.has(id));
    if (missing.length) {
      this.onStatus(`Loading ${missing.length} symbol definition(s)`);
      const response = await once(getSymbol(this.adapter, { symbolId: missing.map(Number) }));
      const details = findArray(response, ["symbol", "symbols"]);
      details.forEach(symbol => this.storeSymbol(this.symbolDetails, symbol));
    }

    const newSubscriptions = unique.filter(id => !this.subscribedIds.has(id));
    if (newSubscriptions.length) {
      await once(subscribeQuotes(this.adapter, { symbolId: newSubscriptions.map(Number) }));
      newSubscriptions.forEach(id => this.subscribedIds.add(id));
      this.onStatus(`Quotes subscribed: ${this.subscribedIds.size} symbol(s)`);
    }
  }

  handleQuote(event) {
    const payload = findObject(event, ["payload", "quote"]) || event;
    const symbolId = readField(payload, ["symbolId", "id"]);
    if (symbolId === undefined || symbolId === null) return;
    this.quotes.set(String(symbolId), payload);
    this.onQuote(String(symbolId), payload);
  }

  getSymbolName(symbolId) {
    const id = String(symbolId);
    const light = this.lightSymbols.get(id);
    const detail = this.symbolDetails.get(id);
    return readField(detail, ["symbolName", "name"]) ||
      readField(light, ["symbolName", "name"]) ||
      `Symbol ID ${id}`;
  }

  getSymbolInfo(symbolId) {
    const id = String(symbolId);
    return this.symbolDetails.get(id) || this.lightSymbols.get(id) || null;
  }

  getQuote(symbolId) {
    return this.quotes.get(String(symbolId)) || null;
  }

  normalizeQuotePrice(symbolId, rawPrice) {
    if (rawPrice === null || rawPrice === undefined) return null;
    const info = this.getSymbolInfo(symbolId) || {};
    const digits = Number(readField(info, ["digits"]) ?? 5);
    return Number(rawPrice) / Math.pow(10, digits);
  }
}
