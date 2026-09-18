const KEY = "ctraderPositionManager.eventLedger.v49";

export function loadSessionEvents() {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value.slice(-100) : [];
  } catch {
    return [];
  }
}

export function saveSessionEvents(events) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(events.slice(-100)));
  } catch {
    // Storage may be unavailable in some embedded contexts.
  }
}

export function clearSessionEvents() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Storage may be unavailable in some embedded contexts.
  }
}
