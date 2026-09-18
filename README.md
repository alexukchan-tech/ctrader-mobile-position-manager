# cTrader Mobile Position Manager 4.3.1 Copy Fix

Fixes the disabled Copy Account Response button after a successful read-only connection. If clipboard access is blocked by the cTrader WebView, the button downloads `ctrader-account-response.json` instead. All live trading actions remain locked.
