# Version 8.0 Resilient Monitoring

## New
- Session age and reconnect counters
- Last UI refresh timestamp
- Controlled monitoring reconnect button
- Downloadable session-ledger backup
- Runtime health data in monitoring snapshots
- Clearer resilient-monitoring release mode

## Retained
- cTrader host connection and account metadata
- Execution-event ledger with session restoration
- Partial event-tracked positions and pending entry orders
- Symbol names, bid/ask, quote health and estimated tracked P/L
- Lifecycle filtering, diagnostics and non-executing exit reference

## Boundary
No trading request is imported or invoked. Close, partial close, breakeven, protection changes, order changes and batch operations remain unavailable.
