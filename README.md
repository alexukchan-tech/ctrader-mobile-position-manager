# cTrader Mobile Position Manager 4.8 Event-Tracked Live Lists

This strictly read-only build maps the execution-event ledger into partial live lists. Open positions require `positionStatus = OPEN` and positive volume. Pending entry orders require accepted status, non-closing classification, and order type Limit, Stop, or Stop Limit. Protective SL/TP orders and filled market orders are excluded. The interface permanently warns that records existing before connection may be missing. All management actions remain locked.
