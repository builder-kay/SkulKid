import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAppRole } from "@/lib/auth/roles";

const courseSchema = z.object({
  action: z.literal("save_course"),
  id: z.string().min(1).optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(1).max(140),
  description: z.string().trim().min(2).max(1000),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  coverUrl: z.string().trim().url().nullable().or(z.literal("").transform(() => null)),
  gradeLevels: z.array(z.number().int().min(1).max(6)).min(1),
  status: z.enum(["draft", "published"]),
  icon: z.string().trim().max(60).optional(),
  audience: z.enum(["class_only", "public", "both"]),
  classIds: z.array(z.string().uuid()).max(50)
});
const unitSchema = z.object({
  action: z.literal("save_unit"),
  courseId: z.string().min(1),
  id: z.string().min(1).optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500),
  requiresPrevious: z.boolean().default(false)
});
const topicSchema = z.object({
  action: z.literal("save_topic"),
  unitId: z.string().min(1),
  id: z.string().min(1).optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500)
});
const strandOrderSchema = z.object({
  action: z.literal("reorder_strands"),
  courseId: z.string().min(1),
  strandIds: z.array(z.string().min(1)).min(1).max(200)
});
const subStrandOrderSchema = z.object({
  action: z.literal("reorder_sub_strands"),
  strandId: z.string().min(1),
  subStrandIds: z.array(z.string().min(1)).min(1).max(200)
});
const statusSchema = z.object({
  action: z.literal("set_status"),
  courseId: z.string().min(1),
  status: z.enum(["draft", "published"])
});
const lessonPlacementSchema = z.object({
  action: z.enum(["attach_lesson", "detach_lesson", "reorder_lessons"]),
  courseId: z.string().min(1),
  lessonId: z.string().min(1).optional(),
  unitId: z.string().min(1).nullable().optional(),
  topicId: z.string().min(1).nullable().optional(),
  unitTitle: z.string().trim().max(120).optional(),
  lessonIds: z.array(z.string().min(1)).max(200).optional()
});
const mutationSchema = z.union([courseSchema, unitSchema, topicSchema, strandOrderSchema, subStrandOrderSchema, statusSchema, lessonPlacementSchema]);

function safeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "course";
}

async function assertOwnedCourse(courseId: string, teacherId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("Subject").select("id,createdBy").eq("id", courseId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.createdBy !== teacherId) throw new Error("You can only change courses you created.");
}

export async function GET() {
  try {
    const teacher = await requireTeacher();
    const admin = createAdminClient();
    const [coursesResult, unitsResult, topicsResult, lessonsResult, classesResult] = await Promise.all([
      admin.from("Subject").select("id,name,slug,description,icon,colourToken,coverUrl,gradeLevels,order,status,visibility,ownerClassId,createdBy,currentPublicRevisionId").order("order"),
      admin.from("Unit").select("id,subjectId,name,slug,description,order,requiresPrevious").order("order"),
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
        requiresPrevious: Boolean(unit.requiresPrevious),
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
        ,createdBy: course.createdBy ? String(course.createdBy) : null
        ,canManage: course.createdBy === teacher.id || isAdmin
        ,currentPublicRevisionId: course.currentPublicRevisionId ? String(course.currentPublicRevisionId) : null
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load courses.";
    const status = message.includes("required") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const teacher = await requireTeacher();
    const input = mutationSchema.parse(await request.json());
    const admin = createAdminClient();

    if (input.action === "save_course") {
      if (input.audience !== "public" && !input.classIds.length) {
        throw new Error("Choose at least one class for this course.");
      }
      if (input.id) await assertOwnedCourse(input.id, teacher.id);
      const requestedIds = input.audience === "public" ? [] : input.classIds;
      if (requestedIds.length) {
        const { data: classes, error } = await admin.from("TeacherClass")
          .select("id")
          .eq("teacherId", teacher.id)
          .eq("status", "active")
          .in("id", requestedIds);
        if (error) throw new Error(error.message);
        if ((classes ?? []).length !== requestedIds.length) throw new Error("One or more selected classes do not belong to you.");
      }

      const id = input.id ?? `course-${crypto.randomUUID()}`;
      const { data: existing } = input.id
        ? await admin.from("Subject").select("order,status,currentPublicRevisionId").eq("id", id).maybeSingle()
        : { data: null };
      const { count } = input.id
        ? { count: null }
        : await admin.from("Subject").select("id", { count: "exact", head: true });
      if (input.status === "published" && input.id) {
        const { count: lessons } = await admin.from("AdminLessonRecord")
          .select("id", { count: "exact", head: true })
          .eq("courseId", id)
          .eq("status", "published");
        if (!lessons) throw new Error("Publish at least one lesson before making this course available.");
      }
      const { error: saveError } = await admin.from("Subject").upsert({
        id,
        name: input.name,
        slug: safeSlug(input.slug || input.name),
        description: input.description,
        icon: input.icon ?? "book-open",
        colourToken: input.color,
        coverUrl: input.coverUrl || null,
        gradeLevels: [...new Set(input.gradeLevels)].sort(),
        order: Number(existing?.order ?? count ?? 0),
        status: existing?.currentPublicRevisionId
          ? "ACTIVE"
          : input.status === "published" ? "ACTIVE" : "ARCHIVED",
        visibility: input.audience === "class_only" ? "class" : "platform",
        ownerClassId: input.audience === "class_only" ? requestedIds[0] : null,
        createdBy: teacher.id,
        updatedAt: new Date().toISOString()
      }, { onConflict: "id" });
      if (saveError) throw new Error(saveError.message);

      const { data: ownedClasses } = await admin.from("TeacherClass").select("id").eq("teacherId", teacher.id);
      const ownedClassIds = (ownedClasses ?? []).map((item) => String(item.id));
      if (ownedClassIds.length) {
        const { error } = await admin.from("ClassCourseAssignment").delete().eq("courseId", id).in("classId", ownedClassIds);
        if (error) throw new Error(error.message);
      }
      if (requestedIds.length) {
        const { error } = await admin.from("ClassCourseAssignment").insert(
          requestedIds.map((classId) => ({ classId, courseId: id, note: "Course audience assignment" }))
        );
        if (error) throw new Error(error.message);
      }
      if (input.audience === "class_only") {
        const { error } = await admin.rpc("unpublish_public_learning_course", {
          selected_course_id: id,
          archive_course: false
        });
        if (error) throw new Error(error.message);
      }
      return NextResponse.json({ id }, { status: input.id ? 200 : 201 });
    }

    if (input.action === "save_unit") {
      await assertOwnedCourse(input.courseId, teacher.id);
      const { count } = input.id ? { count: null } : await admin.from("Unit").select("id", { count: "exact", head: true }).eq("subjectId", input.courseId);
      const id = input.id ?? `unit-${crypto.randomUUID()}`;
      const { error } = await admin.from("Unit").upsert({
        id,
        subjectId: input.courseId,
        name: input.title,
        slug: safeSlug(input.title),
        description: input.description,
        requiresPrevious: input.requiresPrevious,
        order: count ?? 0,
        updatedAt: new Date().toISOString()
      }, { onConflict: "id" });
      if (error) throw new Error(error.message);
      return NextResponse.json({ id });
    }

    if (input.action === "save_topic") {
      const { data: unit, error: unitError } = await admin.from("Unit").select("subjectId").eq("id", input.unitId).maybeSingle();
      if (unitError) throw new Error(unitError.message);
      if (!unit) throw new Error("Module not found.");
      await assertOwnedCourse(String(unit.subjectId), teacher.id);
      const { count } = input.id ? { count: null } : await admin.from("Topic").select("id", { count: "exact", head: true }).eq("unitId", input.unitId);
      const id = input.id ?? `topic-${crypto.randomUUID()}`;
      const { error } = await admin.from("Topic").upsert({
        id,
        unitId: input.unitId,
        name: input.title,
        slug: safeSlug(input.title),
        description: input.description,
        order: count ?? 0,
        updatedAt: new Date().toISOString()
      }, { onConflict: "id" });
      if (error) throw new Error(error.message);
      return NextResponse.json({ id });
    }

    if (input.action === "reorder_strands") {
      await assertOwnedCourse(input.courseId, teacher.id);
      const uniqueIds = [...new Set(input.strandIds)];
      if (uniqueIds.length !== input.strandIds.length) throw new Error("Each strand may appear only once.");
      const { data: strands, error } = await admin.from("Unit").select("id").eq("subjectId", input.courseId).in("id", uniqueIds);
      if (error) throw new Error(error.message);
      if ((strands ?? []).length !== uniqueIds.length) throw new Error("Every strand must belong to this subject.");
      const results = await Promise.all(uniqueIds.map((id, order) => admin.from("Unit").update({ order, updatedAt: new Date().toISOString() }).eq("id", id)));
      const failure = results.find((result) => result.error)?.error;
      if (failure) throw new Error(failure.message);
      return NextResponse.json({ ok: true });
    }

    if (input.action === "reorder_sub_strands") {
      const { data: strand, error: strandError } = await admin.from("Unit").select("subjectId").eq("id", input.strandId).maybeSingle();
      if (strandError) throw new Error(strandError.message);
      if (!strand) throw new Error("Strand not found.");
      await assertOwnedCourse(String(strand.subjectId), teacher.id);
      const uniqueIds = [...new Set(input.subStrandIds)];
      if (uniqueIds.length !== input.subStrandIds.length) throw new Error("Each sub-strand may appear only once.");
      const { data: subStrands, error } = await admin.from("Topic").select("id").eq("unitId", input.strandId).in("id", uniqueIds);
      if (error) throw new Error(error.message);
      if ((subStrands ?? []).length !== uniqueIds.length) throw new Error("Every sub-strand must belong to this strand.");
      const results = await Promise.all(uniqueIds.map((id, order) => admin.from("Topic").update({ order, updatedAt: new Date().toISOString() }).eq("id", id)));
      const failure = results.find((result) => result.error)?.error;
      if (failure) throw new Error(failure.message);
      return NextResponse.json({ ok: true });
    }

    if (input.action === "set_status") {
      await assertOwnedCourse(input.courseId, teacher.id);
      if (input.status === "published") {
        const { count } = await admin.from("AdminLessonRecord")
          .select("id", { count: "exact", head: true })
          .eq("courseId", input.courseId)
          .eq("status", "published");
        if (!count) throw new Error("Publish at least one lesson before making this course available.");
      }
      const { error } = await admin.from("Subject").update({
        status: input.status === "published" ? "ACTIVE" : "ARCHIVED",
        updatedAt: new Date().toISOString()
      }).eq("id", input.courseId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    await assertOwnedCourse(input.courseId, teacher.id);
    if (input.action === "reorder_lessons") {
      const ids = [...new Set(input.lessonIds ?? [])];
      const { data: ownedLessons } = await admin.from("AdminLessonRecord").select("id").eq("createdBy", teacher.id).in("id", ids);
      if ((ownedLessons ?? []).length !== ids.length) throw new Error("You can only reorder lessons you created.");
      const results = await Promise.all(ids.map((id, position) => admin.from("AdminLessonRecord").update({
        courseId: input.courseId,
        unitId: input.unitId ?? null,
        position
      }).eq("id", id)));
      const failure = results.find((result) => result.error)?.error;
      if (failure) throw new Error(failure.message);
      return NextResponse.json({ ok: true });
    }

    if (!input.lessonId) throw new Error("Choose a lesson.");
    const { data: lesson } = await admin.from("AdminLessonRecord").select("id,createdBy,record").eq("id", input.lessonId).maybeSingle();
    if (!lesson || lesson.createdBy !== teacher.id) throw new Error("You can only move lessons you created.");
    const record = lesson.record && typeof lesson.record === "object" ? lesson.record as Record<string, unknown> : {};
    const detach = input.action === "detach_lesson";
    const { error } = await admin.from("AdminLessonRecord").update({
      courseId: input.courseId,
      unitId: detach ? null : input.unitId ?? null,
      topicId: detach ? null : input.topicId ?? null,
      record: {
        ...record,
        courseId: input.courseId,
        unitId: detach ? null : input.unitId ?? null,
        ...(input.unitTitle ? { unit: input.unitTitle, chapter: input.unitTitle } : {})
      }
    }).eq("id", input.lessonId);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update course content.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 400 });
  }
}
