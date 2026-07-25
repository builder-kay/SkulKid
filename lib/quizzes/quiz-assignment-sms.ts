import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/auth/clifze";
import { assignedQuizSms } from "@/lib/auth/sms-links";
import { normalizeGhanaPhone } from "@/lib/auth/phone";

export async function sendQuizAssignmentMessages(input: {
  teacherId: string;
  assignments: Array<{ id: string; classId: string }>;
  startAt: string | null;
  deadline: string | null;
  quizUrl: (classId: string, quizId: string) => string;
}) {
  if (!input.assignments.length) return { sent: 0, failed: 0, skipped: 0 };
  const admin = createAdminClient();
  const classIds = input.assignments.map((item) => item.classId);
  const [{ data: quizzes }, { data: classes }, { data: memberships }] = await Promise.all([
    admin.from("ClassQuiz").select("id,title,classId").in("id", input.assignments.map((item) => item.id)).eq("createdBy", input.teacherId),
    admin.from("TeacherClass").select("id,name").in("id", classIds).eq("teacherId", input.teacherId),
    admin.from("ClassMembership").select("classId,studentId").in("classId", classIds).eq("status", "active")
  ]);
  const classNames = new Map((classes ?? []).map((item) => [item.id as string, item.name as string]));
  const assignmentByClass = new Map(input.assignments.map((item) => [item.classId, item.id]));
  const titleByQuiz = new Map((quizzes ?? []).map((item) => [item.id as string, item.title as string]));
  const recipients = await Promise.all((memberships ?? []).map(async (membership) => {
    const { data } = await admin.auth.admin.getUserById(membership.studentId as string);
    const raw = data.user?.user_metadata?.phone_e164 ?? data.user?.user_metadata?.phone;
    if (typeof raw !== "string") return null;
    try {
      return {
        phone: normalizeGhanaPhone(raw),
        classId: membership.classId as string,
        studentId: membership.studentId as string
      };
    } catch {
      return null;
    }
  }));

  const valid = recipients.filter((item): item is NonNullable<typeof item> => Boolean(item));
  const results = await Promise.allSettled(valid.map((recipient) => sendSms(recipient.phone, assignedQuizSms({
    quizTitle: titleByQuiz.get(assignmentByClass.get(recipient.classId)!) ?? "New quiz",
    className: classNames.get(recipient.classId) ?? "your class",
    startAt: input.startAt,
    endAt: input.deadline,
    quizUrl: input.quizUrl(recipient.classId, assignmentByClass.get(recipient.classId)!)
  }))));
  return {
    sent: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
    skipped: (memberships?.length ?? 0) - valid.length
  };
}
