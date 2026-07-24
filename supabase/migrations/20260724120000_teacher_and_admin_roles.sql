-- Separate teacher (content author) from platform admin roles.
-- Staff (teacher OR admin) may manage curriculum content.
-- Only platform admins keep is_skulkid_admin() for privileged learner-data ops.

CREATE OR REPLACE FUNCTION public.is_skulkid_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'teacher';
$$;

CREATE OR REPLACE FUNCTION public.is_skulkid_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('teacher', 'admin');
$$;

REVOKE ALL ON FUNCTION public.is_skulkid_teacher() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_skulkid_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_skulkid_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_skulkid_staff() TO authenticated;

COMMENT ON FUNCTION public.is_skulkid_admin() IS 'Platform administrator (users, moderation, system settings).';
COMMENT ON FUNCTION public.is_skulkid_teacher() IS 'Teacher content author workspace.';
COMMENT ON FUNCTION public.is_skulkid_staff() IS 'Teacher or platform admin — curriculum authoring privileges.';

-- Move curriculum authoring policies from admin-only to staff.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'Subject', 'CurriculumImport', 'Unit', 'Topic', 'Lesson', 'LessonVersion',
    'LearningObjective', 'LessonBlock'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'admins manage ' || lower(table_name), table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_skulkid_staff()) WITH CHECK (public.is_skulkid_staff())',
      'staff manage ' || lower(table_name),
      table_name
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS "published lesson records are readable" ON public."AdminLessonRecord";
DROP POLICY IF EXISTS "admins manage lesson records" ON public."AdminLessonRecord";
CREATE POLICY "published lesson records are readable"
ON public."AdminLessonRecord" FOR SELECT TO authenticated
USING ("status" = 'published' OR public.is_skulkid_staff());

CREATE POLICY "staff manage lesson records"
ON public."AdminLessonRecord" FOR ALL TO authenticated
USING (public.is_skulkid_staff())
WITH CHECK (public.is_skulkid_staff());

DROP POLICY IF EXISTS "admins manage dashboard settings" ON public."AdminDashboardSetting";
CREATE POLICY "staff manage dashboard settings"
ON public."AdminDashboardSetting" FOR ALL TO authenticated
USING (public.is_skulkid_staff())
WITH CHECK (public.is_skulkid_staff());

DROP POLICY IF EXISTS "published nonempty subjects are readable" ON public."Subject";
DROP POLICY IF EXISTS "published subjects are readable" ON public."Subject";
CREATE POLICY "published nonempty subjects are readable" ON public."Subject"
  FOR SELECT TO authenticated
  USING (
    public.is_skulkid_staff()
    OR (
      "status"::text IN ('ACTIVE', 'PUBLISHED')
      AND EXISTS (
        SELECT 1
        FROM public."AdminLessonRecord" lesson
        WHERE lesson."courseId" = "Subject"."id"
          AND lesson.status = 'published'
      )
    )
  );

-- Teachers and admins are staff accounts, not learner identities.
CREATE OR REPLACE FUNCTION public.handle_new_skulkid_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.raw_app_meta_data ->> 'role', 'student') = 'student' THEN
    INSERT INTO public."Student" (
      "id",
      "displayName",
      "age",
      "dailyGoalXp",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      NEW.id::text,
      COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'display_name'), ''), 'Learner'),
      LEAST(18, GREATEST(5, COALESCE((NEW.raw_user_meta_data ->> 'age')::integer, 9))),
      60,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("id") DO UPDATE SET
      "displayName" = EXCLUDED."displayName",
      "age" = EXCLUDED."age",
      "updatedAt" = CURRENT_TIMESTAMP;
  ELSE
    DELETE FROM public."StudentProfile" WHERE "userId" = NEW.id;
    DELETE FROM public."StudentGameState" WHERE "userId" = NEW.id;
    DELETE FROM public."Student" WHERE "id" = NEW.id::text;
  END IF;

  RETURN NEW;
END;
$$;

DELETE FROM public."StudentProfile" profile
USING auth.users account
WHERE profile."userId" = account.id
  AND account.raw_app_meta_data ->> 'role' IN ('admin', 'teacher');

DELETE FROM public."StudentGameState" game_state
USING auth.users account
WHERE game_state."userId" = account.id
  AND account.raw_app_meta_data ->> 'role' IN ('admin', 'teacher');

DELETE FROM public."Student" student
USING auth.users account
WHERE student."id" = account.id::text
  AND account.raw_app_meta_data ->> 'role' IN ('admin', 'teacher');
