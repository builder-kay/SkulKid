import { NextResponse } from "next/server";
import { z } from "zod";
import { allowUsernameAvailabilityCheck } from "@/lib/auth/rate-limit";
import { findSupabaseUserByUsername, normalizeUsername } from "@/lib/auth/student-identity";

const schema = z.object({ username: z.string().trim().min(3).max(20) });

export async function POST(request: Request) {
  try {
    const requester = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const input = schema.parse(await request.json());
    const username = normalizeUsername(input.username);
    if (!allowUsernameAvailabilityCheck(`${requester}:${username}`)) {
      return NextResponse.json({ error: "Too many username checks. Please wait a few minutes." }, { status: 429 });
    }
    const existing = await findSupabaseUserByUsername(username);
    return NextResponse.json({ available: !existing });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to check that username."
    }, { status: 400 });
  }
}
