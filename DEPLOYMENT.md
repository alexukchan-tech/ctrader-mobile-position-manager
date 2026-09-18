# Version 13.0 Deployment

1. Replace the repository contents with all extracted production files.
2. Delete legacy files absent from this package.
3. Commit with `Release Version 13 final production read-only monitor`.
4. Wait for GitHub Pages deployment success.
5. Keep `mode=live` and `showLogs=true`; set the cache parameter to `v=130`.
6. Publish the cTrader placement, close all old instances, and reopen one instance.
7. Verify build `13.0-final-production-readonly` and release mode `Final production read-only`.
8. Confirm restored records show `Restored, unconfirmed` and P/L remains unavailable until a current execution event reconfirms each record.
