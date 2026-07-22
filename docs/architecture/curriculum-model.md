# Curriculum Model

SkulKid separates stable lesson identity from published lesson content.

- `Lesson` is the stable conceptual record used for ordering and prerequisites.
- `LessonVersion` is the exact authored content a student sees.
- Attempts, sessions and events reference `lessonVersionId` so historical learning records remain readable after admins revise a lesson.
- `LessonBlock.content` is JSON in Prisma, but application boundaries validate block JSON through strict Zod discriminated unions.

Publishable lesson versions require objectives, intro, instructional content, assessment, exactly one summary, valid objective references, valid answers and safe image alt text.
