import { NextResponse } from "next/server";
import { z } from "zod";
import { updateSignupFunnel } from "@/lib/auth/signup-funnel";

const schema = z.object({
  sessionId: z.string().uuid(),
  role: z.enum(["student", "teacher"]),
  step: z.number().int().min(1).max(5).optional(),
  event: z.enum(["started", "progressed", "otp_requested", "completed", "abandoned"])
});

export async function POST(request: Request) {
  try {
    await updateSignupFunnel(schema.parse(await request.json()));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Could not record signup progress."
    }, { status: 400 });
  }
}
