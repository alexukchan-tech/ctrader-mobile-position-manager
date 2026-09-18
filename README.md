# cTrader Mobile Position Manager 11.0 Quote Integrity

Version 11.0 adds a quote-integrity layer. Estimated P/L is calculated only after two consecutive valid quote ticks pass scaling, timestamp, freshness, spread, continuity and entry-price plausibility checks. The first valid tick is displayed as awaiting verification and cannot produce P/L.

The monitoring view remains partial and all trading operations remain unavailable.
