ALTER TABLE public."ClassQuiz"
  ADD COLUMN IF NOT EXISTS "startAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "offPlatformReward" text NOT NULL DEFAULT '';

ALTER TABLE public."ClassQuiz"
  ADD CONSTRAINT "ClassQuiz_schedule_order"
  CHECK ("startAt" IS NULL OR "deadline" IS NULL OR "startAt" < "deadline"),
  ADD CONSTRAINT "ClassQuiz_offline_reward_length"
  CHECK (char_length("offPlatformReward") <= 500);

CREATE INDEX IF NOT EXISTS "ClassQuiz_schedule_idx"
ON public."ClassQuiz" ("classId", "startAt", "deadline")
WHERE "status" = 'published';
