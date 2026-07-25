-- Short-lived, service-role-only state for student username recovery.

CREATE TABLE public."UsernameRecoveryAttempt" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone" text NOT NULL,
  "stage" text NOT NULL CHECK ("stage" IN ('identity', 'name', 'otp', 'completed')),
  "selectedUserId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  "age" integer CHECK ("age" BETWEEN 5 AND 18),
  "grade" integer CHECK ("grade" BETWEEN 1 AND 6),
  "learnerName" text,
  "identityAttempts" integer NOT NULL DEFAULT 0 CHECK ("identityAttempts" BETWEEN 0 AND 5),
  "otpAttempts" integer NOT NULL DEFAULT 0 CHECK ("otpAttempts" BETWEEN 0 AND 5),
  "expiresAt" timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  "completedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "UsernameRecoveryAttempt_expiry_idx"
ON public."UsernameRecoveryAttempt" ("expiresAt");

ALTER TABLE public."UsernameRecoveryAttempt" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."UsernameRecoveryAttempt" TO service_role;
