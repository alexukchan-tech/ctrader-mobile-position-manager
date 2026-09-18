# cTrader Mobile Position Manager - Version 4 Preparation

This build preserves the tested browser Demo Mode and adds the service boundary required for later cTrader Plugin SDK integration.

## Files

- `index.html`: page shell
- `styles.css`: responsive UI
- `app.js`: current tested demo UI and workflows
- `bootstrap.js`: application platform bootstrap
- `data/demo-data.js`: shared demo helpers
- `services/demo-provider.js`: demo provider boundary
- `services/ctrader-provider.js`: locked live-provider scaffold
- `services/app-mode-service.js`: explicit mode detection
- `services/settings-service.js`: browser preference storage
- `services/format-service.js`: reusable formatting
- `services/debug-logger.js`: optional development logging

## Modes

Normal URL opens Demo Mode.

`?mode=live` selects the locked connection-preparation path. It does not connect or trade yet.

`?showLogs=true` enables development logging in the browser console.

## Safety

Live trading is deliberately locked in this package. The cTrader Plugin SDK connection and all account actions will be added only after the website is registered and read-only host communication is verified on a demo account.
