import { NextResponse } from "next/server";
import { acknowledgeAdvice, requireStudent } from "@/lib/classes/classroom-server";

export async function POST(_: Request, context: { params: Promise<{ adviceId: string }> }) {
  try {
    const student = await requireStudent();
    const { adviceId } = await context.params;
    await acknowledgeAdvice(student.id, adviceId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to acknowledge feedback." }, { status: 400 });
  }
}
