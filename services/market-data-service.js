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
    this.quoteIntegrity = new Map();
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
    const id = String(symbolId);
    const previous = this.quotes.get(id);
    this.quotes.set(id, payload);

    const rawBid = Number(readField(payload, ["bid"]));
    const rawAsk = Number(readField(payload, ["ask"]));
    const bid = this.normalizeQuotePrice(id, rawBid);
    const ask = this.normalizeQuotePrice(id, rawAsk);
    const previousBid = previous ? this.normalizeQuotePrice(id, readField(previous, ["bid"])) : null;
    const previousAsk = previous ? this.normalizeQuotePrice(id, readField(previous, ["ask"])) : null;
    const basicValid = Number.isFinite(bid) && Number.isFinite(ask) && ask >= bid && bid > 0;
    const continuityValid = !Number.isFinite(previousBid) || !Number.isFinite(previousAsk) || (
      Math.abs(bid - previousBid) <= Math.max(5, previousBid * 0.02) &&
      Math.abs(ask - previousAsk) <= Math.max(5, previousAsk * 0.02)
    );
    const priorIntegrity = this.quoteIntegrity.get(id) || { consecutiveValid: 0 };
    this.quoteIntegrity.set(id, {
      consecutiveValid: basicValid && continuityValid ? priorIntegrity.consecutiveValid + 1 : 0,
      basicValid,
      continuityValid,
      rawBid,
      rawAsk,
      normalizedBid: bid,
      normalizedAsk: ask,
      receivedAt: Date.now()
    });
    this.onQuote(id, payload);
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

  getQuoteIntegrity(symbolId) {
    return this.quoteIntegrity.get(String(symbolId)) || null;
  }

  dispose() {
    this.quoteSubscription?.unsubscribe?.();
    this.quoteSubscription = null;
    this.quotes.clear();
    this.quoteIntegrity.clear();
    this.subscribedIds.clear();
  }

  normalizeQuotePrice(symbolId, rawPrice) {
    if (rawPrice === null || rawPrice === undefined) return null;
    const numeric = Number(rawPrice);
    if (!Number.isFinite(numeric)) return null;

    // cTrader quote-event bid/ask values use five fixed decimal places,
    // independently of the symbol display digits. Example: 437576000 -> 4375.76000.
    return numeric / 100000;
  }
}
