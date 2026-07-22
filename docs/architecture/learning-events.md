# Learning Events

Learning events are internal, stable actor-verb-object statements.

Initial verbs include lesson start/resume, block viewed/completed, answer submitted, hint requested, lesson completed/mastered and reward earned.

Events are append-only and include `eventVersion` plus `idempotencyKey`. They intentionally avoid unnecessary personal data and are not the only source for serving current progress.
