-- Unified observability, alerting, recovery, privacy, release, and scoped-admin records.

CREATE TABLE IF NOT EXISTS public."AdminOperationalEvent" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "category" text NOT NULL CHECK ("category" IN ('authentication','application','database','provider','abuse','data_health','privacy','release','job')),
  "eventType" text NOT NULL,
  "outcome" text NOT NULL CHECK ("outcome" IN ('success','failure','blocked','timeout','warning')),
  "severity" text NOT NULL DEFAULT 'info' CHECK ("severity" IN ('info','low','medium','high','critical')),
  "route" text,
  "subjectHash" text,
  "ipHash" text,
  "durationMs" integer CHECK ("durationMs" >= 0),
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "AdminOperationalEvent_created_idx" ON public."AdminOperationalEvent" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AdminOperationalEvent_type_idx" ON public."AdminOperationalEvent" ("eventType", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AdminOperationalEvent_subject_idx" ON public."AdminOperationalEvent" ("subjectHash", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS public."AdminAlertRule" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "metric" text NOT NULL,
  "operator" text NOT NULL CHECK ("operator" IN ('gt','gte','lt','lte','eq')),
  "threshold" numeric NOT NULL,
  "windowMinutes" integer NOT NULL CHECK ("windowMinutes" BETWEEN 1 AND 10080),
  "severity" text NOT NULL CHECK ("severity" IN ('low','medium','high','critical')),
  "enabled" boolean NOT NULL DEFAULT true,
  "autoIncident" boolean NOT NULL DEFAULT true,
  "notificationChannel" text,
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."AdminAlert" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ruleId" text REFERENCES public."AdminAlertRule"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "detail" text NOT NULL DEFAULT '',
  "severity" text NOT NULL CHECK ("severity" IN ('low','medium','high','critical')),
  "status" text NOT NULL DEFAULT 'open' CHECK ("status" IN ('open','acknowledged','resolved')),
  "affectedService" text NOT NULL DEFAULT 'SkulKid',
  "metricValue" numeric,
  "ownerId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "incidentId" uuid REFERENCES public."AdminIncident"("id") ON DELETE SET NULL,
  "detectedAt" timestamptz NOT NULL DEFAULT now(),
  "acknowledgedAt" timestamptz,
  "resolvedAt" timestamptz,
  "resolutionNote" text
);
CREATE INDEX IF NOT EXISTS "AdminAlert_status_idx" ON public."AdminAlert" ("status", "detectedAt" DESC);

CREATE TABLE IF NOT EXISTS public."AdminRoleAssignment" (
  "userId" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "adminRole" text NOT NULL CHECK ("adminRole" IN ('super_admin','security_admin','system_operator','support_agent','content_moderator','curriculum_manager','billing_operator','privacy_officer','read_only_auditor')),
  "assignedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "assignedAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."AdminRecoveryRecord" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "recordType" text NOT NULL CHECK ("recordType" IN ('backup','restore_test','recovery_drill')),
  "status" text NOT NULL CHECK ("status" IN ('started','successful','failed','unverified')),
  "provider" text NOT NULL DEFAULT '',
  "sizeBytes" bigint,
  "rpoMinutes" integer,
  "rtoMinutes" integer,
  "startedAt" timestamptz NOT NULL,
  "completedAt" timestamptz,
  "verifiedAt" timestamptz,
  "notes" text NOT NULL DEFAULT '',
  "recordedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public."AdminPrivacyRequest" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "requestType" text NOT NULL CHECK ("requestType" IN ('data_export','account_deletion','data_correction','access_review','safety_escalation')),
  "subjectUserId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "status" text NOT NULL DEFAULT 'open' CHECK ("status" IN ('open','verifying','processing','completed','rejected')),
  "priority" text NOT NULL DEFAULT 'normal' CHECK ("priority" IN ('normal','high','urgent')),
  "ownerId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "dueAt" timestamptz,
  "summary" text NOT NULL DEFAULT '',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "completedAt" timestamptz
);

CREATE TABLE IF NOT EXISTS public."AdminReleaseRecord" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "commitSha" text NOT NULL,
  "environment" text NOT NULL DEFAULT 'production',
  "status" text NOT NULL CHECK ("status" IN ('deploying','ready','failed','rolled_back')),
  "deploymentUrl" text,
  "migrationVersion" text,
  "deployedAt" timestamptz NOT NULL DEFAULT now(),
  "rolledBackAt" timestamptz,
  "notes" text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public."AdminProviderSnapshot" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" text NOT NULL,
  "service" text NOT NULL,
  "status" text NOT NULL CHECK ("status" IN ('operational','degraded','down','not_configured','unknown')),
  "balance" numeric,
  "currency" text,
  "senderIdStatus" text,
  "deliveryRate" numeric,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "checkedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "AdminProviderSnapshot_provider_idx" ON public."AdminProviderSnapshot" ("provider", "checkedAt" DESC);

ALTER TABLE public."AdminIncident" ADD COLUMN IF NOT EXISTS "ownerId" uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."AdminIncident" ADD COLUMN IF NOT EXISTS "acknowledgedAt" timestamptz;
ALTER TABLE public."AdminIncident" ADD COLUMN IF NOT EXISTS "resolutionTargetAt" timestamptz;
ALTER TABLE public."AdminIncident" ADD COLUMN IF NOT EXISTS "runbookUrl" text;
ALTER TABLE public."AdminIncident" ADD COLUMN IF NOT EXISTS "timeline" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public."AdminIncident" ADD COLUMN IF NOT EXISTS "postIncidentReview" text;

INSERT INTO public."AdminAlertRule" ("id","name","metric","operator","threshold","windowMinutes","severity","autoIncident")
VALUES
  ('otp-acceptance-low','OTP acceptance below 90%','otp_acceptance_rate','lt',90,60,'high',true),
  ('signup-completion-drop','Signup completion below 50%','signup_completion_rate','lt',50,1440,'medium',true),
  ('api-error-rate-high','API error rate above 5%','api_error_rate','gt',5,15,'high',true),
  ('database-unavailable','Database unavailable','database_available','eq',0,5,'critical',true),
  ('admin-login-failures','Multiple failed admin logins','admin_login_failures','gte',5,15,'high',true),
  ('provider-latency-high','Provider latency above 5 seconds','provider_latency_ms','gt',5000,15,'medium',true),
  ('telemetry-silent','Operational logging has stopped','telemetry_age_minutes','gt',30,30,'high',true),
  ('sms-balance-low','SMS balance below configured minimum','sms_balance','lt',10,60,'medium',false)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE public."AdminOperationalEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminAlertRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminRoleAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminRecoveryRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminPrivacyRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminReleaseRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminProviderSnapshot" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'AdminOperationalEvent','AdminAlertRule','AdminAlert','AdminRoleAssignment',
    'AdminRecoveryRecord','AdminPrivacyRequest','AdminReleaseRecord','AdminProviderSnapshot'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "admins read %s" ON public.%I', lower(table_name), table_name);
    EXECUTE format('CREATE POLICY "admins read %s" ON public.%I FOR SELECT TO authenticated USING (public.is_skulkid_admin())', lower(table_name), table_name);
  END LOOP;
END $$;

GRANT SELECT ON public."AdminOperationalEvent", public."AdminAlertRule", public."AdminAlert",
  public."AdminRoleAssignment", public."AdminRecoveryRecord", public."AdminPrivacyRequest",
  public."AdminReleaseRecord", public."AdminProviderSnapshot" TO authenticated;
GRANT ALL ON public."AdminOperationalEvent", public."AdminAlertRule", public."AdminAlert",
  public."AdminRoleAssignment", public."AdminRecoveryRecord", public."AdminPrivacyRequest",
  public."AdminReleaseRecord", public."AdminProviderSnapshot" TO service_role;
