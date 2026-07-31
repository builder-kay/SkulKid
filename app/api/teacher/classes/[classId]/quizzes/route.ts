import { NextResponse } from "next/server";
import { z } from "zod";
import { createClassQuiz, listClassQuizzes, requireTeacher, updateClassQuiz } from "@/lib/classes/classroom-server";
import { sendQuizAssignmentMessages } from "@/lib/quizzes/quiz-assignment-sms";
import { platformActionUrl } from "@/lib/auth/sms-links";
import { markModerationPublished, moderateTeacherContent } from "@/lib/moderation/teacher-content-server";

const questionSchema = z.object({
  id: z.string().optional(),
  prompt: z.string().trim().min(3).max(400),
  type: z.enum(["multiple_choice", "true_false"]),
  options: z.array(z.string().trim().min(1).max(120)).max(6).default([]),
  correctIndex: z.number().int().min(0).max(5)
});

const quizFieldsSchema = z.object({
  courseId: z.string().min(1).nullable().optional(),
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
    const quizId = crypto.randomUUID();
    const requestedStatus = input.status ?? "draft";
    const moderation = requestedStatus === "published"
      ? await moderateTeacherContent({
          teacherId: teacher.id,
          contentType: "class_quiz",
          contentId: quizId,
          snapshot: { ...input, id: quizId, classId, status: "published" }
        })
      : null;
    const status = moderation && moderation.state !== "published" ? "draft" : requestedStatus;
    await createClassQuiz({
      id: quizId,
      teacherId: teacher.id,
      classId,
      courseId: input.courseId,
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
      status
    });
    const quizzes = await listClassQuizzes(teacher.id, classId);
    const sms = status === "published"
      ? await sendQuizAssignmentMessages({
          teacherId: teacher.id,
          assignments: [{ id: quizId, classId }],
          startAt: input.startAt ?? null,
          deadline: input.deadline ?? null,
          quizUrl: (assignedClassId, assignedQuizId) => platformActionUrl(request, `/classes/${assignedClassId}/quizzes/${assignedQuizId}`)
        })
      : { sent: 0, failed: 0, skipped: 0 };
    if (moderation?.state === "published") await markModerationPublished(moderation.caseId);
    return NextResponse.json(
      { quizId, quizzes, sms, moderation },
      { status: moderation && moderation.state !== "published" ? 202 : 201 }
    );
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
    const current = (await listClassQuizzes(teacher.id, classId)).find((quiz) => quiz.id === input.quizId);
    if (!current) throw new Error("Quiz not found.");
    const moderation = input.status === "published"
      ? await moderateTeacherContent({
          teacherId: teacher.id,
          contentType: "class_quiz",
          contentId: input.quizId,
          snapshot: { ...current, ...input, classId, status: "published" }
        })
      : null;
    if (moderation && moderation.state !== "published") {
      return NextResponse.json({
        quizzes: await listClassQuizzes(teacher.id, classId),
        moderation
      }, { status: 202 });
    }
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
    if (moderation) await markModerationPublished(moderation.caseId);
    const quizzes = await listClassQuizzes(teacher.id, classId);
    const sms = input.status === "published" && current.status !== "published"
      ? await sendQuizAssignmentMessages({
          teacherId: teacher.id,
          assignments: [{ id: input.quizId, classId }],
          startAt: input.startAt ?? current.startAt ?? null,
          deadline: input.deadline ?? current.deadline ?? null,
          quizUrl: (assignedClassId, assignedQuizId) => platformActionUrl(request, `/classes/${assignedClassId}/quizzes/${assignedQuizId}`)
        })
      : { sent: 0, failed: 0, skipped: 0 };
    return NextResponse.json({ quizzes, moderation, sms });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update quiz." }, { status: 400 });
  }
}
