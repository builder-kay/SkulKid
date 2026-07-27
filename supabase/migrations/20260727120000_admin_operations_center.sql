-- Auditable platform administration and provider-neutral operations tracking.

CREATE TABLE public."AdminAuditEvent" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "action" text NOT NULL,
  "targetType" text NOT NULL,
  "targetId" text,
  "result" text NOT NULL DEFAULT 'success' CHECK ("result" IN ('success', 'failure')),
  "reason" text,
  "requestId" text NOT NULL,
  "before" jsonb,
  "after" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "AdminAuditEvent_created_idx" ON public."AdminAuditEvent" ("createdAt" DESC);
CREATE INDEX "AdminAuditEvent_target_idx" ON public."AdminAuditEvent" ("targetType", "targetId");

CREATE TABLE public."AdminIncident" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL CHECK (char_length(trim("title")) BETWEEN 4 AND 160),
  "summary" text NOT NULL DEFAULT '',
  "severity" text NOT NULL CHECK ("severity" IN ('low', 'medium', 'high', 'critical')),
  "status" text NOT NULL DEFAULT 'open' CHECK ("status" IN ('open', 'monitoring', 'resolved')),
  "affectedService" text NOT NULL DEFAULT 'SkulKid',
  "openedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "resolvedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "resolvedAt" timestamptz
);
CREATE INDEX "AdminIncident_status_idx" ON public."AdminIncident" ("status", "updatedAt" DESC);

CREATE TABLE public."AdminMaintenanceWindow" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "notes" text NOT NULL DEFAULT '',
  "startsAt" timestamptz NOT NULL,
  "endsAt" timestamptz NOT NULL,
  "status" text NOT NULL DEFAULT 'scheduled' CHECK ("status" IN ('scheduled', 'active', 'completed', 'cancelled')),
  "createdBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CHECK ("endsAt" > "startsAt")
);

CREATE TABLE public."AdminServiceInventory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL UNIQUE,
  "category" text NOT NULL,
  "owner" text NOT NULL DEFAULT '',
  "provider" text NOT NULL DEFAULT '',
  "status" text NOT NULL DEFAULT 'not_configured' CHECK ("status" IN ('operational', 'degraded', 'down', 'not_configured')),
  "consoleUrl" text,
  "runbookUrl" text,
  "renewalAt" date,
  "notes" text NOT NULL DEFAULT '',
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public."AdminServiceInventory" ("name", "category", "provider", "status", "notes")
VALUES
  ('Authentication and database', 'Core platform', 'Supabase', 'operational', 'Status is verified by the application health check.'),
  ('Application hosting', 'Hosting', '', 'not_configured', 'Configure a provider adapter before deployment controls are enabled.'),
  ('Backups and recovery', 'Data protection', '', 'not_configured', 'Configure a provider adapter before backup controls are enabled.'),
  ('Error monitoring', 'Observability', '', 'not_configured', 'Configure a provider adapter to ingest incidents and failures.')
ON CONFLICT ("name") DO NOTHING;

ALTER TABLE public."AdminAuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminIncident" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminMaintenanceWindow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminServiceInventory" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read audit events" ON public."AdminAuditEvent"
  FOR SELECT TO authenticated USING (public.is_skulkid_admin());
CREATE POLICY "admins read incidents" ON public."AdminIncident"
  FOR SELECT TO authenticated USING (public.is_skulkid_admin());
CREATE POLICY "admins read maintenance" ON public."AdminMaintenanceWindow"
  FOR SELECT TO authenticated USING (public.is_skulkid_admin());
CREATE POLICY "admins read service inventory" ON public."AdminServiceInventory"
  FOR SELECT TO authenticated USING (public.is_skulkid_admin());

-- All mutations go through authenticated service-role routes so an audit record
-- and the state change can be coordinated by the server.
GRANT SELECT ON public."AdminAuditEvent", public."AdminIncident",
  public."AdminMaintenanceWindow", public."AdminServiceInventory" TO authenticated;
GRANT ALL ON public."AdminAuditEvent", public."AdminIncident",
  public."AdminMaintenanceWindow", public."AdminServiceInventory" TO service_role;
