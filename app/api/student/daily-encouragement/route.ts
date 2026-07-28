import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/classes/classroom-server";
import {
  currentAccraDateKey,
  getDailyEncouragement
} from "@/lib/student/daily-encouragement-server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  try {
    await requireStudent();
    const date = currentAccraDateKey();
    const message = await getDailyEncouragement(date);
    return NextResponse.json(
      { date, message },
      { headers: { "Cache-Control": "private, max-age=300" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Daily encouragement is unavailable.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("required") ? 401 : 500 }
    );
  }
}
