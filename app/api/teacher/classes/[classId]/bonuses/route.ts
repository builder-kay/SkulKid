import { NextResponse } from "next/server";
import { z } from "zod";
import { grantStudentBonusXp, requireTeacher, sendClassShoutOut } from "@/lib/classes/classroom-server";

const schema = z.object({
  studentId: z.string().uuid(),
  amount: z.union([z.literal(10), z.literal(20), z.literal(50)]).optional(),
  reason: z.string().trim().min(4).max(600),
  shoutOutOnly: z.boolean().optional()
});

export async function POST(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const input = schema.parse(await request.json());
    if (input.shoutOutOnly || !input.amount) {
      await sendClassShoutOut({
        teacherId: teacher.id,
        classId,
        studentId: input.studentId,
        message: input.reason
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    }
    const bonus = await grantStudentBonusXp({
      teacherId: teacher.id,
      classId,
      studentId: input.studentId,
      amount: input.amount,
      reason: input.reason
    });
    return NextResponse.json({ bonus }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send surprise." },
      { status: 400 }
    );
  }
}
