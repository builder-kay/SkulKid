# Gamification Model

Gamification is configuration-driven and separated from academic correctness.

- XP is stored in an append-only `RewardTransaction` ledger.
- Duplicate awards are prevented with idempotency keys.
- Reversals are compensating transactions, never deletion.
- Stars represent performance and never decrease after replay.
- Levels use configured cumulative thresholds through level 10, then a documented 1,500 XP growth step.
- Badges are deterministic and unique unless explicitly repeatable.
