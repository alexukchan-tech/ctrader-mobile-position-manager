# Version 11.0 Quote Integrity

- Requires two consecutive verified ticks before calculating P/L.
- Detects unrealistic jumps between consecutive normalized quotes.
- Retains the fixed 100,000 quote divisor.
- Retains five-second freshness, timestamp, spread and entry-price checks.
- Exposes raw and normalized quote values in monitoring snapshots for diagnosis.
- Suppresses P/L while a quote sequence is unverified.
