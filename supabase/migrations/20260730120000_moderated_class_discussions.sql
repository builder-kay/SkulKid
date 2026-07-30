-- Moderated, class-based communication for child-safe shared discussion rooms.

ALTER TABLE public."ClassMessage"
  ADD COLUMN IF NOT EXISTS "scope" text NOT NULL DEFAULT 'legacy_direct'
    CHECK ("scope" IN ('legacy_direct', 'class_room', 'study_group')),
  ADD COLUMN IF NOT EXISTS "kind" text NOT NULL DEFAULT 'discussion'
    CHECK ("kind" IN ('discussion', 'announcement')),
  ADD COLUMN IF NOT EXISTS "senderRole" text NOT NULL DEFAULT 'student'
    CHECK ("senderRole" IN ('student', 'teacher', 'admin')),
  ADD COLUMN IF NOT EXISTS "moderationStatus" text NOT NULL DEFAULT 'allowed'
    CHECK ("moderationStatus" IN ('allowed', 'flagged', 'blocked')),
  ADD COLUMN IF NOT EXISTS "moderationCategories" text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "moderationReason" text,
  ADD COLUMN IF NOT EXISTS "editedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "deletedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "replyToId" uuid REFERENCES public."ClassMessage"("id") ON DELETE SET NULL;

ALTER TABLE public."ClassMessage" ALTER COLUMN "studentId" DROP NOT NULL;
ALTER TABLE public."ClassMessage" ALTER COLUMN "scope" SET DEFAULT 'class_room';

CREATE INDEX IF NOT EXISTS "ClassMessage_room_timeline_idx"
ON public."ClassMessage" ("classId", "scope", "createdAt")
WHERE "deletedAt" IS NULL;

CREATE TABLE IF NOT EXISTS public."ClassChatSetting" (
  "classId" uuid PRIMARY KEY REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "teacherId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "enabled" boolean NOT NULL DEFAULT true,
  "locked" boolean NOT NULL DEFAULT false,
  "postingStartsAt" time,
  "postingEndsAt" time,
  "timezone" text NOT NULL DEFAULT 'Africa/Accra',
  "guardianConsentRequired" boolean NOT NULL DEFAULT true,
  "rulesVersion" text NOT NULL DEFAULT 'class-chat-v1',
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."ClassChatConsent" (
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "guardianConfirmedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "guardianConfirmedAt" timestamptz,
  "rulesVersion" text NOT NULL DEFAULT 'class-chat-v1',
  "rulesAcceptedAt" timestamptz,
  "active" boolean NOT NULL DEFAULT false,
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("classId", "studentId")
);

CREATE TABLE IF NOT EXISTS public."ClassMessageReport" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "messageId" uuid NOT NULL REFERENCES public."ClassMessage"("id") ON DELETE CASCADE,
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "reportedBy" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "reason" text NOT NULL CHECK ("reason" IN ('bullying','threat','sexual_content','personal_information','spam','other')),
  "details" text NOT NULL DEFAULT '',
  "status" text NOT NULL DEFAULT 'open' CHECK ("status" IN ('open','reviewing','resolved','dismissed')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "resolvedAt" timestamptz,
  "resolvedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "resolutionNote" text,
  UNIQUE ("messageId", "reportedBy")
);

CREATE TABLE IF NOT EXISTS public."ClassChatMute" (
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "mutedStudentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("classId", "studentId", "mutedStudentId"),
  CHECK ("studentId" <> "mutedStudentId")
);

CREATE TABLE IF NOT EXISTS public."ClassMessageAudit" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "messageId" uuid REFERENCES public."ClassMessage"("id") ON DELETE SET NULL,
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "actorId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "action" text NOT NULL CHECK ("action" IN ('created','edited','deleted','blocked','reported','restored')),
  "bodySnapshot" text,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."ChildSafetyCase" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid REFERENCES public."TeacherClass"("id") ON DELETE SET NULL,
  "messageId" uuid REFERENCES public."ClassMessage"("id") ON DELETE SET NULL,
  "studentId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "source" text NOT NULL CHECK ("source" IN ('automatic','student_report','teacher_escalation')),
  "categories" text[] NOT NULL DEFAULT '{}',
  "severity" text NOT NULL CHECK ("severity" IN ('low','medium','high','critical')),
  "summary" text NOT NULL,
  "status" text NOT NULL DEFAULT 'open' CHECK ("status" IN ('open','reviewing','resolved','dismissed')),
  "ownerId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "acknowledgedAt" timestamptz,
  "resolvedAt" timestamptz,
  "resolutionNote" text
);

CREATE TABLE IF NOT EXISTS public."ClassMessageReaction" (
  "messageId" uuid NOT NULL REFERENCES public."ClassMessage"("id") ON DELETE CASCADE,
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "reaction" text NOT NULL CHECK ("reaction" IN ('like','helpful','celebrate')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("messageId", "studentId")
);

CREATE TABLE IF NOT EXISTS public."ClassStudyGroup" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "teacherId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "name" text NOT NULL CHECK (char_length(trim("name")) BETWEEN 2 AND 80),
  "active" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."ClassStudyGroupMember" (
  "groupId" uuid NOT NULL REFERENCES public."ClassStudyGroup"("id") ON DELETE CASCADE,
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY ("groupId", "studentId")
);

INSERT INTO public."ClassChatSetting" ("classId","teacherId")
SELECT "id","teacherId" FROM public."TeacherClass"
ON CONFLICT ("classId") DO NOTHING;

ALTER TABLE public."ClassChatSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassChatConsent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassMessageReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassChatMute" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassMessageAudit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChildSafetyCase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassMessageReaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassStudyGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassStudyGroupMember" ENABLE ROW LEVEL SECURITY;

-- Reads are deliberately narrow; all writes go through validated server routes.
DROP POLICY IF EXISTS "class participants read chat settings" ON public."ClassChatSetting";
CREATE POLICY "class participants read chat settings" ON public."ClassChatSetting"
FOR SELECT TO authenticated USING (
  "teacherId" = auth.uid() OR public.is_skulkid_admin() OR EXISTS (
    SELECT 1 FROM public."ClassMembership" m
    WHERE m."classId" = "ClassChatSetting"."classId" AND m."studentId" = auth.uid() AND m.status = 'active'
  )
);
DROP POLICY IF EXISTS "students read own chat consent" ON public."ClassChatConsent";
CREATE POLICY "students read own chat consent" ON public."ClassChatConsent"
FOR SELECT TO authenticated USING ("studentId" = auth.uid() OR public.is_skulkid_admin());
DROP POLICY IF EXISTS "students read own reports" ON public."ClassMessageReport";
CREATE POLICY "students read own reports" ON public."ClassMessageReport"
FOR SELECT TO authenticated USING ("reportedBy" = auth.uid() OR public.is_skulkid_admin());
DROP POLICY IF EXISTS "students read own mutes" ON public."ClassChatMute";
CREATE POLICY "students read own mutes" ON public."ClassChatMute"
FOR SELECT TO authenticated USING ("studentId" = auth.uid() OR public.is_skulkid_admin());
DROP POLICY IF EXISTS "admins read message audits" ON public."ClassMessageAudit";
CREATE POLICY "admins read message audits" ON public."ClassMessageAudit"
FOR SELECT TO authenticated USING (public.is_skulkid_admin());
DROP POLICY IF EXISTS "admins read safety cases" ON public."ChildSafetyCase";
CREATE POLICY "admins read safety cases" ON public."ChildSafetyCase"
FOR SELECT TO authenticated USING (public.is_skulkid_admin());

GRANT SELECT ON public."ClassChatSetting", public."ClassChatConsent", public."ClassMessageReport",
  public."ClassChatMute", public."ClassMessageAudit", public."ChildSafetyCase",
  public."ClassMessageReaction", public."ClassStudyGroup", public."ClassStudyGroupMember"
TO authenticated;
GRANT ALL ON public."ClassChatSetting", public."ClassChatConsent", public."ClassMessageReport",
  public."ClassChatMute", public."ClassMessageAudit", public."ChildSafetyCase",
  public."ClassMessageReaction", public."ClassStudyGroup", public."ClassStudyGroupMember"
TO service_role;
