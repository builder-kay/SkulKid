-- Incremental upgrade for installations that already applied OTP provider diagnostics.

CREATE TABLE IF NOT EXISTS public."SignupFunnelSession" (
  "id" uuid PRIMARY KEY,
  "role" text NOT NULL CHECK ("role" IN ('student', 'teacher')),
  "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'completed', 'abandoned')),
  "highestStep" integer NOT NULL DEFAULT 1 CHECK ("highestStep" BETWEEN 1 AND 5),
  "otpRequestedAt" timestamptz,
  "completedAt" timestamptz,
  "abandonedAt" timestamptz,
  "startedAt" timestamptz NOT NULL DEFAULT now(),
  "lastSeenAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "SignupFunnelSession_started_idx"
ON public."SignupFunnelSession" ("startedAt" DESC);

CREATE INDEX IF NOT EXISTS "SignupFunnelSession_status_idx"
ON public."SignupFunnelSession" ("status", "lastSeenAt" DESC);

ALTER TABLE public."OtpProviderDiagnostic"
ADD COLUMN IF NOT EXISTS "signupSessionId" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'OtpProviderDiagnostic_signupSessionId_fkey'
      AND conrelid = 'public."OtpProviderDiagnostic"'::regclass
  ) THEN
    ALTER TABLE public."OtpProviderDiagnostic"
    ADD CONSTRAINT "OtpProviderDiagnostic_signupSessionId_fkey"
    FOREIGN KEY ("signupSessionId")
    REFERENCES public."SignupFunnelSession"("id")
    ON DELETE SET NULL;
  END IF;
END
$$;

ALTER TABLE public."SignupFunnelSession" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read signup funnel sessions"
ON public."SignupFunnelSession";

CREATE POLICY "admins read signup funnel sessions"
ON public."SignupFunnelSession"
FOR SELECT TO authenticated
USING (public.is_skulkid_admin());

GRANT SELECT ON public."SignupFunnelSession" TO authenticated;
GRANT ALL ON public."SignupFunnelSession" TO service_role;

