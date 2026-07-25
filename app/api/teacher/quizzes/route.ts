import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { createTeacherQuiz, listTeacherQuizzes, updateTeacherQuiz } from "@/lib/quizzes/teacher-quiz-server";

const question = z.object({
  id: z.string().optional(), prompt: z.string().trim().min(3).max(400),
  type: z.enum(["multiple_choice", "true_false"]),
  options: z.array(z.string().max(120)).min(2).max(6),
  correctIndex: z.number().int().min(0).max(5), explanation: z.string().max(500).optional()
});
const quiz = z.object({
  title: z.string().trim().min(2).max(120), description: z.string().trim().max(500).optional(),
  subject: z.enum(["mathematics", "english-language", "science", "general"]),
  gradeLevels: z.array(z.number().int().min(1).max(6)).min(1).max(6),
  questions: z.array(question).min(1).max(30), baseXpReward: z.number().int().min(0).max(500),
  passingScore: z.number().int().min(0).max(100), maxAttempts: z.number().int().min(1).max(20),
  status: z.enum(["draft", "ready", "archived"])
});

export async function GET() {
  try {
    const teacher = await requireTeacher();
    return NextResponse.json({ quizzes: await listTeacherQuizzes(teacher.id) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load quizzes." }, { status: 400 }); }
}
export async function POST(request: Request) {
  try {
    const teacher = await requireTeacher(); const input = quiz.parse(await request.json());
    const id = await createTeacherQuiz(teacher.id, { ...input, questions: input.questions.map((q, index) => ({ ...q, id: q.id || `q-${index + 1}` })) });
    return NextResponse.json({ id, quizzes: await listTeacherQuizzes(teacher.id) }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create quiz." }, { status: 400 }); }
}
export async function PATCH(request: Request) {
  try {
    const teacher = await requireTeacher();
    const input = quiz.partial().extend({ id: z.string().uuid() }).parse(await request.json());
    const { id, ...patch } = input; await updateTeacherQuiz(teacher.id, id, {
      ...patch,
      questions: patch.questions?.map((q, index) => ({ ...q, id: q.id || `q-${index + 1}` }))
    });
    return NextResponse.json({ quizzes: await listTeacherQuizzes(teacher.id) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update quiz." }, { status: 400 }); }
}
