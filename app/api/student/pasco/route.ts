import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/classes/classroom-server";
import { listStudentPasco } from "@/lib/quizzes/pasco-server";

export async function GET() {
  try {
    const student = await requireStudent();
    return NextResponse.json(await listStudentPasco(student.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load PASCO." }, { status: 400 });
  }
}
