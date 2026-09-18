# Version 8.0 Deployment

1. Upload all extracted items to the GitHub repository root and replace the previous release.
2. Commit with `Release Version 8.0 resilient monitoring`.
3. Wait for GitHub Pages deployment success.
4. Keep `mode=live` and `showLogs=true` in the cTrader placement URL.
5. Change the cache parameter to `v=80`.
6. Publish the cTrader plugin configuration.
7. Close old Position Manager instances and reopen one placement.
8. Verify build `8.0-resilient-monitoring` and release mode `Resilient monitoring`.
