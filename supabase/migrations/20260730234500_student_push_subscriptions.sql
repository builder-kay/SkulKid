CREATE TABLE IF NOT EXISTS public."StudentPushSubscription" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "endpoint" text NOT NULL UNIQUE,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "userAgent" text,
  "enabled" boolean NOT NULL DEFAULT true,
  "failureCount" integer NOT NULL DEFAULT 0 CHECK ("failureCount" >= 0),
  "lastSuccessAt" timestamptz,
  "lastFailureAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "StudentPushSubscription_user_enabled_idx"
ON public."StudentPushSubscription" ("userId", "enabled");

ALTER TABLE public."StudentPushSubscription" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students read own push subscriptions" ON public."StudentPushSubscription";
CREATE POLICY "students read own push subscriptions"
ON public."StudentPushSubscription" FOR SELECT TO authenticated
USING ("userId" = auth.uid());

REVOKE ALL ON public."StudentPushSubscription" FROM anon, authenticated;
GRANT SELECT ON public."StudentPushSubscription" TO authenticated;
GRANT ALL ON public."StudentPushSubscription" TO service_role;

COMMENT ON TABLE public."StudentPushSubscription"
IS 'Per-device Web Push endpoints. Keys are transport credentials and must never be rendered in admin views or logs.';
