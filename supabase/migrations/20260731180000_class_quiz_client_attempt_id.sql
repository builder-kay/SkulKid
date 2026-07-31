-- Safe replay of offline class-quiz submits.

ALTER TABLE public."ClassQuizAttempt"
  ADD COLUMN IF NOT EXISTS "clientAttemptId" text;

CREATE UNIQUE INDEX IF NOT EXISTS "ClassQuizAttempt_student_client_attempt_uidx"
  ON public."ClassQuizAttempt" ("studentId", "clientAttemptId")
  WHERE "clientAttemptId" IS NOT NULL;
