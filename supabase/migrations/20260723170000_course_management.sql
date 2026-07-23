-- Connect the normalized curriculum hierarchy to the Supabase-native lesson
-- records used by the current application.

ALTER TABLE public."Subject"
  ADD COLUMN IF NOT EXISTS "coverUrl" text,
  ADD COLUMN IF NOT EXISTS "createdBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public."AdminLessonRecord"
  ADD COLUMN IF NOT EXISTS "courseId" text REFERENCES public."Subject"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "unitId" text REFERENCES public."Unit"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "topicId" text REFERENCES public."Topic"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "AdminLessonRecord_course_status_position_idx"
ON public."AdminLessonRecord" ("courseId", "status", "position");

INSERT INTO public."Subject"
  ("id", "name", "slug", "description", "icon", "colourToken", "gradeLevels", "order", "status", "createdAt", "updatedAt")
VALUES
  ('subject-mathematics', 'Mathematics', 'mathematics', 'Build number confidence through clear examples, practice and feedback.', 'calculator', '#2563EB', ARRAY[1,2,3,4,5,6], 0, 'ACTIVE', now(), now()),
  ('subject-english-language', 'English Language', 'english-language', 'Grow reading, writing and communication confidence.', 'book-open', '#7C3AED', ARRAY[1,2,3,4,5,6], 1, 'ACTIVE', now(), now()),
  ('subject-science', 'Science', 'science', 'Explore living things, materials, energy and everyday discovery.', 'flask-conical', '#16A34A', ARRAY[1,2,3,4,5,6], 2, 'ACTIVE', now(), now())
ON CONFLICT ("id") DO NOTHING;

UPDATE public."AdminLessonRecord"
SET "courseId" = CASE "subject"
  WHEN 'mathematics' THEN 'subject-mathematics'
  WHEN 'english-language' THEN 'subject-english-language'
  WHEN 'science' THEN 'subject-science'
END
WHERE "courseId" IS NULL;

DROP POLICY IF EXISTS "published subjects are readable" ON public."Subject";
CREATE POLICY "published nonempty subjects are readable" ON public."Subject"
FOR SELECT TO anon, authenticated
USING (
  "status" = 'ACTIVE'
  AND EXISTS (
    SELECT 1
    FROM public."AdminLessonRecord" lesson
    WHERE lesson."courseId" = "Subject"."id"
      AND lesson."status" = 'published'
  )
);

DROP POLICY IF EXISTS "published units are readable" ON public."Unit";
CREATE POLICY "published units are readable" ON public."Unit"
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Subject" subject
    WHERE subject."id" = "Unit"."subjectId"
      AND subject."status" = 'ACTIVE'
      AND EXISTS (
        SELECT 1 FROM public."AdminLessonRecord" lesson
        WHERE lesson."courseId" = subject."id"
          AND lesson."status" = 'published'
      )
  )
);

DROP POLICY IF EXISTS "published topics are readable" ON public."Topic";
CREATE POLICY "published topics are readable" ON public."Topic"
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public."Unit" unit
    JOIN public."Subject" subject ON subject."id" = unit."subjectId"
    WHERE unit."id" = "Topic"."unitId"
      AND subject."status" = 'ACTIVE'
      AND EXISTS (
        SELECT 1 FROM public."AdminLessonRecord" lesson
        WHERE lesson."courseId" = subject."id"
          AND lesson."status" = 'published'
      )
  )
);
