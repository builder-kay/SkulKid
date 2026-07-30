import { NextResponse } from "next/server";
import { z } from "zod";
import { createClassAdvice, requireTeacher } from "@/lib/classes/classroom-server";

const schema = z.object({
  studentId: z.string().uuid(),
  message: z.string().trim().min(4).max(600),
  suggestionType: z.enum(["class_adventure", "platform_adventure", "general"]).default("general"),
  title: z.string().trim().min(3).max(120).nullable().optional(),
  feedbackCategory: z.enum(["celebration", "practice", "intervention"]).nullable().optional(),
  priority: z.enum(["low", "normal", "high"]).nullable().optional(),
  recommendedActions: z.array(z.object({ label: z.string().trim().min(2).max(160), href: z.string().trim().max(300).optional() })).max(5).optional(),
  evidenceSnapshot: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  followUpStatus: z.enum(["not_required", "open"]).optional(),
  dueAt: z.string().datetime().nullable().optional()
});

export async function POST(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const input = schema.parse(await request.json());
    await createClassAdvice({
      teacherId: teacher.id,
      classId,
      studentId: input.studentId,
      message: input.message,
      suggestionType: input.suggestionType,
      title: input.title,
      feedbackCategory: input.feedbackCategory,
      priority: input.priority,
      recommendedActions: input.recommendedActions,
      evidenceSnapshot: input.evidenceSnapshot,
      followUpStatus: input.followUpStatus,
      dueAt: input.dueAt
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send advice." }, { status: 400 });
  }
}
