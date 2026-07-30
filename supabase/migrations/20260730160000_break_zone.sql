-- Child-safe YouTube Break Zone: moderation, scoped approvals, schedules and analytics.
CREATE TABLE IF NOT EXISTS public."BreakZoneVideo" (
  "id" text PRIMARY KEY CHECK ("id" ~ '^[A-Za-z0-9_-]{11}$'),
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "channelId" text NOT NULL DEFAULT '',
  "channelTitle" text NOT NULL DEFAULT '',
  "thumbnailUrl" text,
  "durationSeconds" integer NOT NULL CHECK ("durationSeconds" BETWEEN 1 AND 1200),
  "publishedAt" timestamptz,
  "metadataHash" text NOT NULL,
  "metadataStatus" text NOT NULL DEFAULT 'pending' CHECK ("metadataStatus" IN ('pending','approved','rejected','error')),
  "moderationStatus" text NOT NULL DEFAULT 'pending' CHECK ("moderationStatus" IN ('pending','approved','rejected','suspended','error')),
  "severity" text NOT NULL DEFAULT 'unknown' CHECK ("severity" IN ('none','low','medium','high','critical','unknown')),
  "categories" text[] NOT NULL DEFAULT '{}',
  "summary" text NOT NULL DEFAULT '',
  "policyVersion" text NOT NULL DEFAULT 'break-zone-v1',
  "lastCheckedAt" timestamptz,
  "nextReviewAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."BreakZoneAssessment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "videoId" text NOT NULL REFERENCES public."BreakZoneVideo"("id") ON DELETE CASCADE,
  "stage" text NOT NULL CHECK ("stage" IN ('metadata','full_video')),
  "decision" text NOT NULL CHECK ("decision" IN ('approved','rejected','error')),
  "severity" text NOT NULL,
  "categories" text[] NOT NULL DEFAULT '{}',
  "reasons" text[] NOT NULL DEFAULT '{}',
  "summary" text NOT NULL DEFAULT '',
  "model" text,
  "responseId" text,
  "policyVersion" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."BreakZoneApproval" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "videoId" text NOT NULL REFERENCES public."BreakZoneVideo"("id") ON DELETE CASCADE,
  "scope" text NOT NULL CHECK ("scope" IN ('global','class')),
  "classId" uuid REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "decision" text NOT NULL CHECK ("decision" IN ('approved','revoked','rejected')),
  "actorId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "actorRole" text NOT NULL CHECK ("actorRole" IN ('teacher','admin')),
  "reason" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CHECK (("scope" = 'global' AND "classId" IS NULL) OR ("scope" = 'class' AND "classId" IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS "BreakZoneApproval_video_scope_idx" ON public."BreakZoneApproval" ("videoId","scope","classId","createdAt" DESC);

CREATE TABLE IF NOT EXISTS public."BreakZoneModerationJob" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "videoId" text NOT NULL REFERENCES public."BreakZoneVideo"("id") ON DELETE CASCADE,
  "requestedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "status" text NOT NULL DEFAULT 'queued' CHECK ("status" IN ('queued','processing','completed','retry','dead')),
  "attempts" integer NOT NULL DEFAULT 0,
  "availableAt" timestamptz NOT NULL DEFAULT now(),
  "lockedAt" timestamptz,
  "lockedBy" text,
  "lastError" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "completedAt" timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS "BreakZoneModerationJob_one_active_idx" ON public."BreakZoneModerationJob" ("videoId") WHERE "status" IN ('queued','processing','retry');
CREATE INDEX IF NOT EXISTS "BreakZoneModerationJob_queue_idx" ON public."BreakZoneModerationJob" ("status","availableAt");

CREATE TABLE IF NOT EXISTS public."BreakZoneSchedule" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "teacherId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "dayOfWeek" integer NOT NULL CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  "startsAt" time NOT NULL,
  "endsAt" time NOT NULL,
  "timezone" text NOT NULL DEFAULT 'Africa/Accra',
  "enabled" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("classId","dayOfWeek","startsAt","endsAt")
);

CREATE TABLE IF NOT EXISTS public."BreakZoneSearchEvent" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  "query" text NOT NULL,
  "resultCount" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "BreakZoneSearchEvent_student_idx" ON public."BreakZoneSearchEvent" ("studentId","createdAt" DESC);

CREATE TABLE IF NOT EXISTS public."BreakZoneViewSession" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "videoId" text NOT NULL REFERENCES public."BreakZoneVideo"("id") ON DELETE CASCADE,
  "startedAt" timestamptz NOT NULL DEFAULT now(),
  "lastHeartbeatAt" timestamptz NOT NULL DEFAULT now(),
  "watchedSeconds" integer NOT NULL DEFAULT 0,
  "maxPositionSeconds" integer NOT NULL DEFAULT 0,
  "completed" boolean NOT NULL DEFAULT false,
  "completedAt" timestamptz,
  "endedAt" timestamptz
);
CREATE INDEX IF NOT EXISTS "BreakZoneViewSession_student_idx" ON public."BreakZoneViewSession" ("studentId","startedAt" DESC);

CREATE TABLE IF NOT EXISTS public."BreakZoneReward" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "videoId" text NOT NULL REFERENCES public."BreakZoneVideo"("id") ON DELETE CASCADE,
  "rewardDate" date NOT NULL,
  "xp" integer NOT NULL DEFAULT 10 CHECK ("xp" BETWEEN 0 AND 25),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("studentId","videoId","rewardDate")
);

CREATE TABLE IF NOT EXISTS public."BreakZoneReport" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "videoId" text NOT NULL REFERENCES public."BreakZoneVideo"("id") ON DELETE CASCADE,
  "studentId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "reason" text NOT NULL CHECK ("reason" IN ('sexual','violence','bullying','hate','self_harm','dangerous','frightening','misinformation','personal_information','other')),
  "details" text NOT NULL DEFAULT '',
  "status" text NOT NULL DEFAULT 'open' CHECK ("status" IN ('open','reviewing','resolved','dismissed')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "resolvedAt" timestamptz,
  "resolvedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "resolutionNote" text
);

CREATE TABLE IF NOT EXISTS public."BreakZoneAudit" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "videoId" text REFERENCES public."BreakZoneVideo"("id") ON DELETE SET NULL,
  "actorId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "action" text NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."BreakZoneInterestProfile" (
  "studentId" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "interests" jsonb NOT NULL DEFAULT '{}',
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."BreakZoneNotification" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "videoId" text REFERENCES public."BreakZoneVideo"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "readAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."BreakZoneConfig" (
  "id" boolean PRIMARY KEY DEFAULT true CHECK ("id"),
  "enabled" boolean NOT NULL DEFAULT true,
  "dailyXpCap" integer NOT NULL DEFAULT 30 CHECK ("dailyXpCap" BETWEEN 0 AND 100),
  "completionXp" integer NOT NULL DEFAULT 10 CHECK ("completionXp" BETWEEN 0 AND 25),
  "retentionDays" integer NOT NULL DEFAULT 90 CHECK ("retentionDays" BETWEEN 30 AND 365),
  "moderationModel" text NOT NULL DEFAULT 'gemini-2.5-flash',
  "updatedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public."BreakZoneConfig" ("id") VALUES (true) ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS public."BreakZoneDailyAggregate" (
  "day" date PRIMARY KEY,
  "searches" integer NOT NULL DEFAULT 0,
  "views" integer NOT NULL DEFAULT 0,
  "completedViews" integer NOT NULL DEFAULT 0,
  "watchSeconds" bigint NOT NULL DEFAULT 0,
  "reports" integer NOT NULL DEFAULT 0,
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.cleanup_break_zone_identifiers()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cutoff date;
BEGIN
  SELECT (now() - make_interval(days => "retentionDays"))::date INTO cutoff
  FROM "BreakZoneConfig" WHERE "id" = true;
  cutoff := coalesce(cutoff, (now() - interval '90 days')::date);
  INSERT INTO "BreakZoneDailyAggregate" ("day","searches","views","completedViews","watchSeconds","reports")
  SELECT day, sum(searches), sum(views), sum(completed), sum(seconds), sum(reports)
  FROM (
    SELECT "createdAt"::date day, count(*)::int searches, 0 views, 0 completed, 0::bigint seconds, 0 reports
      FROM "BreakZoneSearchEvent" WHERE "createdAt" < cutoff GROUP BY 1
    UNION ALL
    SELECT "startedAt"::date, 0, count(*)::int, count(*) FILTER (WHERE "completed")::int,
      coalesce(sum("watchedSeconds"),0)::bigint, 0 FROM "BreakZoneViewSession" WHERE "startedAt" < cutoff GROUP BY 1
    UNION ALL
    SELECT "createdAt"::date, 0, 0, 0, 0::bigint, count(*)::int
      FROM "BreakZoneReport" WHERE "createdAt" < cutoff GROUP BY 1
  ) daily GROUP BY day
  ON CONFLICT ("day") DO UPDATE SET
    "searches"=EXCLUDED."searches","views"=EXCLUDED."views","completedViews"=EXCLUDED."completedViews",
    "watchSeconds"=EXCLUDED."watchSeconds","reports"=EXCLUDED."reports","updatedAt"=now();
  DELETE FROM "BreakZoneSearchEvent" WHERE "createdAt" < cutoff;
  DELETE FROM "BreakZoneViewSession" WHERE "startedAt" < cutoff;
  UPDATE "BreakZoneReport" SET "studentId"=NULL, "details"='' WHERE "createdAt" < cutoff;
END $$;

ALTER TABLE public."BreakZoneVideo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneAssessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneApproval" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneModerationJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneSearchEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneViewSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneReward" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneAudit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneInterestProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BreakZoneDailyAggregate" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public."BreakZoneVideo", public."BreakZoneAssessment", public."BreakZoneApproval",
 public."BreakZoneModerationJob", public."BreakZoneSchedule", public."BreakZoneSearchEvent",
 public."BreakZoneViewSession", public."BreakZoneReward", public."BreakZoneReport",
 public."BreakZoneAudit", public."BreakZoneInterestProfile", public."BreakZoneNotification",
 public."BreakZoneConfig", public."BreakZoneDailyAggregate" TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_break_zone_identifiers() TO service_role;

-- The application uses validated server routes. Limited self-read policies support future realtime UI.
CREATE POLICY "students read own break notifications" ON public."BreakZoneNotification" FOR SELECT TO authenticated USING ("studentId" = auth.uid());
CREATE POLICY "students read own break sessions" ON public."BreakZoneViewSession" FOR SELECT TO authenticated USING ("studentId" = auth.uid());
GRANT SELECT ON public."BreakZoneNotification", public."BreakZoneViewSession" TO authenticated;
