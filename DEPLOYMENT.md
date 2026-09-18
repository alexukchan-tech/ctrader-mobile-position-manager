# Version 7.0 Deployment

1. Upload all extracted items to the GitHub repository root and replace the previous release.
2. Commit with `Release Version 7.0 monitoring console`.
3. Wait for GitHub Pages deployment success.
4. Keep `mode=live` and `showLogs=true` in the cTrader placement URL.
5. Change the cache parameter to `v=70`.
6. Publish the cTrader plugin configuration.
7. Close old Position Manager instances and reopen one placement.
8. Verify build `7.0-monitoring-release` and release mode `Monitoring only`.
