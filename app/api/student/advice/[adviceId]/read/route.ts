import { NextResponse } from "next/server";
import { markAdviceRead, requireStudent } from "@/lib/classes/classroom-server";

export async function POST(_: Request, context: { params: Promise<{ adviceId: string }> }) {
  try {
    const student = await requireStudent();
    const { adviceId } = await context.params;
    await markAdviceRead(student.id, adviceId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update advice." }, { status: 400 });
  }
}
