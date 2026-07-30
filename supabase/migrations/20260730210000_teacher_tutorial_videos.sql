CREATE TABLE IF NOT EXISTS public."TeacherTutorialVideo" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL CHECK (char_length("title") BETWEEN 3 AND 160),
  "description" text NOT NULL DEFAULT '',
  "category" text NOT NULL CHECK ("category" IN ('getting_started','classes','subjects_lessons','quizzes','messages_safety','progress_support')),
  "storagePath" text NOT NULL UNIQUE,
  "fileName" text NOT NULL,
  "mimeType" text NOT NULL CHECK ("mimeType" IN ('video/mp4','video/webm')),
  "fileSize" bigint NOT NULL CHECK ("fileSize" BETWEEN 1 AND 524288000),
  "durationMinutes" integer CHECK ("durationMinutes" IS NULL OR "durationMinutes" BETWEEN 1 AND 240),
  "status" text NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft','published')),
  "position" integer NOT NULL DEFAULT 0,
  "createdBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "TeacherTutorialVideo_status_position_idx" ON public."TeacherTutorialVideo" ("status","position","createdAt");
ALTER TABLE public."TeacherTutorialVideo" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public."TeacherTutorialVideo" TO service_role;
