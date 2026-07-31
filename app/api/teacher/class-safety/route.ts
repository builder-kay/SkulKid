import { NextResponse } from "next/server";
import { z } from "zod";
import { getTeacherClassAccess, requireTeacher } from "@/lib/classes/classroom-server";
import { analyseClassChatMessage, childFriendlyChatRules } from "@/lib/classes/class-chat-safety";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeTeacherMessageAttachments, uploadTeacherMessageAttachments } from "@/lib/classes/message-attachments";

async function owns(teacherId: string, classId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("TeacherClass").select("id").eq("id", classId).eq("teacherId", teacherId).maybeSingle();
  if (!data) throw new Error("Class not found.");
}

export async function GET() {
  try {
    const teacher = await requireTeacher();
    const admin = createAdminClient();
    const { data: classes } = await admin.from("TeacherClass").select("id,name").eq("teacherId", teacher.id).eq("status", "active").order("name");
    const ids = (classes ?? []).map((item) => item.id);
    const [{ data: settings }, { data: reports }, { data: messages }, { data: consents }, { data: memberships }] = ids.length ? await Promise.all([
      admin.from("ClassChatSetting").select("*").in("classId", ids),
      admin.from("ClassMessageReport").select("*").in("classId", ids).order("createdAt", { ascending: false }).limit(100),
      admin.from("ClassMessage").select("id,classId,body,senderId,senderRole,kind,moderationStatus,moderationCategories,createdAt,deletedAt").in("classId", ids).eq("scope", "class_room").order("createdAt", { ascending: false }).limit(300),
      admin.from("ClassChatConsent").select("*").in("classId", ids),
      admin.from("ClassMembership").select("classId,studentId").in("classId", ids).eq("status", "active")
    ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];
    const studentIds = [...new Set((memberships ?? []).map((item) => item.studentId as string))];
    const students = await Promise.all(studentIds.map(async (id) => {
      const user = (await admin.auth.admin.getUserById(id)).data.user;
      return { id, name: String(user?.user_metadata?.display_name || user?.user_metadata?.username || "Learner") };
    }));
    return NextResponse.json({ classes, settings, reports, messages, consents, memberships, students, rules: childFriendlyChatRules });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load class safety." }, { status: 400 });
  }
}

const postSchema = z.object({ classId: z.string().uuid(), courseId: z.string().min(1).nullable().optional(), body: z.string().trim().min(2).max(1000) });
export async function POST(request: Request) {
  let attachments = [] as Awaited<ReturnType<typeof uploadTeacherMessageAttachments>>;
  try {
    const teacher = await requireTeacher();
    const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");
    const form = isMultipart ? await request.formData() : null;
    const input = postSchema.parse(form ? JSON.parse(String(form.get("payload") || "{}")) : await request.json());
    const files = form ? form.getAll("attachments").filter((item): item is File => item instanceof File && item.size > 0) : [];
    attachments = await uploadTeacherMessageAttachments({ teacherId: teacher.id, files });
    const access = await getTeacherClassAccess(teacher.id, input.classId);
    if (access.role === "subject_teacher" && (!input.courseId || !access.assignedCourseIds.includes(input.courseId))) throw new Error("Choose one of your assigned subjects for this class message.");
    const safety = analyseClassChatMessage(input.body, { allowLinks: true });
    if (!safety.allowed) throw new Error(safety.reason || "This message was held by the safety filter.");
    const admin = createAdminClient();
    const { data, error } = await admin.from("ClassMessage").insert({ classId: input.classId, courseId: input.courseId ?? null, teacherId: teacher.id, senderId: teacher.id, senderRole: "teacher", scope: "class_room", kind: "announcement", body: input.body, attachments, moderationStatus: "allowed" }).select("id").single();
    if (error) throw new Error(error.message);
    await admin.from("ClassMessageAudit").insert({ messageId: data.id, classId: input.classId, actorId: teacher.id, action: "created", bodySnapshot: input.body });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (attachments.length) await removeTeacherMessageAttachments(attachments);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to post." }, { status: 400 });
  }
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("settings"), classId: z.string().uuid(), enabled: z.boolean(), locked: z.boolean(), postingStartsAt: z.string().nullable(), postingEndsAt: z.string().nullable(), guardianConsentRequired: z.boolean() }),
  z.object({ action: z.literal("delete"), classId: z.string().uuid(), messageId: z.string().uuid(), reason: z.string().trim().min(3).max(300) }),
  z.object({ action: z.literal("consent"), classId: z.string().uuid(), studentId: z.string().uuid(), active: z.boolean() }),
  z.object({ action: z.literal("resolve_report"), classId: z.string().uuid(), reportId: z.string().uuid(), status: z.enum(["resolved", "dismissed"]), note: z.string().trim().max(300).optional() })
]);
export async function PATCH(request: Request) {
  try {
    const teacher = await requireTeacher();
    const input = patchSchema.parse(await request.json());
    await owns(teacher.id, input.classId);
    const admin = createAdminClient();
    if (input.action === "settings") {
      const { error } = await admin.from("ClassChatSetting").upsert({ classId: input.classId, teacherId: teacher.id, enabled: input.enabled, locked: input.locked, postingStartsAt: input.postingStartsAt, postingEndsAt: input.postingEndsAt, guardianConsentRequired: input.guardianConsentRequired, updatedAt: new Date().toISOString() }, { onConflict: "classId" });
      if (error) throw new Error(error.message);
    } else if (input.action === "consent") {
      const now = new Date().toISOString();
      const { data: existing } = await admin.from("ClassChatConsent").select("rulesAcceptedAt,rulesVersion").eq("classId", input.classId).eq("studentId", input.studentId).maybeSingle();
      const { error } = await admin.from("ClassChatConsent").upsert({
        classId: input.classId,
        studentId: input.studentId,
        guardianConfirmedBy: teacher.id,
        guardianConfirmedAt: input.active ? now : null,
        // Keep any prior learner acceptance; guardian record no longer auto-accepts rules.
        rulesAcceptedAt: input.active ? (existing?.rulesAcceptedAt ?? null) : null,
        rulesVersion: existing?.rulesVersion ?? "class-chat-v1",
        active: input.active,
        updatedAt: now
      }, { onConflict: "classId,studentId" });
      if (error) throw new Error(error.message);
    } else if (input.action === "resolve_report") {
      const now = new Date().toISOString();
      const { data: report, error: reportError } = await admin.from("ClassMessageReport")
        .update({ status: input.status, resolvedAt: now, resolvedBy: teacher.id, resolutionNote: input.note?.trim() || null })
        .eq("id", input.reportId)
        .eq("classId", input.classId)
        .eq("status", "open")
        .select("id,messageId")
        .maybeSingle();
      if (reportError) throw new Error(reportError.message);
      if (!report) throw new Error("Open report not found.");
    } else {
      const { data: message } = await admin.from("ClassMessage").select("body").eq("id", input.messageId).eq("classId", input.classId).maybeSingle();
      if (!message) throw new Error("Message not found.");
      const now = new Date().toISOString();
      await admin.from("ClassMessage").update({ deletedAt: now, deletedBy: teacher.id, body: "Message removed by the teacher." }).eq("id", input.messageId);
      await admin.from("ClassMessageAudit").insert({ messageId: input.messageId, classId: input.classId, actorId: teacher.id, action: "deleted", bodySnapshot: message.body, metadata: { reason: input.reason } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update class safety." }, { status: 400 }); }
}
