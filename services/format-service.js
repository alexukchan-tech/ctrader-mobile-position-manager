export function formatMoney(value, currency = "HKD") {
  const sign = value > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("en-HK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)} ${currency}`;
}

export function formatNumber(value, maximumFractionDigits = 5) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits
  }).format(value);
}
