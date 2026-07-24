import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readAdminLessonsServer } from "@/lib/admin/lesson-library-server";

export async function GET() {
  try {
    const admin = createAdminClient();
    const [{ count: students }, courses, lessons, { data: authUsers }] = await Promise.all([
      admin.from("Student").select("id", { count: "exact", head: true }),
      admin.from("Subject").select("id", { count: "exact", head: true }),
      readAdminLessonsServer(),
      admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    ]);

    const roles = (authUsers?.users ?? []).map((user) => user.app_metadata?.role);
    const teachers = roles.filter((role) => role === "teacher").length;
    const admins = roles.filter((role) => role === "admin").length;
    const publishedLessons = lessons.filter((lesson) => lesson.status === "published").length;
    const draftLessons = lessons.filter((lesson) => lesson.status === "draft").length;

    return NextResponse.json({
      students: students ?? 0,
      teachers,
      admins,
      courses: courses.count ?? 0,
      publishedLessons,
      draftLessons,
      flaggedLessons: draftLessons
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load overview." }, { status: 500 });
  }
}
