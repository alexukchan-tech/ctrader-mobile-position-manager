# Version 6.1 Final Read-Only Release

## Included
- cTrader Plugin SDK host handshake
- Read-only account metadata
- Execution-event subscription monitor
- Session event ledger restoration
- Partial event-tracked open-position list
- Partial event-tracked pending-entry-order list
- Symbol-name and symbol-digit mapping
- Live bid and ask display
- Quote freshness monitoring
- Estimated P/L for event-tracked positions
- Position and order lifecycle filtering
- Compact diagnostics and validation summary
- Non-executing close-position simulation

## Safety boundary
The Plugin SDK does not expose a verified complete initial portfolio snapshot in this implementation. Records existing before connection may be absent. Consequently, all trading operations remain disabled, including close, partial close, breakeven, protection modification, order cancellation and batch actions.
