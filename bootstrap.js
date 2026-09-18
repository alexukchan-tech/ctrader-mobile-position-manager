import { DemoProvider } from "./services/demo-provider.js";
import { CTraderProvider } from "./services/ctrader-provider.js";
import { AppMode, detectInitialMode } from "./services/app-mode-service.js";
import { createDebugLogger } from "./services/debug-logger.js";
import * as settingsService from "./services/settings-service.js";
import * as formatService from "./services/format-service.js";

const logger = createDebugLogger();
const initialMode = detectInitialMode();
const provider = initialMode === AppMode.CONNECTING
  ? new CTraderProvider({ logger })
  : new DemoProvider();

window.positionManagerPlatform = Object.freeze({
  version: "4.0-preparation",
  initialMode,
  provider,
  logger,
  settingsService,
  formatService,
  liveTradingLocked: true
});

logger.info("Application platform initialized", {
  version: window.positionManagerPlatform.version,
  initialMode,
  liveTradingLocked: true
});
