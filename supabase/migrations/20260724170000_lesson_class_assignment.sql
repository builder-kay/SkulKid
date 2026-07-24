-- Optional explicit classroom placement for teacher-created lessons.
ALTER TABLE public."AdminLessonRecord"
  ADD COLUMN IF NOT EXISTS "classId" uuid REFERENCES public."TeacherClass"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "AdminLessonRecord_class_course_module_idx"
ON public."AdminLessonRecord" ("classId", "courseId", "unitId", "position");

COMMENT ON COLUMN public."AdminLessonRecord"."classId"
IS 'When set, this lesson was authored for this teacher class rather than the general platform catalogue.';
