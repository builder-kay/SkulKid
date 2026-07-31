import { NextResponse } from "next/server";
import { z } from "zod";
import { crownWeeklyHelper, requireTeacher } from "@/lib/classes/classroom-server";

const schema = z.object({
  studentId: z.string().uuid(),
  note: z.string().trim().max(600).optional()
});

export async function POST(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const input = schema.parse(await request.json());
    const result = await crownWeeklyHelper({ teacherId: teacher.id, classId, ...input });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to crown Helper of the Week." },
      { status: 400 }
    );
  }
}
