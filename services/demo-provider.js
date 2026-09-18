export class DemoProvider {
  constructor() {
    this.mode = "demo";
    this.connected = true;
  }

  async connect() {
    return { mode: this.mode, connected: true };
  }

  async closePosition() {
    throw new Error("DemoProvider actions are handled by the browser demo state.");
  }
}
