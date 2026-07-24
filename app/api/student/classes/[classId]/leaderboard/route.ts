import { NextResponse } from "next/server";
import { getClassLeaderboard, requireStudent } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const student = await requireStudent();
    const { classId } = await context.params;
    const admin = createAdminClient();
    const { data: membership, error } = await admin
      .from("ClassMembership")
      .select("id")
      .eq("classId", classId)
      .eq("studentId", student.id)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!membership) throw new Error("Join this class first.");
    const leaderboard = await getClassLeaderboard(classId, student.id);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load leaderboard.";
    const status = message.includes("required") ? 401 : message.includes("Join") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
