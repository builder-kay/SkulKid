import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clearClassMessageReaction,
  requireStudent,
  setClassMessageReaction
} from "@/lib/classes/classroom-server";

const schema = z.object({
  reaction: z.enum(["like", "helpful", "celebrate"])
});

export async function POST(request: Request, context: { params: Promise<{ classId: string; messageId: string }> }) {
  try {
    const student = await requireStudent();
    const { classId, messageId } = await context.params;
    const input = schema.parse(await request.json());
    const summary = await setClassMessageReaction({
      studentId: student.id,
      classId,
      messageId,
      reaction: input.reaction
    });
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save sticker." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ classId: string; messageId: string }> }) {
  try {
    const student = await requireStudent();
    const { classId, messageId } = await context.params;
    const summary = await clearClassMessageReaction({
      studentId: student.id,
      classId,
      messageId
    });
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to clear sticker." },
      { status: 400 }
    );
  }
}
