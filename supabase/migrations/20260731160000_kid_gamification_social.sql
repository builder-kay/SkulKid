-- Weekly Helper of the Week + teacher bonus XP surprises.

CREATE TABLE IF NOT EXISTS public."ClassWeeklyHelper" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "weekStart" date NOT NULL,
  "studentId" uuid NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "crownedBy" uuid NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "note" text NOT NULL DEFAULT '',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("classId", "weekStart")
);

CREATE INDEX IF NOT EXISTS class_weekly_helper_class_idx
  ON public."ClassWeeklyHelper" ("classId", "weekStart" DESC);

ALTER TABLE public."ClassWeeklyHelper" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class participants can read weekly helpers"
  ON public."ClassWeeklyHelper"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."ClassMembership" m
      WHERE m."classId" = "ClassWeeklyHelper"."classId"
        AND m."studentId" = auth.uid()
        AND m."status" = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public."TeacherClass" c
      WHERE c."id" = "ClassWeeklyHelper"."classId"
        AND c."teacherId" = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public."ClassTeacherAssignment" ct
      WHERE ct."classId" = "ClassWeeklyHelper"."classId"
        AND ct."teacherId" = auth.uid()
        AND ct."status" = 'active'
    )
  );

CREATE TABLE IF NOT EXISTS public."PointBonus" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "teacherId" uuid NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "studentId" uuid NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "amount" integer NOT NULL CHECK ("amount" >= 1 AND "amount" <= 50),
  "reason" text NOT NULL,
  "balanceBefore" integer NOT NULL,
  "balanceAfter" integer NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS point_bonus_teacher_student_idx
  ON public."PointBonus" ("teacherId", "studentId", "createdAt" DESC);

ALTER TABLE public."PointBonus" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers can read own bonuses"
  ON public."PointBonus"
  FOR SELECT
  TO authenticated
  USING ("teacherId" = auth.uid() OR "studentId" = auth.uid());

CREATE OR REPLACE FUNCTION public.apply_teacher_point_bonus(
  p_teacher_id uuid,
  p_class_id uuid,
  p_student_id uuid,
  p_amount integer,
  p_reason text
) RETURNS public."PointBonus"
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  game_row public."StudentGameState"%ROWTYPE;
  before_xp integer;
  before_avatar integer;
  bonus public."PointBonus"%ROWTYPE;
  used_today integer;
  actions_today integer;
  owns boolean;
BEGIN
  IF p_amount NOT IN (10, 20, 50) THEN
    RAISE EXCEPTION 'Choose a surprise of 10, 20, or 50 XP.';
  END IF;
  IF char_length(trim(p_reason)) < 4 OR char_length(trim(p_reason)) > 600 THEN
    RAISE EXCEPTION 'Add a short note of 4 to 600 characters.';
  END IF;

  owns := EXISTS (
    SELECT 1 FROM public."TeacherClass" c
    WHERE c."id" = p_class_id AND c."teacherId" = p_teacher_id AND c."status" = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public."ClassTeacherAssignment" ct
    WHERE ct."classId" = p_class_id AND ct."teacherId" = p_teacher_id AND ct."status" = 'active'
      AND ct."role" = 'class_teacher'
  );
  IF NOT owns THEN RAISE EXCEPTION 'You do not teach this active class.'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."ClassMembership" m
    WHERE m."classId" = p_class_id AND m."studentId" = p_student_id AND m."status" = 'active'
  ) THEN RAISE EXCEPTION 'The student is not an active member of this class.'; END IF;

  SELECT COALESCE(sum("amount"), 0), count(*)
    INTO used_today, actions_today
  FROM public."PointBonus"
  WHERE "teacherId" = p_teacher_id
    AND "studentId" = p_student_id
    AND "createdAt" >= now() - interval '24 hours';
  IF actions_today >= 5 THEN
    RAISE EXCEPTION 'Safety limit reached: no more than 5 XP surprises per student in 24 hours.';
  END IF;
  IF used_today + p_amount > 100 THEN
    RAISE EXCEPTION 'Safety limit reached: no more than 100 surprise XP per student in 24 hours.';
  END IF;

  SELECT * INTO game_row FROM public."StudentGameState"
  WHERE "userId" = p_student_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public."StudentGameState" ("userId", state)
    VALUES (p_student_id, jsonb_build_object('xp', 0, 'avatarPoints', 0, 'stars', 0, 'streak', 0))
    RETURNING * INTO game_row;
  END IF;

  before_xp := GREATEST(0, COALESCE((game_row.state->>'xp')::integer, 0));
  before_avatar := GREATEST(0, COALESCE((game_row.state->>'avatarPoints')::integer, before_xp));

  UPDATE public."StudentGameState"
  SET state = jsonb_set(
    jsonb_set(state, '{xp}', to_jsonb(before_xp + p_amount), true),
    '{avatarPoints}', to_jsonb(before_avatar + p_amount), true
  )
  WHERE "userId" = p_student_id;

  INSERT INTO public."PointBonus"
    ("classId", "teacherId", "studentId", "amount", "reason", "balanceBefore", "balanceAfter")
  VALUES
    (p_class_id, p_teacher_id, p_student_id, p_amount, trim(p_reason), before_xp, before_xp + p_amount)
  RETURNING * INTO bonus;
  RETURN bonus;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_teacher_point_bonus(uuid, uuid, uuid, integer, text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_teacher_point_bonus(uuid, uuid, uuid, integer, text) TO service_role;
