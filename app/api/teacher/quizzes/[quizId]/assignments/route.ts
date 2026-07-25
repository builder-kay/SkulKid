import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { assignTeacherQuiz } from "@/lib/quizzes/teacher-quiz-server";

const schema = z.object({
  classIds: z.array(z.string().uuid()).min(1).max(50),
  deadline: z.string().datetime().nullable().optional()
});
export async function POST(request: Request, context: { params: Promise<{ quizId: string }> }) {
  try {
    const teacher = await requireTeacher(); const { quizId } = await context.params;
    const input = schema.parse(await request.json());
    const assignments = await assignTeacherQuiz(teacher.id, quizId, [...new Set(input.classIds)], input.deadline ?? null);
    return NextResponse.json({ assignments }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to assign quiz." }, { status: 400 }); }
}
