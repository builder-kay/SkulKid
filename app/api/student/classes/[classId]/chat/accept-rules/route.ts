import { NextResponse } from "next/server";
import { acceptClassChatRules, requireStudent } from "@/lib/classes/classroom-server";

export async function POST(_request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const student = await requireStudent();
    const { classId } = await context.params;
    await acceptClassChatRules({ studentId: student.id, classId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to accept the class chat rules." }, { status: 400 });
  }
}
