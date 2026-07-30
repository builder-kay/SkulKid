ALTER TABLE public."ClassAdvice"
  ADD COLUMN IF NOT EXISTS "title" text,
  ADD COLUMN IF NOT EXISTS "feedbackCategory" text,
  ADD COLUMN IF NOT EXISTS "priority" text,
  ADD COLUMN IF NOT EXISTS "recommendedActions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "evidenceSnapshot" jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "followUpStatus" text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS "dueAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "acknowledgedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "resolvedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "resolutionNote" text;

ALTER TABLE public."ClassAdvice"
  DROP CONSTRAINT IF EXISTS "ClassAdvice_feedback_category_check",
  ADD CONSTRAINT "ClassAdvice_feedback_category_check"
    CHECK ("feedbackCategory" IS NULL OR "feedbackCategory" IN ('celebration','practice','intervention')),
  DROP CONSTRAINT IF EXISTS "ClassAdvice_priority_check",
  ADD CONSTRAINT "ClassAdvice_priority_check"
    CHECK ("priority" IS NULL OR "priority" IN ('low','normal','high')),
  DROP CONSTRAINT IF EXISTS "ClassAdvice_follow_up_check",
  ADD CONSTRAINT "ClassAdvice_follow_up_check"
    CHECK ("followUpStatus" IN ('not_required','open','acknowledged','resolved')),
  DROP CONSTRAINT IF EXISTS "ClassAdvice_actions_array_check",
  ADD CONSTRAINT "ClassAdvice_actions_array_check"
    CHECK (jsonb_typeof("recommendedActions") = 'array' AND jsonb_array_length("recommendedActions") <= 5),
  DROP CONSTRAINT IF EXISTS "ClassAdvice_resolution_check",
  ADD CONSTRAINT "ClassAdvice_resolution_check"
    CHECK (("followUpStatus" <> 'resolved') OR ("resolvedAt" IS NOT NULL AND length(trim(coalesce("resolutionNote", ''))) >= 3));

CREATE INDEX IF NOT EXISTS "ClassAdvice_class_student_followup_idx"
ON public."ClassAdvice" ("classId", "studentId", "followUpStatus", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "ClassAdvice_due_open_idx"
ON public."ClassAdvice" ("dueAt")
WHERE "followUpStatus" IN ('open','acknowledged');

-- Students may mark feedback as read or acknowledged, but must not rewrite the
-- teacher's message, evidence, due date, or resolution.
REVOKE UPDATE ON public."ClassAdvice" FROM authenticated;
GRANT UPDATE ("readAt", "followUpStatus", "acknowledgedAt") ON public."ClassAdvice" TO authenticated;

COMMENT ON COLUMN public."ClassAdvice"."evidenceSnapshot"
IS 'Non-sensitive aggregate evidence captured when structured feedback is sent.';
