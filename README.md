# cTrader Mobile Position Manager 5.0.1 Monitor Scope Fix

Fixes the market-data initialization failure caused by `renderSubscriptionMonitor` being scoped inside the inspector setup. The monitor renderer is now available to the connection workflow, and the visible build label is populated directly from the running platform version. All live management actions remain locked.
