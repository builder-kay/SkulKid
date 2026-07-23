import type { SupportedCurriculumSubject } from "@/domains/curriculum-ai/schemas/generated-course";

export type AdminLessonStatus = "draft" | "published";

export type AdminLessonRecord = {
  id: string;
  subject: SupportedCurriculumSubject;
  courseId?: string | null;
  unitId?: string | null;
  topicId?: string | null;
  grade: number;
  unit: string;
  chapter: string;
  topic: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  xp: number;
  questionCount: number;
  format?: "text" | "video";
  prerequisiteLessonId?: string | null;
  gamification?: {
    passingScore: number;
    masteryScore: number;
    maximumAttempts: number;
    lessonRetries: number;
    maximumXp: number;
    badge: string;
  };
  status: AdminLessonStatus;
  createdAt: string;
  updatedAt: string;
  fixture: unknown;
  builderState?: unknown;
};

async function client() {
  const { createBrowserSupabaseClient } = await import("@/lib/supabase/browser");
  return createBrowserSupabaseClient();
}

export async function readAdminLessons(): Promise<AdminLessonRecord[]> {
  const supabase = await client();
  const enriched = await supabase.from("AdminLessonRecord").select("record,courseId,unitId,topicId").order("subject").order("position");
  if (!enriched.error) return (enriched.data ?? []).map((row) => ({ ...(row.record as AdminLessonRecord), courseId: row.courseId, unitId: row.unitId, topicId: row.topicId }));
  const legacy = await supabase.from("AdminLessonRecord").select("record").order("subject").order("position");
  if (legacy.error) throw legacy.error;
  return (legacy.data ?? []).map((row) => {
    const record = row.record as AdminLessonRecord;
    return { ...record, courseId: `subject-${record.subject}`, unitId: null, topicId: null };
  });
}

export async function writeAdminLesson(record: AdminLessonRecord) {
  const supabase = await client();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");
  const { data: existing } = await supabase.from("AdminLessonRecord").select("position").eq("id", record.id).maybeSingle();
  const { count } = await supabase.from("AdminLessonRecord").select("id", { count: "exact", head: true }).eq("subject", record.subject);
  const { error } = await supabase.from("AdminLessonRecord").upsert({
    id: record.id,
    subject: record.subject,
    status: record.status,
    courseId: record.courseId ?? `subject-${record.subject}`,
    unitId: record.unitId ?? null,
    topicId: record.topicId ?? null,
    position: existing?.position ?? count ?? 0,
    record,
    createdBy: user.id
  }, { onConflict: "id" });
  if (error) throw error;
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
}

export async function readLessonOrder(subject: SupportedCurriculumSubject): Promise<string[]> {
  const supabase = await client();
  const { data, error } = await supabase.from("AdminLessonRecord").select("id").eq("subject", subject).order("position");
  if (error) throw error;
  return (data ?? []).map((row) => row.id as string);
}

export async function writeLessonOrder(subject: SupportedCurriculumSubject, ids: string[]) {
  const supabase = await client();
  const uniqueIds = [...new Set(ids)];
  const results = await Promise.all(uniqueIds.map((id, position) => supabase.from("AdminLessonRecord").update({ position }).eq("id", id).eq("subject", subject)));
  const failure = results.find((result) => result.error)?.error;
  if (failure) throw failure;
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
}

export async function placeLessonAfter(subject: SupportedCurriculumSubject, lessonId: string, predecessorId: string | null, fallbackIds: string[]) {
  const current = placeLessonIdAfter(normaliseOrder(await readLessonOrder(subject), fallbackIds), lessonId, predecessorId);
  await writeLessonOrder(subject, current);
}

export function placeLessonIdAfter(ids: string[], lessonId: string, predecessorId: string | null) {
  const current = ids.filter((id) => id !== lessonId);
  if (!predecessorId) current.push(lessonId);
  else {
    const predecessorIndex = current.indexOf(predecessorId);
    current.splice(predecessorIndex >= 0 ? predecessorIndex + 1 : current.length, 0, lessonId);
  }
  return current;
}

export function normaliseOrder(savedOrder: string[], availableIds: string[]) {
  const available = new Set(availableIds);
  return [...savedOrder.filter((id) => available.has(id)), ...availableIds.filter((id) => !savedOrder.includes(id))];
}
