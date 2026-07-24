-- Teacher classrooms: joinable classes, course assignments, quizzes, advice.

CREATE TABLE public."TeacherClass" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacherId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "joinCode" text NOT NULL UNIQUE,
  "gradeLevel" integer NOT NULL CHECK ("gradeLevel" BETWEEN 1 AND 6),
  "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'archived')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "TeacherClass_teacherId_idx" ON public."TeacherClass" ("teacherId");
CREATE INDEX "TeacherClass_joinCode_idx" ON public."TeacherClass" ("joinCode");

CREATE TABLE public."ClassMembership" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'left')),
  "joinedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("classId", "studentId")
);

CREATE INDEX "ClassMembership_studentId_idx" ON public."ClassMembership" ("studentId");
CREATE INDEX "ClassMembership_classId_status_idx" ON public."ClassMembership" ("classId", "status");

CREATE TABLE public."ClassCourseAssignment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "courseId" text NOT NULL REFERENCES public."Subject"("id") ON DELETE CASCADE,
  "note" text NOT NULL DEFAULT '',
  "assignedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("classId", "courseId")
);

CREATE INDEX "ClassCourseAssignment_classId_idx" ON public."ClassCourseAssignment" ("classId");

CREATE TABLE public."ClassQuiz" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "createdBy" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "questions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "deadline" timestamptz,
  "baseXpReward" integer NOT NULL DEFAULT 40 CHECK ("baseXpReward" BETWEEN 0 AND 500),
  "passingScore" integer NOT NULL DEFAULT 70 CHECK ("passingScore" BETWEEN 0 AND 100),
  "status" text NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'published', 'closed')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "ClassQuiz_classId_status_idx" ON public."ClassQuiz" ("classId", "status");

CREATE TABLE public."ClassQuizAttempt" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "quizId" uuid NOT NULL REFERENCES public."ClassQuiz"("id") ON DELETE CASCADE,
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "answers" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "scorePercentage" integer NOT NULL CHECK ("scorePercentage" BETWEEN 0 AND 100),
  "starsAwarded" integer NOT NULL DEFAULT 0 CHECK ("starsAwarded" BETWEEN 0 AND 3),
  "xpAwarded" integer NOT NULL DEFAULT 0,
  "passed" boolean NOT NULL DEFAULT false,
  "submittedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("quizId", "studentId")
);

CREATE INDEX "ClassQuizAttempt_studentId_idx" ON public."ClassQuizAttempt" ("studentId");

CREATE TABLE public."ClassAdvice" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "teacherId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "message" text NOT NULL,
  "suggestionType" text NOT NULL DEFAULT 'general'
    CHECK ("suggestionType" IN ('class_adventure', 'platform_adventure', 'general')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "readAt" timestamptz
);

CREATE INDEX "ClassAdvice_studentId_idx" ON public."ClassAdvice" ("studentId", "createdAt" DESC);
CREATE INDEX "ClassAdvice_classId_idx" ON public."ClassAdvice" ("classId");

CREATE TRIGGER set_teacher_class_updated_at
BEFORE UPDATE ON public."TeacherClass"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_class_quiz_updated_at
BEFORE UPDATE ON public."ClassQuiz"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public."TeacherClass" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassCourseAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassQuiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassQuizAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassAdvice" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers manage own classes"
ON public."TeacherClass" FOR ALL TO authenticated
USING (public.is_skulkid_staff() AND ("teacherId" = auth.uid() OR public.is_skulkid_admin()))
WITH CHECK (public.is_skulkid_staff() AND "teacherId" = auth.uid());

CREATE POLICY "members and teachers read classes"
ON public."TeacherClass" FOR SELECT TO authenticated
USING (
  "teacherId" = auth.uid()
  OR public.is_skulkid_admin()
  OR EXISTS (
    SELECT 1 FROM public."ClassMembership" membership
    WHERE membership."classId" = "TeacherClass"."id"
      AND membership."studentId" = auth.uid()
      AND membership."status" = 'active'
  )
);

CREATE POLICY "students join classes"
ON public."ClassMembership" FOR INSERT TO authenticated
WITH CHECK ("studentId" = auth.uid());

CREATE POLICY "students read own memberships"
ON public."ClassMembership" FOR SELECT TO authenticated
USING (
  "studentId" = auth.uid()
  OR public.is_skulkid_admin()
  OR EXISTS (
    SELECT 1 FROM public."TeacherClass" classroom
    WHERE classroom."id" = "ClassMembership"."classId"
      AND classroom."teacherId" = auth.uid()
  )
);

CREATE POLICY "teachers manage memberships in own classes"
ON public."ClassMembership" FOR UPDATE TO authenticated
USING (
  public.is_skulkid_staff()
  AND EXISTS (
    SELECT 1 FROM public."TeacherClass" classroom
    WHERE classroom."id" = "ClassMembership"."classId"
      AND (classroom."teacherId" = auth.uid() OR public.is_skulkid_admin())
  )
);

CREATE POLICY "staff manage class course assignments"
ON public."ClassCourseAssignment" FOR ALL TO authenticated
USING (
  public.is_skulkid_staff()
  AND EXISTS (
    SELECT 1 FROM public."TeacherClass" classroom
    WHERE classroom."id" = "ClassCourseAssignment"."classId"
      AND (classroom."teacherId" = auth.uid() OR public.is_skulkid_admin())
  )
)
WITH CHECK (
  public.is_skulkid_staff()
  AND EXISTS (
    SELECT 1 FROM public."TeacherClass" classroom
    WHERE classroom."id" = "ClassCourseAssignment"."classId"
      AND classroom."teacherId" = auth.uid()
  )
);

CREATE POLICY "class members read course assignments"
ON public."ClassCourseAssignment" FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."ClassMembership" membership
    WHERE membership."classId" = "ClassCourseAssignment"."classId"
      AND membership."studentId" = auth.uid()
      AND membership."status" = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM public."TeacherClass" classroom
    WHERE classroom."id" = "ClassCourseAssignment"."classId"
      AND classroom."teacherId" = auth.uid()
  )
  OR public.is_skulkid_admin()
);

CREATE POLICY "teachers manage class quizzes"
ON public."ClassQuiz" FOR ALL TO authenticated
USING (
  public.is_skulkid_staff()
  AND EXISTS (
    SELECT 1 FROM public."TeacherClass" classroom
    WHERE classroom."id" = "ClassQuiz"."classId"
      AND (classroom."teacherId" = auth.uid() OR public.is_skulkid_admin())
  )
)
WITH CHECK (
  public.is_skulkid_staff()
  AND "createdBy" = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public."TeacherClass" classroom
    WHERE classroom."id" = "ClassQuiz"."classId"
      AND classroom."teacherId" = auth.uid()
  )
);

CREATE POLICY "members read published quizzes"
ON public."ClassQuiz" FOR SELECT TO authenticated
USING (
  (
    "status" IN ('published', 'closed')
    AND EXISTS (
      SELECT 1 FROM public."ClassMembership" membership
      WHERE membership."classId" = "ClassQuiz"."classId"
        AND membership."studentId" = auth.uid()
        AND membership."status" = 'active'
    )
  )
  OR EXISTS (
    SELECT 1 FROM public."TeacherClass" classroom
    WHERE classroom."id" = "ClassQuiz"."classId"
      AND classroom."teacherId" = auth.uid()
  )
  OR public.is_skulkid_admin()
);

CREATE POLICY "students manage own quiz attempts"
ON public."ClassQuizAttempt" FOR SELECT TO authenticated
USING (
  "studentId" = auth.uid()
  OR public.is_skulkid_admin()
  OR EXISTS (
    SELECT 1
    FROM public."ClassQuiz" quiz
    JOIN public."TeacherClass" classroom ON classroom."id" = quiz."classId"
    WHERE quiz."id" = "ClassQuizAttempt"."quizId"
      AND classroom."teacherId" = auth.uid()
  )
);

CREATE POLICY "students submit quiz attempts"
ON public."ClassQuizAttempt" FOR INSERT TO authenticated
WITH CHECK ("studentId" = auth.uid());

CREATE POLICY "teachers create advice"
ON public."ClassAdvice" FOR INSERT TO authenticated
WITH CHECK (
  public.is_skulkid_staff()
  AND "teacherId" = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public."TeacherClass" classroom
    WHERE classroom."id" = "ClassAdvice"."classId"
      AND classroom."teacherId" = auth.uid()
  )
);

CREATE POLICY "advice readable by teacher or student"
ON public."ClassAdvice" FOR SELECT TO authenticated
USING (
  "studentId" = auth.uid()
  OR "teacherId" = auth.uid()
  OR public.is_skulkid_admin()
);

CREATE POLICY "students mark advice read"
ON public."ClassAdvice" FOR UPDATE TO authenticated
USING ("studentId" = auth.uid())
WITH CHECK ("studentId" = auth.uid());

GRANT ALL ON
  public."TeacherClass",
  public."ClassMembership",
  public."ClassCourseAssignment",
  public."ClassQuiz",
  public."ClassQuizAttempt",
  public."ClassAdvice"
TO authenticated, service_role;
