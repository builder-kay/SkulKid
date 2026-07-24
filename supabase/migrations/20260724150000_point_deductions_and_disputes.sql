-- Audited teacher point deductions with student disputes and admin review.

CREATE TABLE public."PointDeduction" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE RESTRICT,
  "teacherId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  "amount" integer NOT NULL CHECK ("amount" BETWEEN 1 AND 50),
  "reason" text NOT NULL CHECK (char_length(trim("reason")) BETWEEN 12 AND 600),
  "balanceBefore" integer NOT NULL CHECK ("balanceBefore" >= 0),
  "balanceAfter" integer NOT NULL CHECK ("balanceAfter" >= 0),
  "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'upheld', 'reversed')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "reversedAt" timestamptz,
  "reviewedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "reviewNote" text
);

CREATE INDEX "PointDeduction_student_created_idx"
ON public."PointDeduction" ("studentId", "createdAt" DESC);
CREATE INDEX "PointDeduction_teacher_created_idx"
ON public."PointDeduction" ("teacherId", "createdAt" DESC);

CREATE TABLE public."PointDeductionDispute" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "deductionId" uuid NOT NULL UNIQUE REFERENCES public."PointDeduction"("id") ON DELETE RESTRICT,
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  "message" text NOT NULL CHECK (char_length(trim("message")) BETWEEN 12 AND 600),
  "status" text NOT NULL DEFAULT 'open' CHECK ("status" IN ('open', 'upheld', 'reversed')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "resolvedAt" timestamptz,
  "resolvedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "resolutionNote" text
);

CREATE INDEX "PointDeductionDispute_status_created_idx"
ON public."PointDeductionDispute" ("status", "createdAt" DESC);

ALTER TABLE public."PointDeduction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PointDeductionDispute" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deductions visible to involved users and admins"
ON public."PointDeduction" FOR SELECT TO authenticated
USING ("studentId" = auth.uid() OR "teacherId" = auth.uid() OR public.is_skulkid_admin());

CREATE POLICY "disputes visible to involved users and admins"
ON public."PointDeductionDispute" FOR SELECT TO authenticated
USING (
  "studentId" = auth.uid()
  OR public.is_skulkid_admin()
  OR EXISTS (
    SELECT 1 FROM public."PointDeduction" deduction
    WHERE deduction."id" = "PointDeductionDispute"."deductionId"
      AND deduction."teacherId" = auth.uid()
  )
);

-- These writes are service-route only so balance changes and audit records cannot diverge.
GRANT SELECT ON public."PointDeduction", public."PointDeductionDispute" TO authenticated;
GRANT ALL ON public."PointDeduction", public."PointDeductionDispute" TO service_role;

CREATE OR REPLACE FUNCTION public.apply_teacher_point_deduction(
  p_teacher_id uuid,
  p_class_id uuid,
  p_student_id uuid,
  p_amount integer,
  p_reason text
) RETURNS public."PointDeduction"
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  game_row public."StudentGameState"%ROWTYPE;
  before_xp integer;
  deduction public."PointDeduction"%ROWTYPE;
  used_today integer;
  actions_today integer;
BEGIN
  IF p_amount < 1 OR p_amount > 50 THEN
    RAISE EXCEPTION 'A deduction must be between 1 and 50 points.';
  END IF;
  IF char_length(trim(p_reason)) < 12 OR char_length(trim(p_reason)) > 600 THEN
    RAISE EXCEPTION 'Give a clear reason of 12 to 600 characters.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public."TeacherClass" c
    WHERE c."id" = p_class_id AND c."teacherId" = p_teacher_id AND c."status" = 'active'
  ) THEN RAISE EXCEPTION 'You do not own this active class.'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public."ClassMembership" m
    WHERE m."classId" = p_class_id AND m."studentId" = p_student_id AND m."status" = 'active'
  ) THEN RAISE EXCEPTION 'The student is not an active member of this class.'; END IF;

  SELECT COALESCE(sum("amount"), 0), count(*)
    INTO used_today, actions_today
  FROM public."PointDeduction"
  WHERE "teacherId" = p_teacher_id
    AND "studentId" = p_student_id
    AND "createdAt" >= now() - interval '24 hours'
    AND "status" <> 'reversed';
  IF actions_today >= 5 THEN
    RAISE EXCEPTION 'Safety limit reached: no more than 5 deductions per student in 24 hours.';
  END IF;
  IF used_today + p_amount > 100 THEN
    RAISE EXCEPTION 'Safety limit reached: no more than 100 points per student in 24 hours.';
  END IF;

  SELECT * INTO game_row FROM public."StudentGameState"
  WHERE "userId" = p_student_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Student points record was not found.'; END IF;
  before_xp := GREATEST(0, COALESCE((game_row.state->>'xp')::integer, 0));
  IF p_amount > before_xp THEN RAISE EXCEPTION 'A deduction cannot exceed the student''s current points.'; END IF;

  UPDATE public."StudentGameState"
  SET state = jsonb_set(state, '{xp}', to_jsonb(before_xp - p_amount), true)
  WHERE "userId" = p_student_id;

  INSERT INTO public."PointDeduction"
    ("classId", "teacherId", "studentId", "amount", "reason", "balanceBefore", "balanceAfter")
  VALUES
    (p_class_id, p_teacher_id, p_student_id, p_amount, trim(p_reason), before_xp, before_xp - p_amount)
  RETURNING * INTO deduction;
  RETURN deduction;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_point_deduction_dispute(
  p_admin_id uuid,
  p_dispute_id uuid,
  p_resolution text,
  p_note text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  dispute public."PointDeductionDispute"%ROWTYPE;
  deduction public."PointDeduction"%ROWTYPE;
BEGIN
  IF p_resolution NOT IN ('upheld', 'reversed') THEN RAISE EXCEPTION 'Invalid resolution.'; END IF;
  IF char_length(trim(p_note)) < 4 THEN RAISE EXCEPTION 'Add a short review note.'; END IF;
  SELECT * INTO dispute FROM public."PointDeductionDispute" WHERE "id" = p_dispute_id FOR UPDATE;
  IF NOT FOUND OR dispute.status <> 'open' THEN RAISE EXCEPTION 'This dispute is no longer open.'; END IF;
  SELECT * INTO deduction FROM public."PointDeduction" WHERE "id" = dispute."deductionId" FOR UPDATE;

  IF p_resolution = 'reversed' THEN
    UPDATE public."StudentGameState"
    SET state = jsonb_set(
      state, '{xp}',
      to_jsonb(GREATEST(0, COALESCE((state->>'xp')::integer, 0)) + deduction."amount"), true
    )
    WHERE "userId" = deduction."studentId";
  END IF;

  UPDATE public."PointDeduction"
  SET status = p_resolution, "reviewedBy" = p_admin_id, "reviewNote" = trim(p_note),
      "reversedAt" = CASE WHEN p_resolution = 'reversed' THEN now() ELSE NULL END
  WHERE "id" = deduction."id";
  UPDATE public."PointDeductionDispute"
  SET status = p_resolution, "resolvedAt" = now(), "resolvedBy" = p_admin_id,
      "resolutionNote" = trim(p_note)
  WHERE "id" = dispute."id";
END;
$$;

REVOKE ALL ON FUNCTION public.apply_teacher_point_deduction(uuid, uuid, uuid, integer, text) FROM PUBLIC, authenticated;
REVOKE ALL ON FUNCTION public.resolve_point_deduction_dispute(uuid, uuid, text, text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_teacher_point_deduction(uuid, uuid, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.resolve_point_deduction_dispute(uuid, uuid, text, text) TO service_role;
