-- Rerunnable reconciliation migration for AI-assisted teacher content trust.
-- This is intentionally idempotent so it can repair databases where an older
-- version of this migration was already run manually.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public."TeacherTrustProfile" (
  "teacherId" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'probation'
    CHECK ("status" IN ('probation', 'content_trusted', 'legacy_trusted', 'monitored', 'banned')),
  "cleanLessonCount" integer NOT NULL DEFAULT 0 CHECK ("cleanLessonCount" >= 0),
  "requiredCleanLessons" integer NOT NULL DEFAULT 10 CHECK ("requiredCleanLessons" = 10),
  "monitoringRemaining" integer NOT NULL DEFAULT 0 CHECK ("monitoringRemaining" >= 0),
  "trustedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public."TeacherTrustProfile"
  ADD COLUMN IF NOT EXISTS "teacherId" uuid,
  ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'probation',
  ADD COLUMN IF NOT EXISTS "cleanLessonCount" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "requiredCleanLessons" integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "monitoringRemaining" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "trustedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz DEFAULT now();

UPDATE public."TeacherTrustProfile" SET
  "status" = COALESCE("status", 'probation'),
  "cleanLessonCount" = COALESCE("cleanLessonCount", 0),
  "requiredCleanLessons" = 10,
  "monitoringRemaining" = COALESCE("monitoringRemaining", 0),
  "createdAt" = COALESCE("createdAt", now()),
  "updatedAt" = COALESCE("updatedAt", now());

CREATE UNIQUE INDEX IF NOT EXISTS "TeacherTrustProfile_teacherId_uidx"
  ON public."TeacherTrustProfile" ("teacherId");

CREATE TABLE IF NOT EXISTS public."ContentModerationCase" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacherId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "contentType" text NOT NULL CHECK ("contentType" IN ('lesson', 'teacher_quiz', 'class_quiz')),
  "contentId" text NOT NULL,
  "contentHash" text NOT NULL,
  "snapshot" jsonb NOT NULL,
  "status" text NOT NULL
    CHECK ("status" IN ('checking', 'approved', 'held', 'rejected', 'overridden', 'error', 'cancelled')),
  "academicRelevance" text CHECK ("academicRelevance" IN ('genuine', 'unclear', 'nonacademic')),
  "severity" text CHECK ("severity" IN ('none', 'low', 'medium', 'high', 'critical')),
  "confidence" numeric(5,4),
  "categories" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "reasons" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "mediaWarnings" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "model" text,
  "responseId" text,
  "promptVersion" text NOT NULL DEFAULT 'teacher-content-v1',
  "reviewNote" text,
  "reviewedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "reviewedAt" timestamptz,
  "publishedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("teacherId", "contentType", "contentId", "contentHash")
);

ALTER TABLE public."ContentModerationCase"
  ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS "teacherId" uuid,
  ADD COLUMN IF NOT EXISTS "contentType" text,
  ADD COLUMN IF NOT EXISTS "contentId" text,
  ADD COLUMN IF NOT EXISTS "contentHash" text,
  ADD COLUMN IF NOT EXISTS "snapshot" jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'error',
  ADD COLUMN IF NOT EXISTS "academicRelevance" text,
  ADD COLUMN IF NOT EXISTS "severity" text,
  ADD COLUMN IF NOT EXISTS "confidence" numeric(5,4),
  ADD COLUMN IF NOT EXISTS "categories" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "reasons" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "mediaWarnings" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "model" text,
  ADD COLUMN IF NOT EXISTS "responseId" text,
  ADD COLUMN IF NOT EXISTS "promptVersion" text DEFAULT 'teacher-content-v1',
  ADD COLUMN IF NOT EXISTS "reviewNote" text,
  ADD COLUMN IF NOT EXISTS "reviewedBy" uuid,
  ADD COLUMN IF NOT EXISTS "reviewedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "publishedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz DEFAULT now();

UPDATE public."ContentModerationCase" SET
  "id" = COALESCE("id", gen_random_uuid()),
  "contentType" = COALESCE("contentType", 'lesson'),
  "contentId" = COALESCE("contentId", "id"::text),
  "snapshot" = COALESCE("snapshot", '{}'::jsonb),
  "status" = COALESCE("status", 'error'),
  "categories" = COALESCE("categories", '[]'::jsonb),
  "reasons" = COALESCE("reasons", '[]'::jsonb),
  "mediaWarnings" = COALESCE("mediaWarnings", '[]'::jsonb),
  "promptVersion" = COALESCE("promptVersion", 'teacher-content-v1'),
  "createdAt" = COALESCE("createdAt", now()),
  "updatedAt" = COALESCE("updatedAt", now());

UPDATE public."ContentModerationCase"
SET "contentHash" = encode(digest(COALESCE("snapshot", '{}'::jsonb)::text, 'sha256'), 'hex')
WHERE "contentHash" IS NULL OR "contentHash" = '';

CREATE UNIQUE INDEX IF NOT EXISTS "ContentModerationCase_id_uidx"
  ON public."ContentModerationCase" ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "ContentModerationCase_version_uidx"
  ON public."ContentModerationCase" ("teacherId", "contentType", "contentId", "contentHash");

CREATE TABLE IF NOT EXISTS public."ModerationAppeal" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacherId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "caseId" uuid REFERENCES public."ContentModerationCase"("id") ON DELETE SET NULL,
  "kind" text NOT NULL CHECK ("kind" IN ('content', 'account_ban')),
  "message" text NOT NULL CHECK (char_length(trim("message")) BETWEEN 20 AND 2000),
  "authMethod" text NOT NULL CHECK ("authMethod" IN ('session', 'otp')),
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'upheld', 'overturned')),
  "resolutionNote" text,
  "resolvedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "resolvedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public."ModerationAppeal"
  ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS "teacherId" uuid,
  ADD COLUMN IF NOT EXISTS "caseId" uuid,
  ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'content',
  ADD COLUMN IF NOT EXISTS "message" text DEFAULT 'Legacy moderation appeal awaiting administrator review.',
  ADD COLUMN IF NOT EXISTS "authMethod" text DEFAULT 'session',
  ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "resolutionNote" text,
  ADD COLUMN IF NOT EXISTS "resolvedBy" uuid,
  ADD COLUMN IF NOT EXISTS "resolvedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();

UPDATE public."ModerationAppeal" SET
  "id" = COALESCE("id", gen_random_uuid()),
  "kind" = COALESCE("kind", 'content'),
  "message" = COALESCE(NULLIF(trim("message"), ''), 'Legacy moderation appeal awaiting administrator review.'),
  "authMethod" = COALESCE("authMethod", 'session'),
  "status" = COALESCE("status", 'pending'),
  "createdAt" = COALESCE("createdAt", now());

CREATE UNIQUE INDEX IF NOT EXISTS "ModerationAppeal_id_uidx"
  ON public."ModerationAppeal" ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "ModerationAppeal_one_pending_case_idx"
  ON public."ModerationAppeal" ("teacherId", "caseId")
  WHERE "status" = 'pending' AND "caseId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "ModerationAppeal_one_pending_ban_idx"
  ON public."ModerationAppeal" ("teacherId")
  WHERE "status" = 'pending' AND "kind" = 'account_ban';

CREATE TABLE IF NOT EXISTS public."TeacherPhoneBan" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacherId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "phoneHash" text NOT NULL,
  "phoneLast4" text NOT NULL,
  "reason" text NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "bannedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "bannedAt" timestamptz NOT NULL DEFAULT now(),
  "liftedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "liftedAt" timestamptz
);

ALTER TABLE public."TeacherPhoneBan"
  ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS "teacherId" uuid,
  ADD COLUMN IF NOT EXISTS "phoneHash" text,
  ADD COLUMN IF NOT EXISTS "phoneLast4" text DEFAULT '????',
  ADD COLUMN IF NOT EXISTS "reason" text DEFAULT 'Legacy teacher phone restriction',
  ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "bannedBy" uuid,
  ADD COLUMN IF NOT EXISTS "bannedAt" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "liftedBy" uuid,
  ADD COLUMN IF NOT EXISTS "liftedAt" timestamptz;

UPDATE public."TeacherPhoneBan" SET
  "id" = COALESCE("id", gen_random_uuid()),
  "phoneLast4" = COALESCE(NULLIF("phoneLast4", ''), '????'),
  "reason" = COALESCE(NULLIF(trim("reason"), ''), 'Legacy teacher phone restriction'),
  "active" = COALESCE("active", true),
  "bannedAt" = COALESCE("bannedAt", now());

CREATE UNIQUE INDEX IF NOT EXISTS "TeacherPhoneBan_id_uidx"
  ON public."TeacherPhoneBan" ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "TeacherPhoneBan_active_hash_idx"
  ON public."TeacherPhoneBan" ("phoneHash")
  WHERE "active" AND "phoneHash" IS NOT NULL;

ALTER TABLE public."AdminLessonRecord"
  ADD COLUMN IF NOT EXISTS "quarantinedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "preQuarantineStatus" text;
ALTER TABLE public."TeacherQuiz"
  ADD COLUMN IF NOT EXISTS "quarantinedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "preQuarantineStatus" text;
ALTER TABLE public."ClassQuiz"
  ADD COLUMN IF NOT EXISTS "quarantinedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "preQuarantineStatus" text;
ALTER TABLE public."Subject"
  ADD COLUMN IF NOT EXISTS "quarantinedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "preQuarantineStatus" text;

CREATE INDEX IF NOT EXISTS "ContentModerationCase_queue_idx"
  ON public."ContentModerationCase" ("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ContentModerationCase_teacher_idx"
  ON public."ContentModerationCase" ("teacherId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ModerationAppeal_queue_idx"
  ON public."ModerationAppeal" ("status", "createdAt" DESC);

ALTER TABLE public."TeacherTrustProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ContentModerationCase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ModerationAppeal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeacherPhoneBan" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teachers read own trust profile" ON public."TeacherTrustProfile";
CREATE POLICY "teachers read own trust profile"
ON public."TeacherTrustProfile" FOR SELECT TO authenticated
USING ("teacherId" = auth.uid() OR public.is_skulkid_admin());

DROP POLICY IF EXISTS "teachers read own moderation cases" ON public."ContentModerationCase";
CREATE POLICY "teachers read own moderation cases"
ON public."ContentModerationCase" FOR SELECT TO authenticated
USING ("teacherId" = auth.uid() OR public.is_skulkid_admin());

DROP POLICY IF EXISTS "teachers read own moderation appeals" ON public."ModerationAppeal";
CREATE POLICY "teachers read own moderation appeals"
ON public."ModerationAppeal" FOR SELECT TO authenticated
USING ("teacherId" = auth.uid() OR public.is_skulkid_admin());

GRANT SELECT ON public."TeacherTrustProfile", public."ContentModerationCase",
  public."ModerationAppeal" TO authenticated;
GRANT ALL ON public."TeacherTrustProfile", public."ContentModerationCase",
  public."ModerationAppeal", public."TeacherPhoneBan" TO service_role;

-- Existing teachers keep publishing continuity. New teacher accounts are
-- subsequently inserted as probation by the trigger below.
INSERT INTO public."TeacherTrustProfile"
  ("teacherId", "status", "cleanLessonCount", "requiredCleanLessons", "monitoringRemaining", "trustedAt")
SELECT id, 'legacy_trusted', 0, 10, 0, now()
FROM auth.users
WHERE raw_app_meta_data ->> 'role' = 'teacher'
ON CONFLICT ("teacherId") DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_teacher_trust_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.raw_app_meta_data ->> 'role', '') = 'teacher' THEN
    INSERT INTO public."TeacherTrustProfile"
      ("teacherId", "status", "cleanLessonCount", "requiredCleanLessons", "monitoringRemaining")
    VALUES (NEW.id, 'probation', 0, 10, 0)
    ON CONFLICT ("teacherId") DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_teacher_trust_profile_trigger ON auth.users;
CREATE TRIGGER create_teacher_trust_profile_trigger
AFTER INSERT OR UPDATE OF raw_app_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_teacher_trust_profile();

-- Learner-facing lesson and quiz mutations must use the service-role routes,
-- ensuring that teacher publishing cannot bypass moderation.
REVOKE INSERT, UPDATE, DELETE ON public."AdminLessonRecord" FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public."TeacherQuiz" FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public."ClassQuiz" FROM authenticated;

COMMIT;

-- Verification report. A successful repair returns no missing columns.
WITH expected("tableName", "columnName") AS (
  VALUES
    ('TeacherTrustProfile', 'teacherId'),
    ('TeacherTrustProfile', 'status'),
    ('TeacherTrustProfile', 'cleanLessonCount'),
    ('TeacherTrustProfile', 'requiredCleanLessons'),
    ('TeacherTrustProfile', 'monitoringRemaining'),
    ('TeacherTrustProfile', 'trustedAt'),
    ('ContentModerationCase', 'contentHash'),
    ('ContentModerationCase', 'snapshot'),
    ('ContentModerationCase', 'mediaWarnings'),
    ('ContentModerationCase', 'responseId'),
    ('ContentModerationCase', 'promptVersion'),
    ('ModerationAppeal', 'authMethod'),
    ('ModerationAppeal', 'resolutionNote'),
    ('TeacherPhoneBan', 'phoneHash'),
    ('TeacherPhoneBan', 'phoneLast4'),
    ('TeacherPhoneBan', 'active'),
    ('AdminLessonRecord', 'quarantinedAt'),
    ('TeacherQuiz', 'quarantinedAt'),
    ('ClassQuiz', 'quarantinedAt'),
    ('Subject', 'quarantinedAt')
),
missing AS (
  SELECT expected.*
  FROM expected
  LEFT JOIN information_schema.columns columns
    ON columns.table_schema = 'public'
   AND columns.table_name = expected."tableName"
   AND columns.column_name = expected."columnName"
  WHERE columns.column_name IS NULL
)
SELECT
  NOT EXISTS (SELECT 1 FROM missing) AS "migrationComplete",
  COALESCE(
    jsonb_agg(jsonb_build_object('table', "tableName", 'column', "columnName"))
      FILTER (WHERE "tableName" IS NOT NULL),
    '[]'::jsonb
  ) AS "missingColumns",
  (SELECT count(*) FROM public."TeacherTrustProfile") AS "teacherTrustProfiles",
  (SELECT count(*) FROM public."ContentModerationCase") AS "moderationCases",
  (SELECT count(*) FROM public."ModerationAppeal" WHERE "status" = 'pending') AS "pendingAppeals",
  (SELECT count(*) FROM public."TeacherPhoneBan" WHERE "active") AS "activePhoneBans"
FROM missing;
