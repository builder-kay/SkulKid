import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Subject, Topic, Unit } from "@/types/subject";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const admin = createAdminClient();
  const [coursesResult, unitsResult, topicsResult, lessonsResult] = await Promise.all([
    admin.from("Subject").select("id,name,slug,description,colourToken,coverUrl,gradeLevels,order").eq("status", "ACTIVE").order("order"),
    admin.from("Unit").select("id,subjectId,name,slug,description,order").order("order"),
    admin.from("Topic").select("id,unitId,name,slug,description,order").order("order"),
    admin.from("AdminLessonRecord").select("id,courseId,topicId").eq("status", "published").order("position")
  ]);
  const error = coursesResult.error ?? unitsResult.error ?? topicsResult.error ?? lessonsResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const lessons = lessonsResult.data ?? [];
  const liveCourseIds = new Set(lessons.map((lesson) => String(lesson.courseId ?? "")));
  const topicsByUnit = new Map<string, Topic[]>();
  for (const topic of topicsResult.data ?? []) {
    const unitId = String(topic.unitId);
    const mapped: Topic = {
      id: String(topic.id),
      unitId,
      title: String(topic.name),
      slug: String(topic.slug),
      description: String(topic.description),
      order: Number(topic.order),
      lessonIds: lessons.filter((lesson) => lesson.topicId === topic.id).map((lesson) => String(lesson.id))
    };
    topicsByUnit.set(unitId, [...(topicsByUnit.get(unitId) ?? []), mapped]);
  }

  const unitsByCourse = new Map<string, Unit[]>();
  for (const unit of unitsResult.data ?? []) {
    const courseId = String(unit.subjectId);
    const mapped: Unit = {
      id: String(unit.id),
      subjectId: courseId,
      title: String(unit.name),
      slug: String(unit.slug),
      description: String(unit.description),
      order: Number(unit.order),
      topics: topicsByUnit.get(String(unit.id)) ?? []
    };
    unitsByCourse.set(courseId, [...(unitsByCourse.get(courseId) ?? []), mapped]);
  }

  const courses: Subject[] = (coursesResult.data ?? [])
    .filter((course) => liveCourseIds.has(String(course.id)))
    .map((course) => ({
      id: String(course.id),
      name: String(course.name),
      slug: String(course.slug),
      description: String(course.description),
      color: String(course.colourToken),
      coverUrl: typeof course.coverUrl === "string" ? course.coverUrl : null,
      gradeLevels: Array.isArray(course.gradeLevels) ? course.gradeLevels.map(Number) : [],
      units: unitsByCourse.get(String(course.id)) ?? []
    }));

  return NextResponse.json({ courses }, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" }
  });
}
