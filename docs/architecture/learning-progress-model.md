# Learning Progress Model

Learning state is split into three layers:

- Progress snapshot: current fast-to-read state for the student and dashboard.
- Attempts and responses: immutable evidence of submitted lesson work.
- Learning events: append-only actor-verb-object records for analytics and reconstruction.

`transitionLessonProgress` validates state movement and preserves best score, first completion time and mastery. Optional blocks do not prevent completion because progress percentage is based only on required blocks.
