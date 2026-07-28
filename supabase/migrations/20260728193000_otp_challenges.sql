-- Hashed, short-lived OTPs used by SMS providers without their own verification API.

CREATE TABLE public."OtpChallenge" (
  "phone" text PRIMARY KEY,
  "codeHash" text NOT NULL,
  "attempts" integer NOT NULL DEFAULT 0 CHECK ("attempts" BETWEEN 0 AND 5),
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "OtpChallenge_expiry_idx"
ON public."OtpChallenge" ("expiresAt");

ALTER TABLE public."OtpChallenge" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."OtpChallenge" TO service_role;
