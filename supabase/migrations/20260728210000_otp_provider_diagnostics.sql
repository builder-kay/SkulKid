-- Privacy-preserving delivery diagnostics for OTP provider submissions.

CREATE TABLE public."OtpProviderDiagnostic" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "attemptId" uuid NOT NULL,
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

CREATE POLICY "admins read otp provider diagnostics"
ON public."OtpProviderDiagnostic"
FOR SELECT TO authenticated
USING (public.is_skulkid_admin());

GRANT SELECT ON public."OtpProviderDiagnostic" TO authenticated;
GRANT ALL ON public."OtpProviderDiagnostic" TO service_role;

