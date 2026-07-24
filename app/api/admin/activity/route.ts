import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readAdminLessonsServer } from "@/lib/admin/lesson-library-server";

export async function GET() {
  try {
    const admin = createAdminClient();
    const [lessons, { data: authUsers }] = await Promise.all([
      readAdminLessonsServer(),
      admin.auth.admin.listUsers({ page: 1, perPage: 50 })
    ]);

    const lessonEvents = lessons
      .slice()
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 20)
      .map((lesson) => ({
        id: `lesson-${lesson.id}`,
        type: "lesson",
        title: `${lesson.status === "published" ? "Published" : "Updated"} lesson`,
        detail: `${lesson.title} · ${lesson.subject}`,
        at: lesson.updatedAt
      }));

    const userEvents = (authUsers?.users ?? [])
      .slice()
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 10)
      .map((user) => ({
        id: `user-${user.id}`,
        type: "user",
        title: "New account",
        detail: `${user.phone || user.email || user.id} joined as ${user.app_metadata?.role || "student"}`,
        at: user.created_at
      }));

    const events = [...lessonEvents, ...userEvents]
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 30);

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load activity." }, { status: 500 });
  }
}
