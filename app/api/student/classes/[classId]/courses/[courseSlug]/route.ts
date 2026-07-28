import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/classes/classroom-server";
import { getStudentClassCourse } from "@/lib/classes/student-class-course-server";

export async function GET(
  _: Request,
  context: { params: Promise<{ classId: string; courseSlug: string }> }
) {
  try {
    const student = await requireStudent();
    const { classId, courseSlug } = await context.params;
    const result = await getStudentClassCourse(student.id, classId, courseSlug);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load this class subject.";
    const status = message.includes("required")
      ? 401
      : message.includes("Join") || message.includes("not found") || message.includes("not assigned")
        ? 404
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
