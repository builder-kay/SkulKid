import { NextResponse } from "next/server";
import { z } from "zod";
import { reportClassMessage, requireStudent } from "@/lib/classes/classroom-server";

const schema = z.object({
  messageId: z.string().uuid(),
  reason: z.enum(["bullying", "threat", "sexual_content", "personal_information", "spam", "other"]),
  details: z.string().trim().max(500).optional(),
  muteSender: z.boolean().default(true)
});

export async function POST(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const student = await requireStudent();
    const { classId } = await context.params;
    await reportClassMessage({ studentId: student.id, classId, ...schema.parse(await request.json()) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to report message." }, { status: 400 });
  }
}
