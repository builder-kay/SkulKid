-- Make administrator account deletion a true, cross-workspace purge.
--
-- User-owned workspace data cascades with auth.users. Operational records that
-- must remain for platform continuity keep their data but detach the deleted
-- user's id. Account deletion does not create or retain a phone ban.

ALTER TABLE public."PointDeductionDispute"
  DROP CONSTRAINT IF EXISTS "PointDeductionDispute_deductionId_fkey",
  ADD CONSTRAINT "PointDeductionDispute_deductionId_fkey"
    FOREIGN KEY ("deductionId") REFERENCES public."PointDeduction"("id") ON DELETE CASCADE;

ALTER TABLE public."PointDeductionDispute"
  DROP CONSTRAINT IF EXISTS "PointDeductionDispute_studentId_fkey",
  ADD CONSTRAINT "PointDeductionDispute_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."PointDeduction"
  DROP CONSTRAINT IF EXISTS "PointDeduction_classId_fkey",
  ADD CONSTRAINT "PointDeduction_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES public."TeacherClass"("id") ON DELETE CASCADE;

ALTER TABLE public."PointDeduction"
  DROP CONSTRAINT IF EXISTS "PointDeduction_teacherId_fkey",
  ADD CONSTRAINT "PointDeduction_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."PointDeduction"
  DROP CONSTRAINT IF EXISTS "PointDeduction_studentId_fkey",
  ADD CONSTRAINT "PointDeduction_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."AdminLessonRecord"
  DROP CONSTRAINT IF EXISTS "AdminLessonRecord_createdBy_fkey",
  ADD CONSTRAINT "AdminLessonRecord_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."AdminDashboardSetting"
  ALTER COLUMN "updatedBy" DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS "AdminDashboardSetting_updatedBy_fkey",
  ADD CONSTRAINT "AdminDashboardSetting_updatedBy_fkey"
    FOREIGN KEY ("updatedBy") REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.remove_deleted_user_phone_bans()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public."TeacherPhoneBan"
  WHERE "teacherId" = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS remove_deleted_user_phone_bans_trigger ON auth.users;
CREATE TRIGGER remove_deleted_user_phone_bans_trigger
BEFORE DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.remove_deleted_user_phone_bans();
