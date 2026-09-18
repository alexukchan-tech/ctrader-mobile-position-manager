# cTrader Mobile Position Manager 13.0.1 Adaptive Quote Final

Final quote-normalization hotfix. cTrader quote events may provide either an already-normalized decimal price or an integer encoded with five fixed decimal places. Version 13.0.1 evaluates both representations and selects the candidate closest to the tracked entry price or previous verified quote.

All Version 13 safeguards remain active. P/L is still suppressed for restored, unconfirmed positions, stale quotes, invalid spreads, discontinuous quotes, or quotes that fail two-tick verification. Trading operations remain unavailable.
