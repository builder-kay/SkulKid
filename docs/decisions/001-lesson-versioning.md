# 001 Lesson Versioning

## Context

Admins will revise lessons after students have already attempted published content.

## Decision

Use stable `Lesson` records and immutable-attempt `LessonVersion` references.

## Alternatives Considered

Only storing blocks directly on `Lesson` was simpler, but would rewrite history when content changes.

## Consequences

Attempts remain historically accurate. Admin publishing requires active-version rules.
