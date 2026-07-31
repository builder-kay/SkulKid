-- Multi-teacher classrooms: one accountable class teacher plus subject-scoped
-- teachers who explicitly accept an invitation.

CREATE TABLE IF NOT EXISTS public."ClassTeacherAssignment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "teacherId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "role" text NOT NULL CHECK ("role" IN ('class_teacher','subject_teacher')),
  "status" text NOT NULL DEFAULT 'pending'
    CHECK ("status" IN ('pending','active','declined','revoked')),
  "invitedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "invitedAt" timestamptz NOT NULL DEFAULT now(),
  "respondedAt" timestamptz,
  "revokedAt" timestamptz,
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("classId", "teacherId")
);

CREATE TABLE IF NOT EXISTS public."ClassTeacherSubject" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "assignmentId" uuid NOT NULL REFERENCES public."ClassTeacherAssignment"("id") ON DELETE CASCADE,
  "courseId" text NOT NULL REFERENCES public."Subject"("id") ON DELETE CASCADE,
  "assignedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("assignmentId", "courseId")
);

CREATE TABLE IF NOT EXISTS public."ClassTeacherAudit" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "assignmentId" uuid REFERENCES public."ClassTeacherAssignment"("id") ON DELETE SET NULL,
  "actorId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "action" text NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ClassTeacherAssignment_teacher_status_idx"
ON public."ClassTeacherAssignment" ("teacherId", "status", "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "ClassTeacherAssignment_class_status_idx"
ON public."ClassTeacherAssignment" ("classId", "status");
CREATE INDEX IF NOT EXISTS "ClassTeacherSubject_course_idx"
ON public."ClassTeacherSubject" ("courseId", "assignmentId");
CREATE INDEX IF NOT EXISTS "ClassTeacherAudit_class_created_idx"
ON public."ClassTeacherAudit" ("classId", "createdAt" DESC);

INSERT INTO public."ClassTeacherAssignment"
  ("classId","teacherId","role","status","invitedBy","respondedAt")
SELECT "id","teacherId",'class_teacher','active',"teacherId",COALESCE("createdAt",now())
FROM public."TeacherClass"
ON CONFLICT ("classId","teacherId") DO UPDATE
SET "role"='class_teacher',"status"='active',"revokedAt"=NULL,"updatedAt"=now();

CREATE OR REPLACE FUNCTION public.sync_canonical_class_teacher_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
BEGIN
  IF TG_OP='UPDATE' AND OLD."teacherId" IS DISTINCT FROM NEW."teacherId" THEN
    UPDATE public."ClassTeacherAssignment"
    SET "status"='revoked',"revokedAt"=now(),"updatedAt"=now()
    WHERE "classId"=NEW."id" AND "teacherId"=OLD."teacherId" AND "role"='class_teacher';
  END IF;
  INSERT INTO public."ClassTeacherAssignment"
    ("classId","teacherId","role","status","invitedBy","respondedAt")
  VALUES (NEW."id",NEW."teacherId",'class_teacher','active',NEW."teacherId",now())
  ON CONFLICT ("classId","teacherId") DO UPDATE
  SET "role"='class_teacher',"status"='active',"revokedAt"=NULL,"updatedAt"=now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "TeacherClass_sync_canonical_teacher" ON public."TeacherClass";
CREATE TRIGGER "TeacherClass_sync_canonical_teacher"
AFTER INSERT OR UPDATE OF "teacherId" ON public."TeacherClass"
FOR EACH ROW EXECUTE FUNCTION public.sync_canonical_class_teacher_assignment();

ALTER TABLE public."Unit"
  ADD COLUMN IF NOT EXISTS "createdBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."Topic"
  ADD COLUMN IF NOT EXISTS "createdBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."ClassQuiz"
  ADD COLUMN IF NOT EXISTS "courseId" text REFERENCES public."Subject"("id") ON DELETE SET NULL;
ALTER TABLE public."ClassAdvice"
  ADD COLUMN IF NOT EXISTS "courseId" text REFERENCES public."Subject"("id") ON DELETE SET NULL;
ALTER TABLE public."ClassMessage"
  ADD COLUMN IF NOT EXISTS "courseId" text REFERENCES public."Subject"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "ClassQuiz_class_course_status_idx"
ON public."ClassQuiz" ("classId","courseId","status");
CREATE INDEX IF NOT EXISTS "ClassAdvice_class_course_student_idx"
ON public."ClassAdvice" ("classId","courseId","studentId","createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ClassMessage_class_course_created_idx"
ON public."ClassMessage" ("classId","courseId","createdAt" DESC);

CREATE OR REPLACE FUNCTION public.is_active_class_teacher(p_class_id uuid, p_teacher_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."TeacherClass" c
    WHERE c."id"=p_class_id AND c."teacherId"=p_teacher_id AND c."status"='active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_class_staff(p_class_id uuid, p_teacher_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$
  SELECT public.is_active_class_teacher(p_class_id,p_teacher_id) OR EXISTS (
    SELECT 1 FROM public."ClassTeacherAssignment" a
    WHERE a."classId"=p_class_id AND a."teacherId"=p_teacher_id AND a."status"='active'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_teach_class_subject(
  p_class_id uuid, p_course_id text, p_teacher_id uuid DEFAULT auth.uid()
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$
  SELECT public.is_active_class_teacher(p_class_id,p_teacher_id) OR EXISTS (
    SELECT 1
    FROM public."ClassTeacherAssignment" a
    JOIN public."ClassTeacherSubject" s ON s."assignmentId"=a."id"
    WHERE a."classId"=p_class_id AND a."teacherId"=p_teacher_id
      AND a."status"='active' AND s."courseId"=p_course_id
  );
$$;

ALTER TABLE public."ClassTeacherAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassTeacherSubject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassTeacherAudit" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class staff read assignments" ON public."ClassTeacherAssignment";
CREATE POLICY "class staff read assignments" ON public."ClassTeacherAssignment"
FOR SELECT TO authenticated USING (
  public.is_skulkid_admin() OR "teacherId"=auth.uid()
  OR public.is_active_class_teacher("classId",auth.uid())
);
DROP POLICY IF EXISTS "class teachers manage assignments" ON public."ClassTeacherAssignment";
CREATE POLICY "class teachers manage assignments" ON public."ClassTeacherAssignment"
FOR ALL TO authenticated USING (
  public.is_skulkid_admin() OR public.is_active_class_teacher("classId",auth.uid())
) WITH CHECK (
  public.is_skulkid_admin() OR public.is_active_class_teacher("classId",auth.uid())
);

DROP POLICY IF EXISTS "class staff read subject scopes" ON public."ClassTeacherSubject";
CREATE POLICY "class staff read subject scopes" ON public."ClassTeacherSubject"
FOR SELECT TO authenticated USING (
  public.is_skulkid_admin() OR EXISTS (
    SELECT 1 FROM public."ClassTeacherAssignment" a
    WHERE a."id"="ClassTeacherSubject"."assignmentId"
      AND (a."teacherId"=auth.uid() OR public.is_active_class_teacher(a."classId",auth.uid()))
  )
);
DROP POLICY IF EXISTS "class teachers manage subject scopes" ON public."ClassTeacherSubject";
CREATE POLICY "class teachers manage subject scopes" ON public."ClassTeacherSubject"
FOR ALL TO authenticated USING (
  public.is_skulkid_admin() OR EXISTS (
    SELECT 1 FROM public."ClassTeacherAssignment" a
    WHERE a."id"="ClassTeacherSubject"."assignmentId"
      AND public.is_active_class_teacher(a."classId",auth.uid())
  )
) WITH CHECK (
  public.is_skulkid_admin() OR EXISTS (
    SELECT 1 FROM public."ClassTeacherAssignment" a
    WHERE a."id"="ClassTeacherSubject"."assignmentId"
      AND public.is_active_class_teacher(a."classId",auth.uid())
  )
);

DROP POLICY IF EXISTS "class teachers read staffing audit" ON public."ClassTeacherAudit";
CREATE POLICY "class teachers read staffing audit" ON public."ClassTeacherAudit"
FOR SELECT TO authenticated USING (
  public.is_skulkid_admin() OR public.is_active_class_teacher("classId",auth.uid())
);

-- Extend existing participant reads to active subject teachers.
DROP POLICY IF EXISTS "class room participants receive messages" ON public."ClassMessage";
CREATE POLICY "class room participants receive messages"
ON public."ClassMessage" FOR SELECT TO authenticated
USING (
  "scope"='class_room' AND (
    public.is_skulkid_admin()
    OR public.is_active_class_staff("classId",auth.uid())
    OR (
      "moderationStatus"='allowed' AND "deletedAt" IS NULL
      AND EXISTS (
        SELECT 1 FROM public."ClassMembership" m
        WHERE m."classId"="ClassMessage"."classId"
          AND m."studentId"=auth.uid() AND m."status"='active'
      )
    )
  )
);

-- Direct database access follows the same staffing boundaries as the server.
DROP POLICY IF EXISTS "active staff read assigned classes" ON public."TeacherClass";
CREATE POLICY "active staff read assigned classes"
ON public."TeacherClass" FOR SELECT TO authenticated
USING (public.is_active_class_staff("id",auth.uid()));

DROP POLICY IF EXISTS "active staff read class roster" ON public."ClassMembership";
CREATE POLICY "active staff read class roster"
ON public."ClassMembership" FOR SELECT TO authenticated
USING (public.is_active_class_staff("classId",auth.uid()));

DROP POLICY IF EXISTS "active staff read class subjects" ON public."ClassCourseAssignment";
CREATE POLICY "active staff read class subjects"
ON public."ClassCourseAssignment" FOR SELECT TO authenticated
USING (
  public.is_active_class_teacher("classId",auth.uid())
  OR public.can_teach_class_subject("classId","courseId",auth.uid())
);

DROP POLICY IF EXISTS "active staff read scoped quizzes" ON public."ClassQuiz";
CREATE POLICY "active staff read scoped quizzes"
ON public."ClassQuiz" FOR SELECT TO authenticated
USING (
  public.is_active_class_teacher("classId",auth.uid())
  OR ("courseId" IS NOT NULL AND public.can_teach_class_subject("classId","courseId",auth.uid()))
);

DROP POLICY IF EXISTS "teachers create scoped quizzes" ON public."ClassQuiz";
CREATE POLICY "teachers create scoped quizzes"
ON public."ClassQuiz" FOR INSERT TO authenticated
WITH CHECK (
  "createdBy"=auth.uid()
  AND (
    public.is_active_class_teacher("classId",auth.uid())
    OR ("courseId" IS NOT NULL AND public.can_teach_class_subject("classId","courseId",auth.uid()))
  )
);

DROP POLICY IF EXISTS "teachers manage their scoped quizzes" ON public."ClassQuiz";
CREATE POLICY "teachers manage their scoped quizzes"
ON public."ClassQuiz" FOR UPDATE TO authenticated
USING (
  "createdBy"=auth.uid()
  AND (
    public.is_active_class_teacher("classId",auth.uid())
    OR ("courseId" IS NOT NULL AND public.can_teach_class_subject("classId","courseId",auth.uid()))
  )
) WITH CHECK (
  "createdBy"=auth.uid()
  AND (
    public.is_active_class_teacher("classId",auth.uid())
    OR ("courseId" IS NOT NULL AND public.can_teach_class_subject("classId","courseId",auth.uid()))
  )
);

DROP POLICY IF EXISTS "teachers delete their scoped quizzes" ON public."ClassQuiz";
CREATE POLICY "teachers delete their scoped quizzes"
ON public."ClassQuiz" FOR DELETE TO authenticated
USING (
  "createdBy"=auth.uid()
  AND (
    public.is_active_class_teacher("classId",auth.uid())
    OR ("courseId" IS NOT NULL AND public.can_teach_class_subject("classId","courseId",auth.uid()))
  )
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public."ClassTeacherAssignment",
  public."ClassTeacherSubject",public."ClassTeacherAudit" TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.is_active_class_teacher(uuid,uuid) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.is_active_class_staff(uuid,uuid) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.can_teach_class_subject(uuid,text,uuid) TO authenticated,service_role;

ALTER TABLE public."ClassTeacherAssignment" REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public'
      AND tablename='ClassTeacherAssignment'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."ClassTeacherAssignment";
  END IF;
END $$;
