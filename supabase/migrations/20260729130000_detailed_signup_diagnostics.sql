-- Store only a short username prefix for support diagnostics. Full usernames,
-- phone numbers, OTP values, passwords and session secrets are never logged.

ALTER TABLE public."SignupFunnelSession"
ADD COLUMN IF NOT EXISTS "usernamePrefix" text;

ALTER TABLE public."SignupFunnelSession"
DROP CONSTRAINT IF EXISTS "SignupFunnelSession_usernamePrefix_check";

ALTER TABLE public."SignupFunnelSession"
ADD CONSTRAINT "SignupFunnelSession_usernamePrefix_check"
CHECK (
  "usernamePrefix" IS NULL
  OR "usernamePrefix" ~ '^[a-z0-9_]{1,6}$'
);
