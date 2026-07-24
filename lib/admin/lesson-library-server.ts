import "server-only";

import type { SupportedCurriculumSubject } from "@/domains/curriculum-ai/schemas/generated-course";
import type { AdminLessonRecord } from "@/lib/admin/lesson-library";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function readAdminLessonsServer(): Promise<AdminLessonRecord[]> {
  const supabase = createAdminClient();
  const enriched = await supabase.from("AdminLessonRecord").select("record,classId,courseId,unitId,topicId").order("subject").order("position");
  if (!enriched.error) {
    return (enriched.data ?? []).map((row) => ({
      ...(row.record as AdminLessonRecord),
      classId: row.classId,
      courseId: row.courseId,
      unitId: row.unitId,
      topicId: row.topicId
    }));
  }

  const legacy = await supabase.from("AdminLessonRecord").select("record").order("subject").order("position");
  if (legacy.error) throw legacy.error;
  return (legacy.data ?? []).map((row) => {
    const record = row.record as AdminLessonRecord;
    return { ...record, courseId: `subject-${record.subject}`, unitId: null, topicId: null };
  });
}

export async function writeAdminLessonServer(record: AdminLessonRecord) {
  const sessionClient = await createServerSupabaseClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("AdminLessonRecord").select("position").eq("id", record.id).maybeSingle();
  const { count } = await supabase.from("AdminLessonRecord").select("id", { count: "exact", head: true }).eq("subject", record.subject);
  const { error } = await supabase.from("AdminLessonRecord").upsert({
    id: record.id,
    subject: record.subject,
    status: record.status,
    classId: record.classId ?? null,
    courseId: record.courseId ?? `subject-${record.subject}`,
    unitId: record.unitId ?? null,
    topicId: record.topicId ?? null,
    position: existing?.position ?? count ?? 0,
    record,
    createdBy: user.id,
    updatedAt: new Date().toISOString()
  }, { onConflict: "id" });
  if (error) throw error;
}

export async function readLessonOrderServer(subject: SupportedCurriculumSubject): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("AdminLessonRecord").select("id").eq("subject", subject).order("position");
  if (error) throw error;
  return (data ?? []).map((row) => row.id as string);
}
