import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readAdminLessonsServer } from "@/lib/admin/lesson-library-server";

export async function GET() {
  try {
    const admin = createAdminClient();
    const [{ data: subjects, error }, lessons] = await Promise.all([
      admin.from("Subject").select("id, name, slug, updatedAt").order("name"),
      readAdminLessonsServer()
    ]);
    if (error) throw error;

    const courses = (subjects ?? []).map((subject) => {
      const subjectLessons = lessons.filter((lesson) => lesson.subject === subject.slug || lesson.subject === subject.id || lesson.subject === subject.name.toLowerCase());
      return {
        id: subject.id,
        title: subject.name,
        subject: subject.name,
        grade: null as number | null,
        status: subjectLessons.some((lesson) => lesson.status === "published") ? "live" : "draft",
        lessonCount: subjectLessons.length,
        publishedLessonCount: subjectLessons.filter((lesson) => lesson.status === "published").length,
        updatedAt: subject.updatedAt ?? null
      };
    });

    return NextResponse.json({ courses });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load courses." }, { status: 500 });
  }
}
