-- Supabase-native persistence for the current SkulKid application state.

CREATE TABLE public."AdminLessonRecord" (
  "id" text PRIMARY KEY,
  "subject" text NOT NULL CHECK ("subject" IN ('mathematics', 'english-language', 'science')),
  "status" text NOT NULL CHECK ("status" IN ('draft', 'published')),
  "position" integer NOT NULL DEFAULT 0,
  "record" jsonb NOT NULL,
  "createdBy" uuid NOT NULL REFERENCES auth.users(id),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "AdminLessonRecord_subject_status_position_idx"
ON public."AdminLessonRecord" ("subject", "status", "position");

CREATE TABLE public."StudentProfile" (
  "userId" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "profile" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public."StudentGameState" (
  "userId" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "state" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public."AdminDashboardSetting" (
  "key" text PRIMARY KEY,
  "settings" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "updatedBy" uuid NOT NULL REFERENCES auth.users(id),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_admin_lesson_record_updated_at
BEFORE UPDATE ON public."AdminLessonRecord"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_student_profile_updated_at
BEFORE UPDATE ON public."StudentProfile"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_student_game_state_updated_at
BEFORE UPDATE ON public."StudentGameState"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_admin_dashboard_setting_updated_at
BEFORE UPDATE ON public."AdminDashboardSetting"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public."AdminLessonRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StudentProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StudentGameState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminDashboardSetting" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published lesson records are readable"
ON public."AdminLessonRecord" FOR SELECT TO authenticated
USING ("status" = 'published' OR public.is_skulkid_admin());

CREATE POLICY "admins manage lesson records"
ON public."AdminLessonRecord" FOR ALL TO authenticated
USING (public.is_skulkid_admin())
WITH CHECK (public.is_skulkid_admin() AND "createdBy" = auth.uid());

CREATE POLICY "students read own profile state"
ON public."StudentProfile" FOR SELECT TO authenticated
USING ("userId" = auth.uid());

CREATE POLICY "students create own profile state"
ON public."StudentProfile" FOR INSERT TO authenticated
WITH CHECK ("userId" = auth.uid());

CREATE POLICY "students update own profile state"
ON public."StudentProfile" FOR UPDATE TO authenticated
USING ("userId" = auth.uid())
WITH CHECK ("userId" = auth.uid());

CREATE POLICY "students read own game state"
ON public."StudentGameState" FOR SELECT TO authenticated
USING ("userId" = auth.uid());

-- Game state writes are intentionally service-role only. XP, quiz rewards,
-- streaks, gifts, and avatar redemption must be validated by server routes.

CREATE POLICY "admins manage dashboard settings"
ON public."AdminDashboardSetting" FOR ALL TO authenticated
USING (public.is_skulkid_admin())
WITH CHECK (public.is_skulkid_admin() AND "updatedBy" = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public."StudentProfile" TO authenticated;
GRANT SELECT ON public."StudentGameState" TO authenticated;
GRANT ALL ON public."AdminLessonRecord", public."AdminDashboardSetting" TO authenticated;
GRANT ALL ON
  public."AdminLessonRecord",
  public."StudentProfile",
  public."StudentGameState",
  public."AdminDashboardSetting"
TO service_role;
