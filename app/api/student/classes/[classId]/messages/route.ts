import { NextResponse } from "next/server";
import { z } from "zod";
import { createStudentTeacherMessage, requireStudent } from "@/lib/classes/classroom-server";

const schema = z.object({ body: z.string().trim().min(1).max(1000) });

export async function POST(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const student = await requireStudent();
    const { classId } = await context.params;
    const { body } = schema.parse(await request.json());
    const message = await createStudentTeacherMessage({ studentId: student.id, classId, body });
    return NextResponse.json({ ok: true, message }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send message." }, { status: 400 });
  }
}
