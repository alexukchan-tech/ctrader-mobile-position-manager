export const AppMode = Object.freeze({
  DEMO: "demo",
  CONNECTING: "connecting",
  LIVE: "live",
  CONNECTION_ERROR: "connection-error"
});

export function detectInitialMode() {
  const params = new URLSearchParams(location.search);
  return params.get("mode") === "live" ? AppMode.CONNECTING : AppMode.DEMO;
}
