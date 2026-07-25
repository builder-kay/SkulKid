import { NextResponse } from "next/server";
import { z } from "zod";
import { createClassQuiz, listClassQuizzes, requireTeacher, updateClassQuiz } from "@/lib/classes/classroom-server";
import { sendQuizAssignmentMessages } from "@/lib/quizzes/quiz-assignment-sms";
import { platformActionUrl } from "@/lib/auth/sms-links";

const questionSchema = z.object({
  id: z.string().optional(),
  prompt: z.string().trim().min(3).max(400),
  type: z.enum(["multiple_choice", "true_false"]),
  options: z.array(z.string().trim().min(1).max(120)).max(6).default([]),
  correctIndex: z.number().int().min(0).max(5)
});

const quizFieldsSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  questions: z.array(questionSchema).min(1).max(30),
  startAt: z.string().datetime().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  offPlatformReward: z.string().trim().max(500).optional(),
  baseXpReward: z.number().int().min(0).max(500).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  maxAttempts: z.number().int().min(1).max(20).optional(),
  status: z.enum(["draft", "published", "closed"]).optional()
});

function validateSchedule(value: { startAt?: string | null; deadline?: string | null }, context: z.RefinementCtx) {
  if (value.startAt && value.deadline && new Date(value.startAt) >= new Date(value.deadline)) {
    context.addIssue({ code: "custom", path: ["deadline"], message: "The end time must be after the start time." });
  }
}

const createSchema = quizFieldsSchema.superRefine(validateSchedule);

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
      startAt: input.startAt,
      deadline: input.deadline,
      offPlatformReward: input.offPlatformReward,
      baseXpReward: input.baseXpReward,
      passingScore: input.passingScore,
      maxAttempts: input.maxAttempts,
      status: input.status
    });
    const quizzes = await listClassQuizzes(teacher.id, classId);
    const sms = input.status === "published"
      ? await sendQuizAssignmentMessages({
          teacherId: teacher.id,
          assignments: [{ id: quizId, classId }],
          startAt: input.startAt ?? null,
          deadline: input.deadline ?? null,
          quizUrl: (assignedClassId, assignedQuizId) => platformActionUrl(request, `/classes/${assignedClassId}/quizzes/${assignedQuizId}`)
        })
      : { sent: 0, failed: 0, skipped: 0 };
    return NextResponse.json({ quizId, quizzes, sms }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create quiz." }, { status: 400 });
  }
}

const patchSchema = quizFieldsSchema.partial().extend({ quizId: z.string().uuid() }).superRefine(validateSchedule);

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
      startAt: input.startAt,
      deadline: input.deadline,
      offPlatformReward: input.offPlatformReward,
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
