# Deployment

1. Upload all extracted files and folders to the GitHub repository root.
2. Replace the existing files.
3. Commit with: `Release final read-only position manager`.
4. Wait for GitHub Pages deployment success.
5. Set the cTrader placement URL cache parameter to `v=61` while retaining `mode=live` and `showLogs=true`.
6. Publish the cTrader plugin configuration.
7. Close old Position Manager placements and reopen one instance.
8. Confirm the visible build is `6.1-final-readonly`.
