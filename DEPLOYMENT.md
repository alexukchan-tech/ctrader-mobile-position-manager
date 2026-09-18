# Version 10.0.1 Deployment

1. Upload every extracted file to the repository root and replace the existing Version 10.0 files.
2. Commit with `Fix cTrader quote scaling and P/L guardrails`.
3. Wait for GitHub Pages deployment success.
4. Keep `mode=live` and `showLogs=true`; change the cache parameter to `v=1001`.
5. Publish the cTrader placement, close old instances, and reopen one instance.
6. Verify build `10.0.1-quote-scale-hotfix`.
