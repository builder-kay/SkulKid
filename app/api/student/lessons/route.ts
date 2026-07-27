import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { publishedLessonsFromRecords } from "@/lib/lessons/published-lesson-records";
import { findApprovedPublicLesson, listApprovedPublicLearningSnapshots } from "@/lib/public-learning/publication-server";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const lessonId = new URL(request.url).searchParams.get("id")?.trim();
  try {
    if (lessonId) {
      const record = await findApprovedPublicLesson(lessonId);
      const lesson = record ? publishedLessonsFromRecords([record])[0] ?? null : null;
      return NextResponse.json(
        { lesson },
        { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } }
      );
    }
    const publications = await listApprovedPublicLearningSnapshots();
    const records = publications.flatMap(({ snapshot }) => snapshot.lessons);
    const lessons = publishedLessonsFromRecords(records);
    return NextResponse.json(
      { lessons: lessons.map((lesson) => ({ ...lesson, blocks: [] })) },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load Public Learning lessons." }, { status: 500 });
  }
}
