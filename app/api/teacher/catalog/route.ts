import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAppRole } from "@/lib/auth/roles";

export async function GET() {
  try {
    const teacher = await requireTeacher();
    const admin = createAdminClient();
    const [coursesResult, unitsResult, topicsResult, lessonsResult, classesResult] = await Promise.all([
      admin.from("Subject").select("id,name,slug,description,icon,colourToken,coverUrl,gradeLevels,order,status,visibility,ownerClassId").order("order"),
      admin.from("Unit").select("id,subjectId,name,slug,description,order").order("order"),
      admin.from("Topic").select("id,unitId,name,slug,description,order").order("order"),
      admin.from("AdminLessonRecord").select("id,courseId,unitId,topicId,status").eq("status", "published").order("position"),
      resolveAppRole(teacher.app_metadata?.role) === "admin"
        ? Promise.resolve({ data: [] as Array<{ id: string }>, error: null })
        : admin.from("TeacherClass").select("id").eq("teacherId", teacher.id)
    ]);
    const error = coursesResult.error ?? unitsResult.error ?? topicsResult.error ?? lessonsResult.error ?? classesResult.error;
    if (error) throw new Error(error.message);

    const lessons = lessonsResult.data ?? [];
    const topicsByUnit = new Map<string, Array<{
      id: string;
      unitId: string;
      title: string;
      slug: string;
      description: string;
      order: number;
      lessonIds: string[];
    }>>();
    for (const topic of topicsResult.data ?? []) {
      const unitId = String(topic.unitId);
      const mapped = {
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

    const unitsByCourse = new Map<string, Array<{
      id: string;
      subjectId: string;
      title: string;
      slug: string;
      description: string;
      order: number;
      topics: ReturnType<typeof topicsByUnit.get> extends infer T ? Exclude<T, undefined> : never;
    }>>();
    for (const unit of unitsResult.data ?? []) {
      const subjectId = String(unit.subjectId);
      const mapped = {
        id: String(unit.id),
        subjectId,
        title: String(unit.name),
        slug: String(unit.slug),
        description: String(unit.description),
        order: Number(unit.order),
        topics: topicsByUnit.get(String(unit.id)) ?? []
      };
      unitsByCourse.set(subjectId, [...(unitsByCourse.get(subjectId) ?? []), mapped]);
    }

    const ownedClassIds = new Set((classesResult.data ?? []).map((item) => String(item.id)));
    const isAdmin = resolveAppRole(teacher.app_metadata?.role) === "admin";
    const visible = (coursesResult.data ?? []).filter((course) =>
      course.visibility !== "class" || isAdmin || ownedClassIds.has(String(course.ownerClassId))
    );

    return NextResponse.json({
      courses: visible.map((course) => ({
        id: String(course.id),
        name: String(course.name),
        slug: String(course.slug),
        description: String(course.description),
        color: String(course.colourToken),
        coverUrl: typeof course.coverUrl === "string" ? course.coverUrl : null,
        gradeLevels: Array.isArray(course.gradeLevels) ? course.gradeLevels.map(Number) : [],
        units: unitsByCourse.get(String(course.id)) ?? [],
        status: course.status === "ACTIVE" ? "published" : "draft",
        order: Number(course.order),
        icon: String(course.icon),
        visibility: course.visibility === "class" ? "class" : "platform",
        ownerClassId: course.ownerClassId ? String(course.ownerClassId) : null
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load courses.";
    const status = message.includes("required") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
