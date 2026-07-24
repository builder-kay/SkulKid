import { NextResponse } from "next/server";
import { z } from "zod";
import { createClassAdvice, requireTeacher } from "@/lib/classes/classroom-server";

const schema = z.object({
  studentId: z.string().uuid(),
  message: z.string().trim().min(4).max(600),
  suggestionType: z.enum(["class_adventure", "platform_adventure", "general"]).default("general")
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
      suggestionType: input.suggestionType
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send advice." }, { status: 400 });
  }
}
