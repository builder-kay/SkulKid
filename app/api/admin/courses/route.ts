import { NextResponse } from "next/server";
import { z } from "zod";
import { adminContext, auditAdminAction, listAllAuthUsers } from "@/lib/admin/admin-server";
import { deriveCourseAudience } from "@/lib/public-learning/rules";

const actionSchema = z.object({
  courseId: z.string().min(1),
  action: z.enum(["unpublish", "archive"]),
  reason: z.string().trim().min(4).max(500)
});

function nameFor(user: { id: string; user_metadata?: Record<string, unknown>; email?: string | null; phone?: string | null } | undefined) {
  const value = user?.user_metadata?.display_name;
  return typeof value === "string" && value.trim() ? value.trim() : user?.email || user?.phone || "SkulKid";
}

export async function GET() {
  try {
    const { admin } = await adminContext();
    const [{ data: subjects, error }, { data: lessons }, { data: assignments }, { data: classes }, { data: revisions }, users] = await Promise.all([
      admin.from("Subject").select("id,name,slug,description,gradeLevels,status,visibility,ownerClassId,createdBy,currentPublicRevisionId,updatedAt").order("updatedAt", { ascending: false }),
      admin.from("AdminLessonRecord").select("id,courseId,status"),
      admin.from("ClassCourseAssignment").select("courseId,classId"),
      admin.from("TeacherClass").select("id,name"),
      admin.from("PublicLearningRevision").select("id,courseId,version,status,submittedAt,publishedAt,reviewNote").order("version", { ascending: false }),
      listAllAuthUsers()
    ]);
    if (error) throw new Error(error.message);
    const classById = new Map((classes ?? []).map((item) => [String(item.id), String(item.name)]));
    const userById = new Map(users.map((user) => [user.id, user]));
    const courses = (subjects ?? []).map((subject) => {
      const courseLessons = (lessons ?? []).filter((lesson) => lesson.courseId === subject.id);
      const classIds = (assignments ?? []).filter((item) => item.courseId === subject.id).map((item) => String(item.classId));
      const courseRevisions = (revisions ?? []).filter((revision) => revision.courseId === subject.id);
      const latest = courseRevisions[0] ?? null;
      const current = courseRevisions.find((revision) => revision.id === subject.currentPublicRevisionId) ?? null;
      const audience = deriveCourseAudience(subject.visibility, classIds);
      return {
        id: String(subject.id),
        title: String(subject.name),
        description: String(subject.description ?? ""),
        gradeLevels: Array.isArray(subject.gradeLevels) ? subject.gradeLevels.map(Number) : [],
        courseStatus: subject.status === "ACTIVE" ? "active" : "archived",
        audience,
        teacherName: nameFor(userById.get(String(subject.createdBy))),
        classNames: classIds.map((id) => classById.get(id) ?? "Class"),
        lessonCount: courseLessons.length,
        publishedLessonCount: courseLessons.filter((lesson) => lesson.status === "published").length,
        publicationState: latest?.status ?? (current ? "approved" : "unpublished"),
        currentVersion: current ? Number(current.version) : null,
        latestVersion: latest ? Number(latest.version) : null,
        reviewNote: (latest?.reviewNote as string | null) ?? null,
        updatedAt: subject.updatedAt as string
      };
    });
    return NextResponse.json({ courses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load courses.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { actor, admin, requestId } = await adminContext();
    const input = actionSchema.parse(await request.json());
    const { data: before, error: readError } = await admin.from("Subject")
      .select("id,name,status,currentPublicRevisionId")
      .eq("id", input.courseId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!before) throw new Error("Course not found.");
    const { error } = await admin.rpc("unpublish_public_learning_course", {
      selected_course_id: input.courseId,
      archive_course: input.action === "archive"
    });
    if (error) throw new Error(error.message);
    await auditAdminAction({
      actorId: actor.id,
      action: input.action === "archive" ? "course.archived" : "public_learning.unpublished",
      targetType: "course",
      targetId: input.courseId,
      reason: input.reason,
      before,
      after: { currentPublicRevisionId: null, ...(input.action === "archive" ? { status: "ARCHIVED" } : {}) },
      requestId
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update the course.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 400 });
  }
}
