# 002 Progress Snapshot And Events

## Context

Dashboards need fast reads, but learning history must remain auditable.

## Decision

Store progress snapshots, immutable attempts/responses and append-only learning events.

## Alternatives Considered

Using only event replay was flexible but expensive for everyday student views.

## Consequences

The system has fast current state and rich historical evidence.
