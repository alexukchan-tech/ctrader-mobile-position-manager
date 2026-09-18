export function createDebugLogger() {
  const enabled = new URLSearchParams(location.search).get("showLogs") === "true";
  const entries = [];

  function log(level, message, details) {
    const entry = { time: new Date().toISOString(), level, message, details };
    entries.push(entry);
    if (enabled) console[level === "error" ? "error" : "log"]("[PositionManager]", entry);
  }

  return { enabled, entries, info: (m,d) => log("info",m,d), error: (m,d) => log("error",m,d) };
}
