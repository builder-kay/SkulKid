-- Form C removed: allow only student + teacher responses.
-- Safe to run when PlatformFeedbackResponse already exists.

ALTER TABLE public."PlatformFeedbackResponse"
  DROP CONSTRAINT IF EXISTS "PlatformFeedbackResponse_formType_check";

ALTER TABLE public."PlatformFeedbackResponse"
  ADD CONSTRAINT "PlatformFeedbackResponse_formType_check"
  CHECK ("formType" IN ('student', 'teacher'));

-- Drop any Form C rows if present (optional cleanup).
DELETE FROM public."PlatformFeedbackResponse" WHERE "formType" = 'system';
