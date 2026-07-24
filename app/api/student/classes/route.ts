import { NextResponse } from "next/server";
import { listStudentClasses, requireStudent } from "@/lib/classes/classroom-server";

export async function GET() {
  try {
    const student = await requireStudent();
    const classes = await listStudentClasses(student.id);
    return NextResponse.json({ classes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load classes.";
    const status = message.includes("required") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
