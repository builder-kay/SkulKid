import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/classes/classroom-server";
import { getStudentPascoQuiz } from "@/lib/quizzes/pasco-server";

export async function GET(_: Request, context: { params: Promise<{ quizId: string }> }) {
  try {
    const student = await requireStudent();
    const { quizId } = await context.params;
    return NextResponse.json(await getStudentPascoQuiz(student.id, quizId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load this PASCO quiz." }, { status: 400 });
  }
}
