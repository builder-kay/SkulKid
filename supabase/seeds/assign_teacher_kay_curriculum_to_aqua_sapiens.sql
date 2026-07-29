-- Assign Teacher Kay's seeded Basic 6 curriculum to Aqua Sapiens Class.
-- Safe to run repeatedly: ClassCourseAssignment has a unique class/course pair.

DO $assign$
DECLARE
  target_class_id uuid;
  target_teacher_id uuid;
  matching_class_count integer;
  matching_course_count integer;
BEGIN
  SELECT count(*)
  INTO matching_class_count
  FROM public."TeacherClass"
  WHERE lower(btrim("name")) = 'aqua sapiens class'
    AND "status" = 'active';

  IF matching_class_count = 0 THEN
    RAISE EXCEPTION 'No active class named "Aqua Sapiens Class" was found.';
  ELSIF matching_class_count > 1 THEN
    RAISE EXCEPTION 'More than one active class named "Aqua Sapiens Class" was found. Rename one class or assign using its UUID.';
  END IF;

  SELECT "id", "teacherId"
  INTO target_class_id, target_teacher_id
  FROM public."TeacherClass"
  WHERE lower(btrim("name")) = 'aqua sapiens class'
    AND "status" = 'active'
  LIMIT 1;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE "id" = target_teacher_id
      AND lower(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
  ) THEN
    RAISE EXCEPTION '"Aqua Sapiens Class" is not owned by Teacher Kay. No courses were assigned.';
  END IF;

  SELECT count(*)
  INTO matching_course_count
  FROM public."Subject"
  WHERE "createdBy" = target_teacher_id
    AND "status" = 'ACTIVE'
    AND 6 = ANY("gradeLevels")
    AND "slug" IN (
      'teacher-kay-b6-mathematics',
      'teacher-kay-b6-english-language',
      'teacher-kay-b6-science',
      'teacher-kay-b6-computing'
    );

  IF matching_course_count <> 4 THEN
    RAISE EXCEPTION 'Expected 4 Teacher Kay Basic 6 subjects, but found %. Run the curriculum seed first.', matching_course_count;
  END IF;

  INSERT INTO public."ClassCourseAssignment"
    ("classId", "courseId", "note", "assignedAt")
  SELECT
    target_class_id,
    subject."id",
    'NaCCA-aligned Basic 6 curriculum assigned to Aqua Sapiens Class.',
    now()
  FROM public."Subject" subject
  WHERE subject."createdBy" = target_teacher_id
    AND subject."status" = 'ACTIVE'
    AND 6 = ANY(subject."gradeLevels")
    AND subject."slug" IN (
      'teacher-kay-b6-mathematics',
      'teacher-kay-b6-english-language',
      'teacher-kay-b6-science',
      'teacher-kay-b6-computing'
    )
  ON CONFLICT ("classId", "courseId")
  DO UPDATE SET
    "note" = EXCLUDED."note",
    "assignedAt" = EXCLUDED."assignedAt";

  RAISE NOTICE 'Assigned all 4 Teacher Kay Basic 6 subjects to Aqua Sapiens Class.';
END
$assign$;

-- Verification result shown by the Supabase SQL editor.
SELECT
  classroom."name" AS class_name,
  classroom."gradeLevel" AS class_grade,
  subject."name" AS assigned_subject,
  subject."gradeLevels" AS subject_grades,
  assignment."assignedAt" AS assigned_at
FROM public."ClassCourseAssignment" assignment
JOIN public."TeacherClass" classroom
  ON classroom."id" = assignment."classId"
JOIN public."Subject" subject
  ON subject."id" = assignment."courseId"
WHERE lower(btrim(classroom."name")) = 'aqua sapiens class'
  AND subject."slug" IN (
    'teacher-kay-b6-mathematics',
    'teacher-kay-b6-english-language',
    'teacher-kay-b6-science',
    'teacher-kay-b6-computing'
  )
ORDER BY subject."order", subject."name";
