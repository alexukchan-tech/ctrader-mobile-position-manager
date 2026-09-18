const KEY = "ctraderMobilePositionManager.demoSettings.v1";

export function loadPreferences(defaults = {}) {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...defaults };
  }
}

export function savePreferences(value) {
  localStorage.setItem(KEY, JSON.stringify(value));
}

export function clearPreferences() {
  localStorage.removeItem(KEY);
}
