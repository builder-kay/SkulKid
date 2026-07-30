-- Publish supervised class messages to authenticated Realtime subscribers.
ALTER TABLE public."ClassMessage" REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ClassMessage'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."ClassMessage";
  END IF;
END $$;

DROP POLICY IF EXISTS "class room participants receive messages" ON public."ClassMessage";
CREATE POLICY "class room participants receive messages"
ON public."ClassMessage" FOR SELECT TO authenticated
USING (
  "scope" = 'class_room'
  AND (
    public.is_skulkid_admin()
    OR EXISTS (
      SELECT 1 FROM public."TeacherClass" classroom
      WHERE classroom."id" = "ClassMessage"."classId"
        AND classroom."teacherId" = auth.uid()
    )
    OR (
      "moderationStatus" = 'allowed'
      AND "deletedAt" IS NULL
      AND EXISTS (
        SELECT 1 FROM public."ClassMembership" membership
        WHERE membership."classId" = "ClassMessage"."classId"
          AND membership."studentId" = auth.uid()
          AND membership."status" = 'active'
      )
    )
  )
);

COMMENT ON POLICY "class room participants receive messages" ON public."ClassMessage"
IS 'Allows Realtime delivery to the owning teacher and active class members while withholding blocked or deleted content from learners.';
