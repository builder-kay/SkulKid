import { NextResponse } from "next/server";
import { getStudentClassDetail, requireStudent } from "@/lib/classes/classroom-server";

export async function GET(_: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const student = await requireStudent();
    const { classId } = await context.params;
    const detail = await getStudentClassDetail(student.id, classId);
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load class.";
    const status = message.includes("required") ? 401 : message.includes("Join") || message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
