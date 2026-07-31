import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createStudentDirectMessage,
  createStudentTeacherMessage,
  getStudentDirectMessages,
  requireStudent
} from "@/lib/classes/classroom-server";

const postSchema = z.object({
  body: z.string().trim().min(1).max(1000),
  scope: z.enum(["class_room", "legacy_direct"]).default("class_room")
});

export async function GET(_request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const student = await requireStudent();
    const { classId } = await context.params;
    const messages = await getStudentDirectMessages(student.id, classId, { markRead: true });
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load messages." }, { status: 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const student = await requireStudent();
    const { classId } = await context.params;
    const input = postSchema.parse(await request.json());
    const message = input.scope === "legacy_direct"
      ? await createStudentDirectMessage({ studentId: student.id, classId, body: input.body })
      : await createStudentTeacherMessage({ studentId: student.id, classId, body: input.body });
    return NextResponse.json({ ok: true, message }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send message." }, { status: 400 });
  }
}
