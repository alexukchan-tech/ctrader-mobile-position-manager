# cTrader Mobile Position Manager 4.7 Event Ledger

This strictly read-only build captures `executionEvent` messages after the plugin connects, sanitizes them, and maintains in-memory ledgers deduplicated by position ID and order ID. The ledger is explicitly incomplete because the Plugin SDK does not expose an initial portfolio snapshot in the inspected interface. All live management actions remain locked.
