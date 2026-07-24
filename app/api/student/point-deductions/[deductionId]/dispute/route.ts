import { NextResponse } from "next/server";
import { z } from "zod";
import { disputePointDeduction, requireStudent } from "@/lib/classes/classroom-server";

const schema = z.object({ message: z.string().trim().min(12).max(600) });

export async function POST(request: Request, context: { params: Promise<{ deductionId: string }> }) {
  try {
    const student = await requireStudent();
    const { deductionId } = await context.params;
    const { message } = schema.parse(await request.json());
    await disputePointDeduction({ studentId: student.id, deductionId, message });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to report deduction." },
      { status: 400 }
    );
  }
}
