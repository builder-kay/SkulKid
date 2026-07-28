-- SkulKid destructive database reset
--
-- Keeps:
--   * auth.users accounts whose raw_app_meta_data.role is exactly "admin"
--   * administrator settings, audit history, incidents, maintenance and service inventory
--   * platform LevelDefinition and BadgeDefinition lookup rows
--
-- Removes:
--   * every non-admin auth user, including students and teachers
--   * all learner profiles, progress, rewards, attempts and recovery attempts
--   * all teacher classes, memberships, messages, notifications and advice
--   * all courses, modules, topics, lessons, publication revisions and quizzes
--   * all teacher trust, moderation, appeal and phone-ban records
--
-- This cannot be undone without a database backup.
-- Run this only in the Supabase SQL Editor with a service/postgres-capable role.

-- ---------------------------------------------------------------------------
-- 1. PREVIEW: run these queries first and confirm the administrator list.
-- ---------------------------------------------------------------------------

SELECT
  id,
  email,
  phone,
  raw_app_meta_data ->> 'role' AS role,
  created_at
FROM auth.users
ORDER BY created_at;

SELECT
  count(*) FILTER (
    WHERE lower(COALESCE(raw_app_meta_data ->> 'role', '')) = 'admin'
  ) AS "adminsKept",
  count(*) FILTER (
    WHERE lower(COALESCE(raw_app_meta_data ->> 'role', '')) <> 'admin'
  ) AS "usersDeleted"
FROM auth.users;

-- ---------------------------------------------------------------------------
-- 2. RESET: uncomment the SET LOCAL line only after checking the preview.
-- ---------------------------------------------------------------------------

BEGIN;

-- UNCOMMENT THIS EXACT LINE TO AUTHORISE THE RESET:
SET LOCAL skulkid.reset_confirmation = 'DELETE_ALL_NON_ADMIN_DATA';

CREATE TEMP TABLE "_SkulKidAdminsToKeep" ON COMMIT DROP AS
SELECT id, email, phone, created_at
FROM auth.users
WHERE lower(COALESCE(raw_app_meta_data ->> 'role', '')) = 'admin';

DO $guard$
DECLARE
  confirmation text := current_setting('skulkid.reset_confirmation', true);
  admin_count integer;
BEGIN
  SELECT count(*) INTO admin_count FROM "_SkulKidAdminsToKeep";

  IF confirmation IS DISTINCT FROM 'DELETE_ALL_NON_ADMIN_DATA' THEN
    RAISE EXCEPTION
      'Reset not authorised. Review the preview and uncomment the SET LOCAL confirmation line.';
  END IF;

  IF admin_count < 1 THEN
    RAISE EXCEPTION
      'Reset stopped: no auth.users account has app_metadata.role = admin.';
  END IF;
END
$guard$;

-- Reassign retained settings to a protected administrator so settings written
-- by a teacher/student do not block deletion of that account.
DELETE FROM public."AdminDashboardSetting"
WHERE "key" LIKE 'jake-demo-%';

UPDATE public."AdminDashboardSetting"
SET
  "updatedBy" = (
    SELECT id
    FROM "_SkulKidAdminsToKeep"
    ORDER BY created_at
    LIMIT 1
  ),
  "updatedAt" = now();

-- Clear application-owned learner, teacher and learning-content tables in one
-- FK-safe TRUNCATE. Missing tables are skipped for partially migrated projects.
DO $truncate$
DECLARE
  table_name text;
  targets text[] := ARRAY[]::text[];
  application_tables constant text[] := ARRAY[
    'CurriculumImport',
    'Subject',
    'Unit',
    'Topic',
    'Lesson',
    'LessonVersion',
    'LearningObjective',
    'LessonBlock',
    'Student',
    'StudentLessonProgress',
    'LessonSession',
    'LessonAttempt',
    'BlockAttempt',
    'StudentResponse',
    'MasteryRecord',
    'LearningEvent',
    'RewardTransaction',
    'BadgeAward',
    'StreakRecord',
    'AdminLessonRecord',
    'StudentProfile',
    'StudentGameState',
    'TeacherClass',
    'ClassMembership',
    'ClassCourseAssignment',
    'ClassQuiz',
    'ClassQuizAttempt',
    'ClassAdvice',
    'PointDeduction',
    'PointDeductionDispute',
    'ClassMessage',
    'TeacherNotification',
    'TeacherNotificationRecipient',
    'UsernameRecoveryAttempt',
    'TeacherQuiz',
    'PublicLearningRevision',
    'TeacherTrustProfile',
    'ContentModerationCase',
    'ModerationAppeal',
    'TeacherPhoneBan'
  ];
BEGIN
  FOREACH table_name IN ARRAY application_tables LOOP
    IF to_regclass(format('%I.%I', 'public', table_name)) IS NOT NULL THEN
      targets := array_append(targets, format('%I.%I', 'public', table_name));
    END IF;
  END LOOP;

  IF cardinality(targets) > 0 THEN
    EXECUTE
      'TRUNCATE TABLE '
      || array_to_string(targets, ', ')
      || ' RESTART IDENTITY CASCADE';
  END IF;
END
$truncate$;

-- Remove all non-admin Supabase Auth accounts. Supabase's auth foreign keys
-- clear their identities, sessions and related account records.
DELETE FROM auth.users
WHERE lower(COALESCE(raw_app_meta_data ->> 'role', '')) <> 'admin';

-- Final fail-closed verification before COMMIT.
DO $verify$
DECLARE
  expected_admin_ids uuid[];
  remaining_admin_ids uuid[];
  non_admin_count integer;
BEGIN
  SELECT array_agg(id ORDER BY id)
  INTO expected_admin_ids
  FROM "_SkulKidAdminsToKeep";

  SELECT array_agg(id ORDER BY id)
  INTO remaining_admin_ids
  FROM auth.users
  WHERE lower(COALESCE(raw_app_meta_data ->> 'role', '')) = 'admin';

  SELECT count(*)
  INTO non_admin_count
  FROM auth.users
  WHERE lower(COALESCE(raw_app_meta_data ->> 'role', '')) <> 'admin';

  IF remaining_admin_ids IS DISTINCT FROM expected_admin_ids THEN
    RAISE EXCEPTION
      'Reset verification failed: the protected administrator set changed. Rolling back.';
  END IF;

  IF non_admin_count <> 0 THEN
    RAISE EXCEPTION
      'Reset verification failed: % non-admin auth users remain. Rolling back.',
      non_admin_count;
  END IF;
END
$verify$;

COMMIT;

-- ---------------------------------------------------------------------------
-- 3. SUCCESS REPORT
-- ---------------------------------------------------------------------------

SELECT
  id,
  email,
  phone,
  raw_app_meta_data ->> 'role' AS role,
  created_at
FROM auth.users
ORDER BY created_at;

SELECT *
FROM (
  SELECT 'remaining auth users' AS item, count(*)::bigint AS total
  FROM auth.users
  UNION ALL
  SELECT 'remaining non-admin users', count(*)::bigint
  FROM auth.users
  WHERE lower(COALESCE(raw_app_meta_data ->> 'role', '')) <> 'admin'
  UNION ALL
  SELECT 'remaining students', count(*)::bigint
  FROM public."Student"
  UNION ALL
  SELECT 'remaining teacher classes', count(*)::bigint
  FROM public."TeacherClass"
  UNION ALL
  SELECT 'remaining lesson records', count(*)::bigint
  FROM public."AdminLessonRecord"
  UNION ALL
  SELECT 'remaining class quizzes', count(*)::bigint
  FROM public."ClassQuiz"
) report
ORDER BY item;
