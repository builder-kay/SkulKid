import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { assignTeacherQuiz } from "@/lib/quizzes/teacher-quiz-server";
import { sendQuizAssignmentMessages } from "@/lib/quizzes/quiz-assignment-sms";
import { platformActionUrl } from "@/lib/auth/sms-links";

const schema = z.object({
  classIds: z.array(z.string().uuid()).min(1).max(50),
  startAt: z.string().datetime().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  offPlatformReward: z.string().trim().max(500).optional().default("")
}).superRefine((value, context) => {
  if (value.startAt && value.deadline && new Date(value.startAt) >= new Date(value.deadline)) {
    context.addIssue({ code: "custom", path: ["deadline"], message: "The end time must be after the start time." });
  }
  if (value.deadline && new Date(value.deadline).getTime() <= Date.now()) {
    context.addIssue({ code: "custom", path: ["deadline"], message: "The quiz end time must be in the future." });
  }
});
export async function POST(request: Request, context: { params: Promise<{ quizId: string }> }) {
  try {
    const teacher = await requireTeacher(); const { quizId } = await context.params;
    const input = schema.parse(await request.json());
    const assignments = await assignTeacherQuiz(teacher.id, quizId, [...new Set(input.classIds)], {
      startAt: input.startAt ?? null,
      deadline: input.deadline ?? null,
      offPlatformReward: input.offPlatformReward
    });
    const sms = await sendQuizAssignmentMessages({
      teacherId: teacher.id,
      assignments,
      startAt: input.startAt ?? null,
      deadline: input.deadline ?? null,
      quizUrl: (classId, assignedQuizId) => platformActionUrl(request, `/classes/${classId}/quizzes/${assignedQuizId}`)
    });
    return NextResponse.json({ assignments, sms }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to assign quiz." }, { status: 400 }); }
}
