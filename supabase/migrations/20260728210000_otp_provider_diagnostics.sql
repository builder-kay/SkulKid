-- Privacy-preserving delivery diagnostics for OTP provider submissions.

CREATE TABLE public."SignupFunnelSession" (
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

CREATE INDEX "SignupFunnelSession_started_idx"
ON public."SignupFunnelSession" ("startedAt" DESC);

CREATE INDEX "SignupFunnelSession_status_idx"
ON public."SignupFunnelSession" ("status", "lastSeenAt" DESC);

CREATE TABLE public."OtpProviderDiagnostic" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "attemptId" uuid NOT NULL,
  "signupSessionId" uuid REFERENCES public."SignupFunnelSession"("id") ON DELETE SET NULL,
  "provider" text NOT NULL CHECK ("provider" IN ('clifze', 'arkesel', 'bms')),
  "purpose" text NOT NULL,
  "status" text NOT NULL CHECK ("status" IN ('accepted', 'rejected')),
  "maskedPhone" text NOT NULL,
  "latencyMs" integer NOT NULL CHECK ("latencyMs" >= 0),
  "deliveryStatus" text,
  "error" text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "OtpProviderDiagnostic_created_idx"
ON public."OtpProviderDiagnostic" ("createdAt" DESC);

CREATE INDEX "OtpProviderDiagnostic_attempt_idx"
ON public."OtpProviderDiagnostic" ("attemptId");

ALTER TABLE public."OtpProviderDiagnostic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SignupFunnelSession" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read otp provider diagnostics"
ON public."OtpProviderDiagnostic"
FOR SELECT TO authenticated
USING (public.is_skulkid_admin());

CREATE POLICY "admins read signup funnel sessions"
ON public."SignupFunnelSession"
FOR SELECT TO authenticated
USING (public.is_skulkid_admin());

GRANT SELECT ON public."OtpProviderDiagnostic", public."SignupFunnelSession" TO authenticated;
GRANT ALL ON public."OtpProviderDiagnostic", public."SignupFunnelSession" TO service_role;
