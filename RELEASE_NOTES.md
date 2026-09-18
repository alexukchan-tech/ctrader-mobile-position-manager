# Version 13.0 Final Production Read-Only

## Final additions
- Restored records are marked unconfirmed and cannot produce P/L until reconfirmed by a current-session execution event.
- Reconnection disposes the old quote subscription, clears quote integrity state, and replaces the execution subscription.
- Overall health includes verified quote-sequence health for current-session positions.
- Automated regression tests cover XAUUSD, EURUSD, USDJPY and BTCUSD scaling, Buy/Sell P/L, commission, lifecycle updates, pending-order filtering, session restoration and sensitive-field redaction.
- Legacy demo archives, sample account data and build scripts are removed.

## Permanent boundary
This is a partial monitoring view. Close, partial close, breakeven, protection changes, order cancellation, order creation and batch operations are unavailable.
