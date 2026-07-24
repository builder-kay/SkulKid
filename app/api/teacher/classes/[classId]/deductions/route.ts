import { NextResponse } from "next/server";
import { z } from "zod";
import { deductStudentPoints, requireTeacher } from "@/lib/classes/classroom-server";

const schema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().int().min(1).max(50),
  reason: z.string().trim().min(12).max(600)
});

export async function POST(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const input = schema.parse(await request.json());
    const deduction = await deductStudentPoints({ teacherId: teacher.id, classId, ...input });
    return NextResponse.json({ deduction }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to deduct points." },
      { status: 400 }
    );
  }
}
