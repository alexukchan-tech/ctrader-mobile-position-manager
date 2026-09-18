# cTrader Mobile Position Manager 10.0.1 Quote Scale Hotfix

Corrects the cTrader quote-event price conversion. Bid and ask values are encoded with five fixed decimal places, independently of each symbol's display digits. For example, raw `437576000` is normalized to `4375.76`, not `4375760.00`.

The hotfix also rejects implausible quotes relative to the tracked entry price, preventing an invalid quote from producing an extreme estimated P/L. Trading operations remain unavailable.
