# Final Acceptance Test

- Confirm host connection, execution subscription, symbol mapping, storage and overall health.
- Validate one Buy and one Sell position.
- Validate XAUUSD plus at least one FX, JPY, crypto or index symbol.
- Confirm two verified ticks are required before P/L appears.
- Stop market data and confirm P/L is hidden after five seconds.
- Reconnect three times and confirm one execution event increments the counter once.
- Reload and confirm restored records are unconfirmed with no P/L.
- Modify a restored position and confirm current-session status and P/L resume.
- Test SL/TP update, partial close, full close, pending-order creation, modification, cancellation and fill.
- Run for several hours and check for duplicate cards, slowdown, stale quotes and repeated callbacks.
