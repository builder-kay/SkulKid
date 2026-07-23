import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AdminLessonRecord } from "@/lib/admin/lesson-library";
import { publishedLessonsFromRecords } from "@/lib/lessons/published-lesson-records";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const lessonId = new URL(request.url).searchParams.get("id")?.trim();
  let query = createAdminClient()
    .from("AdminLessonRecord")
    .select("record,courseId,unitId,topicId")
    .eq("status", "published")
    .order("subject")
    .order("position");
  if (lessonId) query = query.eq("id", lessonId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const records = (data ?? []).map((row) => ({
    ...(row.record as AdminLessonRecord),
    courseId: row.courseId,
    unitId: row.unitId,
    topicId: row.topicId
  }));
  const lessons = publishedLessonsFromRecords(records);

  if (lessonId) {
    return NextResponse.json(
      { lesson: lessons.find((lesson) => lesson.id === lessonId) ?? null },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } }
    );
  }

  return NextResponse.json(
    { lessons: lessons.map((lesson) => ({ ...lesson, blocks: [] })) },
    { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } }
  );
}
