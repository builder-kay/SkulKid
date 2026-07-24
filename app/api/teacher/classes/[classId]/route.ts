import { NextResponse } from "next/server";
import { getTeacherClassDetail, requireTeacher } from "@/lib/classes/classroom-server";

export async function GET(_: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const detail = await getTeacherClassDetail(teacher.id, classId);
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load class.";
    const status = message.includes("required") ? 401 : message.includes("not found") || message.includes("own") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
