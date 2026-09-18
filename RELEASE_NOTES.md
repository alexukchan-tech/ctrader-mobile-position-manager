# Version 13.0.1 Adaptive Quote Final

- Supports both `4379.02` and `437902000` as valid representations of approximately 4379.02.
- Selects the candidate closest to the position entry price or previous verified quote.
- Retains two-tick continuity, timestamp, freshness, spread, and plausibility validation.
- Replaces the misleading `implausible price` message with `no plausible quote representation`.
