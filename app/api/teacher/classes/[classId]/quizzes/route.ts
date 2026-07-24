import { NextResponse } from "next/server";
import { z } from "zod";
import { createClassQuiz, listClassQuizzes, requireTeacher, updateClassQuiz } from "@/lib/classes/classroom-server";

const questionSchema = z.object({
  id: z.string().optional(),
  prompt: z.string().trim().min(3).max(400),
  type: z.enum(["multiple_choice", "true_false"]),
  options: z.array(z.string().trim().min(1).max(120)).max(6).default([]),
  correctIndex: z.number().int().min(0).max(5)
});

const createSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  questions: z.array(questionSchema).min(1).max(30),
  deadline: z.string().datetime().nullable().optional(),
  baseXpReward: z.number().int().min(0).max(500).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  maxAttempts: z.number().int().min(1).max(20).optional(),
  status: z.enum(["draft", "published", "closed"]).optional()
});

export async function GET(_: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const quizzes = await listClassQuizzes(teacher.id, classId);
    return NextResponse.json({ quizzes });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load quizzes." }, { status: 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const input = createSchema.parse(await request.json());
    const quizId = await createClassQuiz({
      teacherId: teacher.id,
      classId,
      title: input.title,
      description: input.description,
      questions: input.questions.map((question, index) => ({
        id: question.id || `q-${index + 1}`,
        prompt: question.prompt,
        type: question.type,
        options: question.options,
        correctIndex: question.correctIndex
      })),
      deadline: input.deadline,
      baseXpReward: input.baseXpReward,
      passingScore: input.passingScore,
      maxAttempts: input.maxAttempts,
      status: input.status
    });
    const quizzes = await listClassQuizzes(teacher.id, classId);
    return NextResponse.json({ quizId, quizzes }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create quiz." }, { status: 400 });
  }
}

const patchSchema = createSchema.partial().extend({ quizId: z.string().uuid() });

export async function PATCH(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const input = patchSchema.parse(await request.json());
    await updateClassQuiz(teacher.id, classId, input.quizId, {
      title: input.title,
      description: input.description,
      questions: input.questions?.map((question, index) => ({
        id: question.id || `q-${index + 1}`,
        prompt: question.prompt,
        type: question.type,
        options: question.options,
        correctIndex: question.correctIndex
      })),
      deadline: input.deadline,
      baseXpReward: input.baseXpReward,
      passingScore: input.passingScore,
      maxAttempts: input.maxAttempts,
      status: input.status
    });
    const quizzes = await listClassQuizzes(teacher.id, classId);
    return NextResponse.json({ quizzes });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update quiz." }, { status: 400 });
  }
}
