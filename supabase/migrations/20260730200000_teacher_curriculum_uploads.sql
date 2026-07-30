CREATE TABLE IF NOT EXISTS public."TeacherCurriculumUpload" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacherId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "title" text NOT NULL CHECK (char_length("title") BETWEEN 2 AND 160),
  "subject" text NOT NULL CHECK (char_length("subject") BETWEEN 2 AND 100),
  "gradeLevels" text[] NOT NULL DEFAULT '{}',
  "authority" text NOT NULL DEFAULT '',
  "sourceUrl" text,
  "publishedYear" integer CHECK ("publishedYear" IS NULL OR "publishedYear" BETWEEN 1900 AND 2100),
  "storagePath" text NOT NULL,
  "fileName" text NOT NULL,
  "mimeType" text NOT NULL,
  "fileSize" bigint NOT NULL CHECK ("fileSize" BETWEEN 1 AND 15728640),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "TeacherCurriculumUpload_teacher_idx" ON public."TeacherCurriculumUpload" ("teacherId","createdAt" DESC);
ALTER TABLE public."TeacherCurriculumUpload" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."TeacherCurriculumUpload" TO service_role;
