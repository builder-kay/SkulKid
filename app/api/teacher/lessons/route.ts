import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import type { AdminLessonRecord } from "@/lib/admin/lesson-library";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAppRole } from "@/lib/auth/roles";
import { markModerationPublished, moderateTeacherContent } from "@/lib/moderation/teacher-content-server";

const lessonSchema = z.object({
  id: z.string().min(1),
  subject: z.enum(["mathematics", "english-language", "science"]),
  classId: z.string().uuid().nullable().optional(),
  courseId: z.string().min(1),
  unitId: z.string().min(1).nullable().optional(),
  topicId: z.string().min(1).nullable().optional(),
  status: z.enum(["draft", "published"]),
  title: z.string().trim().min(2).max(180),
  updatedAt: z.string().min(1)
}).passthrough();

export async function GET() {
  try {
    const teacher = await requireTeacher();
    const admin = createAdminClient();
    let query = admin
      .from("AdminLessonRecord")
      .select("record,classId,courseId,unitId,topicId,createdBy")
      .order("subject")
      .order("position");
    if (resolveAppRole(teacher.app_metadata?.role) !== "admin") query = query.eq("createdBy", teacher.id);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return NextResponse.json({
      lessons: (data ?? []).map((row) => ({
        ...(row.record as AdminLessonRecord),
        classId: row.classId,
        courseId: row.courseId,
        unitId: row.unitId,
        topicId: row.topicId,
        createdBy: row.createdBy
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load lessons.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 400 });
  }
}

export async function POST(request: Request) {
  try {
    const teacher = await requireTeacher();
    const record = lessonSchema.parse(await request.json()) as AdminLessonRecord;
    const admin = createAdminClient();
    const [{ data: course, error: courseError }, { data: existing, error: existingError }] = await Promise.all([
      admin.from("Subject").select("id,createdBy").eq("id", record.courseId).maybeSingle(),
      admin.from("AdminLessonRecord").select("createdBy,position,createdAt,status").eq("id", record.id).maybeSingle()
    ]);
    const error = courseError ?? existingError;
    if (error) throw new Error(error.message);
    if (!course || course.createdBy !== teacher.id) throw new Error("You can only add lessons to courses you created.");
    if (existing && existing.createdBy !== teacher.id) throw new Error("You can only edit lessons you created.");

    if (record.classId) {
      const { data: classroom } = await admin.from("TeacherClass")
        .select("id")
        .eq("id", record.classId)
        .eq("teacherId", teacher.id)
        .maybeSingle();
      if (!classroom) throw new Error("You can only place lessons in your own classes.");
    }
    const { count } = existing
      ? { count: null }
      : await admin.from("AdminLessonRecord").select("id", { count: "exact", head: true }).eq("courseId", record.courseId);
    const now = new Date().toISOString();
    const stored = { ...record, createdBy: undefined };
    delete stored.createdBy;
    const moderation = record.status === "published"
      ? await moderateTeacherContent({
          teacherId: teacher.id,
          contentType: "lesson",
          contentId: record.id,
          snapshot: {
            ...stored,
            classId: record.classId ?? null,
            courseId: record.courseId,
            unitId: record.unitId ?? null,
            topicId: record.topicId ?? null
          }
        })
      : null;
    if (moderation && moderation.state !== "published") {
      if (!existing) {
        const privateDraft = { ...stored, status: "draft" as const };
        const { error: draftError } = await admin.from("AdminLessonRecord").insert({
          id: record.id,
          subject: record.subject,
          status: "draft",
          classId: record.classId ?? null,
          courseId: record.courseId,
          unitId: record.unitId ?? null,
          topicId: record.topicId ?? null,
          position: count ?? 0,
          record: privateDraft,
          createdBy: teacher.id,
          createdAt: record.createdAt ?? now,
          updatedAt: now
        });
        if (draftError) throw new Error(draftError.message);
      }
      return NextResponse.json({ ok: true, lesson: { ...stored, status: "draft" }, moderation }, { status: 202 });
    }
    const { error: saveError } = await admin.from("AdminLessonRecord").upsert({
      id: record.id,
      subject: record.subject,
      status: record.status,
      classId: record.classId ?? null,
      courseId: record.courseId,
      unitId: record.unitId ?? null,
      topicId: record.topicId ?? null,
      position: existing?.position ?? count ?? 0,
      record: stored,
      createdBy: teacher.id,
      createdAt: existing?.createdAt ?? record.createdAt ?? now,
      updatedAt: now
    }, { onConflict: "id" });
    if (saveError) throw new Error(saveError.message);
    if (moderation) await markModerationPublished(moderation.caseId);
    return NextResponse.json({ ok: true, lesson: stored, moderation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the lesson.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 400 });
  }
}
