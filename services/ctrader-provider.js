export class CTraderProvider {
  constructor({ logger = console } = {}) {
    this.logger = logger;
    this.mode = "live";
    this.connected = false;
    this.adapter = null;
  }

  async connect() {
    // Intentionally locked until the website is loaded as a registered cTrader plugin.
    // Live implementation will use the verified confirm -> register -> confirm handshake.
    throw new Error("cTrader host connection is not enabled in this browser-only build.");
  }

  async getAccountSnapshot() {
    throw new Error("Connect to the cTrader host before requesting account data.");
  }

  async closePosition() {
    throw new Error("Live trading actions are locked in Version 4 preparation build.");
  }
}
