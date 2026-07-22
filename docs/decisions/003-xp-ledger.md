# 003 XP Ledger

## Context

XP must not be double-awarded or silently rewritten.

## Decision

Use append-only reward transactions with idempotency keys and compensating reversals.

## Alternatives Considered

A mutable `totalXp` field alone was simpler but not auditable.

## Consequences

XP balance can be derived and cached. Corrections preserve history.
