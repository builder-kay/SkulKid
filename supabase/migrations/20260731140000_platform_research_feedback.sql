-- Anonymous research questionnaire responses (Forms A/B/C).

CREATE TABLE public."PlatformFeedbackResponse" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "formType" text NOT NULL CHECK ("formType" IN ('student', 'teacher')),
  "instrumentVersion" text NOT NULL DEFAULT 'ucc-2026-v1',
  "answers" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "sectionMeans" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "meta" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "PlatformFeedbackResponse_form_created_idx"
  ON public."PlatformFeedbackResponse" ("formType", "createdAt" DESC);

CREATE INDEX "PlatformFeedbackResponse_created_idx"
  ON public."PlatformFeedbackResponse" ("createdAt" DESC);

ALTER TABLE public."PlatformFeedbackResponse" ENABLE ROW LEVEL SECURITY;

-- Reads for authenticated admins only. Writes go through service-role API.
CREATE POLICY "admins can read research feedback"
  ON public."PlatformFeedbackResponse"
  FOR SELECT
  TO authenticated
  USING (public.is_skulkid_admin());

GRANT SELECT ON public."PlatformFeedbackResponse" TO authenticated;
GRANT ALL ON public."PlatformFeedbackResponse" TO service_role;
