import { NextResponse } from "next/server";
import { z } from "zod";
import { getStudentQuizForAttempt, requireStudent, submitClassQuiz } from "@/lib/classes/classroom-server";

export async function GET(_: Request, context: { params: Promise<{ classId: string; quizId: string }> }) {
  try {
    const student = await requireStudent();
    const { classId, quizId } = await context.params;
    const payload = await getStudentQuizForAttempt(student.id, classId, quizId);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load quiz." }, { status: 400 });
  }
}

const submitSchema = z.object({
  clientAttemptId: z.string().min(8).max(80).optional(),
  answers: z.array(z.object({
    questionId: z.string().min(1),
    selectedIndex: z.number().int().min(0).max(5)
  })).min(1)
});

export async function POST(request: Request, context: { params: Promise<{ classId: string; quizId: string }> }) {
  try {
    const student = await requireStudent();
    const { classId, quizId } = await context.params;
    const input = submitSchema.parse(await request.json());
    const result = await submitClassQuiz({
      studentId: student.id,
      classId,
      quizId,
      answers: input.answers,
      clientAttemptId: input.clientAttemptId
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit quiz." }, { status: 400 });
  }
}
