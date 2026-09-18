# Version 13.1 Production Deployment

1. Replace the repository contents with all files and folders from this package.
2. Remove legacy files that are absent from this package.
3. Commit with `Deploy Version 13.1 production read-only monitor`.
4. Wait for GitHub Pages deployment to complete successfully.
5. Use `mode=live`, `showLogs=true`, and cache parameter `v=1310` in the cTrader placement URL.
6. Publish the cTrader placement, close all old instances, and reopen one instance.
7. Verify build `13.1-production-readonly` and release mode `Production read-only`.
