export const demoAccount = Object.freeze({
  accountId: "DEMO-BROWSER",
  currency: "HKD",
  mode: "demo"
});

export function cloneRecords(records) {
  return JSON.parse(JSON.stringify(records));
}
