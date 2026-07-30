import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { getTeacherClassPerformance } from "@/lib/classes/performance-server";

const querySchema = z.object({
  range: z.enum(["30d", "90d", "term"]).default("30d"),
  metric: z.enum(["academic", "completion", "activity", "class_xp"]).default("academic"),
  subjectId: z.string().trim().max(160).optional(),
  strandId: z.string().trim().max(160).optional()
});

export async function GET(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const url = new URL(request.url);
    const input = querySchema.parse(Object.fromEntries(url.searchParams));
    const performance = await getTeacherClassPerformance({ teacherId: teacher.id, classId, ...input });
    return NextResponse.json(performance, { headers: { "Cache-Control": "private, max-age=30" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load performance.";
    return NextResponse.json({ error: message }, { status: message.includes("own") || message.includes("not found") ? 404 : 400 });
  }
}
