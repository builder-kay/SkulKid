import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createTeacherClassRoomMessage,
  createTeacherDirectMessage,
  createTeacherNotification,
  getTeacherMessagingData,
  requireTeacher
} from "@/lib/classes/classroom-server";
import { removeTeacherMessageAttachments, uploadTeacherMessageAttachments } from "@/lib/classes/message-attachments";

export async function GET() {
  try {
    const teacher = await requireTeacher();
    return NextResponse.json(await getTeacherMessagingData(teacher.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load communications." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  let attachments = [] as Awaited<ReturnType<typeof uploadTeacherMessageAttachments>>;
  try {
    const teacher = await requireTeacher();
    const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");
    const form = isMultipart ? await request.formData() : null;
    const raw = form ? JSON.parse(String(form.get("payload") || "{}")) : await request.json();
    const files = form ? form.getAll("attachments").filter((item): item is File => item instanceof File && item.size > 0) : [];
    attachments = await uploadTeacherMessageAttachments({ teacherId: teacher.id, files });

    if (raw?.mode === "direct") {
      const input = z.object({
        mode: z.literal("direct"),
        classId: z.string().uuid(),
        studentId: z.string().uuid(),
        body: z.string().trim().max(1000).default("")
      }).parse(raw);
      const message = await createTeacherDirectMessage({
        teacherId: teacher.id,
        classId: input.classId,
        studentId: input.studentId,
        body: input.body,
        attachments
      });
      return NextResponse.json({ ok: true, message }, { status: 201 });
    }

    if (raw?.mode === "class_group") {
      const input = z.object({
        mode: z.literal("class_group"),
        classId: z.string().uuid(),
        courseId: z.string().min(1).nullable().optional(),
        body: z.string().trim().max(1000).default(""),
        kind: z.enum(["discussion", "announcement"]).default("discussion")
      }).parse(raw);
      const message = await createTeacherClassRoomMessage({
        teacherId: teacher.id,
        classId: input.classId,
        courseId: input.courseId,
        body: input.body,
        kind: input.kind,
        attachments
      });
      return NextResponse.json({ ok: true, message }, { status: 201 });
    }

    const input = z.object({
      audience: z.enum(["all", "class", "selected", "student"]),
      classId: z.string().uuid().optional(),
      studentIds: z.array(z.string().uuid()).max(500).optional(),
      title: z.string().trim().min(2).max(120),
      body: z.string().trim().min(2).max(1000)
    }).parse(raw);
    const recipientCount = await createTeacherNotification({ teacherId: teacher.id, ...input, attachments });
    return NextResponse.json({ ok: true, recipientCount }, { status: 201 });
  } catch (error) {
    if (attachments.length) await removeTeacherMessageAttachments(attachments);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send message." }, { status: 400 });
  }
}
