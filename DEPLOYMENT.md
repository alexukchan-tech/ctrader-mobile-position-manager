# Version 10.0 Deployment

1. Upload all extracted files and folders to the GitHub repository root.
2. Replace the previous release files.
3. Delete old demo ZIPs, sample JSON exports, build scripts and legacy files not included in this package.
4. Keep every file included in this package, including the two small compatibility service files.
5. Commit with `Release Version 10.0 final production monitoring`.
6. Wait for GitHub Pages deployment success.
7. Retain `mode=live` and `showLogs=true`, and change the cache parameter to `v=100`.
8. Publish the cTrader plugin configuration.
9. Close old Position Manager instances and reopen one placement.
10. Verify build `10.0-final-production-monitoring` and release mode `Final production monitoring`.
