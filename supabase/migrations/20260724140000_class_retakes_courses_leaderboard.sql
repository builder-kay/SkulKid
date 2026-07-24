-- Quiz retakes, class-only courses, and leaderboard-friendly attempt history.

ALTER TABLE public."ClassQuiz"
  ADD COLUMN IF NOT EXISTS "maxAttempts" integer NOT NULL DEFAULT 3
    CHECK ("maxAttempts" BETWEEN 1 AND 20);

ALTER TABLE public."ClassQuizAttempt"
  ADD COLUMN IF NOT EXISTS "attemptNumber" integer NOT NULL DEFAULT 1
    CHECK ("attemptNumber" BETWEEN 1 AND 20);

ALTER TABLE public."ClassQuizAttempt"
  DROP CONSTRAINT IF EXISTS "ClassQuizAttempt_quizId_studentId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "ClassQuizAttempt_quiz_student_attempt_uidx"
ON public."ClassQuizAttempt" ("quizId", "studentId", "attemptNumber");

CREATE INDEX IF NOT EXISTS "ClassQuizAttempt_quiz_student_submitted_idx"
ON public."ClassQuizAttempt" ("quizId", "studentId", "submittedAt" DESC);

ALTER TABLE public."Subject"
  ADD COLUMN IF NOT EXISTS "visibility" text NOT NULL DEFAULT 'platform'
    CHECK ("visibility" IN ('platform', 'class')),
  ADD COLUMN IF NOT EXISTS "ownerClassId" uuid REFERENCES public."TeacherClass"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "Subject_visibility_ownerClass_idx"
ON public."Subject" ("visibility", "ownerClassId");

-- Platform catalog stays public; class-only courses are member/teacher scoped.
DROP POLICY IF EXISTS "published nonempty subjects are readable" ON public."Subject";
CREATE POLICY "published platform subjects are readable" ON public."Subject"
FOR SELECT TO anon, authenticated
USING (
  "status" = 'ACTIVE'
  AND "visibility" = 'platform'
  AND EXISTS (
    SELECT 1
    FROM public."AdminLessonRecord" lesson
    WHERE lesson."courseId" = "Subject"."id"
      AND lesson."status" = 'published'
  )
);

CREATE POLICY "class members read class-only subjects" ON public."Subject"
FOR SELECT TO authenticated
USING (
  "status" = 'ACTIVE'
  AND "visibility" = 'class'
  AND "ownerClassId" IS NOT NULL
  AND (
    public.is_skulkid_staff()
    OR EXISTS (
      SELECT 1
      FROM public."TeacherClass" classroom
      WHERE classroom."id" = "Subject"."ownerClassId"
        AND classroom."teacherId" = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public."ClassMembership" membership
      WHERE membership."classId" = "Subject"."ownerClassId"
        AND membership."studentId" = auth.uid()
        AND membership."status" = 'active'
    )
  )
);

COMMENT ON COLUMN public."ClassQuiz"."maxAttempts" IS 'Maximum quiz attempts per student (includes the first try).';
COMMENT ON COLUMN public."Subject"."visibility" IS 'platform = global catalog; class = only that classroom.';
