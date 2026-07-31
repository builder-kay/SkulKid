import { NextResponse } from "next/server";
import { getClassLeaderboard, requireTeacher } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const windowParam = new URL(request.url).searchParams.get("window");
    const window = windowParam === "week" ? "week" : "all_time";
    const admin = createAdminClient();
    const { data: classroom, error } = await admin
      .from("TeacherClass")
      .select("id,teacherId")
      .eq("id", classId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!classroom) throw new Error("Class not found.");
    if (classroom.teacherId !== teacher.id) {
      const { data: assignment } = await admin
        .from("ClassTeacherAssignment")
        .select("id")
        .eq("classId", classId)
        .eq("teacherId", teacher.id)
        .eq("status", "active")
        .maybeSingle();
      if (!assignment) throw new Error("You do not own this class.");
    }
    const leaderboard = await getClassLeaderboard(classId, undefined, window);
    return NextResponse.json({ leaderboard, window });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load leaderboard.";
    const status = message.includes("required") ? 401 : message.includes("not found") || message.includes("own") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
