import { NextResponse } from "next/server";
import { getStudentDashboardActivity, requireStudent } from "@/lib/classes/classroom-server";

export async function GET() {
  try {
    const student = await requireStudent();
    return NextResponse.json(
      await getStudentDashboardActivity(student.id),
      { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load class activity.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 400 });
  }
}
