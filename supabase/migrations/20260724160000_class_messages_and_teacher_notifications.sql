-- Two-way classroom messages and teacher announcements with explicit recipients.

CREATE TABLE public."ClassMessage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "classId" uuid NOT NULL REFERENCES public."TeacherClass"("id") ON DELETE CASCADE,
  "teacherId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "senderId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "body" text NOT NULL CHECK (char_length(trim("body")) BETWEEN 1 AND 1000),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "readAt" timestamptz
);
CREATE INDEX "ClassMessage_teacher_created_idx" ON public."ClassMessage" ("teacherId", "createdAt" DESC);
CREATE INDEX "ClassMessage_student_created_idx" ON public."ClassMessage" ("studentId", "createdAt" DESC);

CREATE TABLE public."TeacherNotification" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacherId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "classId" uuid REFERENCES public."TeacherClass"("id") ON DELETE SET NULL,
  "title" text NOT NULL CHECK (char_length(trim("title")) BETWEEN 2 AND 120),
  "body" text NOT NULL CHECK (char_length(trim("body")) BETWEEN 2 AND 1000),
  "audience" text NOT NULL CHECK ("audience" IN ('all', 'class', 'selected', 'student')),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public."TeacherNotificationRecipient" (
  "notificationId" uuid NOT NULL REFERENCES public."TeacherNotification"("id") ON DELETE CASCADE,
  "studentId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "readAt" timestamptz,
  PRIMARY KEY ("notificationId", "studentId")
);
CREATE INDEX "TeacherNotificationRecipient_student_idx"
ON public."TeacherNotificationRecipient" ("studentId", "readAt");

ALTER TABLE public."ClassMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeacherNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeacherNotificationRecipient" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message participants read classroom messages" ON public."ClassMessage"
FOR SELECT TO authenticated USING ("teacherId" = auth.uid() OR "studentId" = auth.uid() OR public.is_skulkid_admin());
CREATE POLICY "teachers read own notifications" ON public."TeacherNotification"
FOR SELECT TO authenticated USING ("teacherId" = auth.uid() OR public.is_skulkid_admin());
CREATE POLICY "recipients read notification headers" ON public."TeacherNotification"
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public."TeacherNotificationRecipient" r
    WHERE r."notificationId" = "TeacherNotification"."id" AND r."studentId" = auth.uid())
);
CREATE POLICY "students read own notification receipt" ON public."TeacherNotificationRecipient"
FOR SELECT TO authenticated USING ("studentId" = auth.uid() OR public.is_skulkid_admin());

-- All writes use authenticated server routes after ownership and membership validation.
GRANT SELECT ON public."ClassMessage", public."TeacherNotification", public."TeacherNotificationRecipient" TO authenticated;
GRANT ALL ON public."ClassMessage", public."TeacherNotification", public."TeacherNotificationRecipient" TO service_role;
