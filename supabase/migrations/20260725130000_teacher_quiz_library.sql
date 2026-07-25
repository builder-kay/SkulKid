CREATE TABLE public."TeacherQuiz" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdBy" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "title" text NOT NULL CHECK (char_length(trim("title")) BETWEEN 2 AND 120),
  "description" text NOT NULL DEFAULT '',
  "subject" text NOT NULL DEFAULT 'general'
    CHECK ("subject" IN ('mathematics', 'english-language', 'science', 'general')),
  "gradeLevels" integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6],
  "questions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "baseXpReward" integer NOT NULL DEFAULT 40 CHECK ("baseXpReward" BETWEEN 0 AND 500),
  "passingScore" integer NOT NULL DEFAULT 70 CHECK ("passingScore" BETWEEN 0 AND 100),
  "maxAttempts" integer NOT NULL DEFAULT 3 CHECK ("maxAttempts" BETWEEN 1 AND 20),
  "version" integer NOT NULL DEFAULT 1 CHECK ("version" > 0),
  "status" text NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'ready', 'archived')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality("gradeLevels") BETWEEN 1 AND 6)
);

CREATE INDEX "TeacherQuiz_creator_status_idx"
ON public."TeacherQuiz" ("createdBy", "status", "updatedAt" DESC);

ALTER TABLE public."ClassQuiz"
  ADD COLUMN "sourceQuizId" uuid REFERENCES public."TeacherQuiz"("id") ON DELETE SET NULL,
  ADD COLUMN "sourceVersion" integer;

CREATE INDEX "ClassQuiz_source_class_idx"
ON public."ClassQuiz" ("sourceQuizId", "classId");

ALTER TABLE public."TeacherQuiz" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers manage own quiz library" ON public."TeacherQuiz"
FOR ALL TO authenticated
USING ("createdBy" = auth.uid() OR public.is_skulkid_admin())
WITH CHECK ("createdBy" = auth.uid() OR public.is_skulkid_admin());
GRANT ALL ON public."TeacherQuiz" TO authenticated, service_role;

CREATE TRIGGER set_teacher_quiz_updated_at
BEFORE UPDATE ON public."TeacherQuiz"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
