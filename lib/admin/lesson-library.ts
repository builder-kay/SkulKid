import type { SupportedCurriculumSubject } from "@/domains/curriculum-ai/schemas/generated-course";

export type AdminLessonStatus = "draft" | "published";

export type AdminLessonRecord = {
  id: string;
  subject: SupportedCurriculumSubject;
  courseId?: string | null;
  classId?: string | null;
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
  createdBy?: string | null;
};

export async function readAdminLessons(): Promise<AdminLessonRecord[]> {
  const response = await fetch("/api/teacher/lessons", { cache: "no-store" });
  const result = await response.json() as { lessons?: AdminLessonRecord[]; error?: string };
  if (!response.ok) throw new Error(result.error || "Could not load lessons.");
  return result.lessons ?? [];
}

export async function writeAdminLesson(record: AdminLessonRecord) {
  const response = await fetch("/api/teacher/lessons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record)
  });
  const result = await response.json() as {
    error?: string;
    moderation?: {
      state: "published" | "held_for_review" | "ai_unavailable";
      caseId: string;
      message: string;
      trust: { status: string; cleanLessonCount: number; requiredCleanLessons: number };
    } | null;
  };
  if (!response.ok) throw new Error(result.error || "Could not save the lesson.");
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
  return result;
}

export async function readLessonOrder(subject: SupportedCurriculumSubject): Promise<string[]> {
  return (await readAdminLessons()).filter((lesson) => lesson.subject === subject).map((lesson) => lesson.id);
}

export async function writeLessonOrder(subject: SupportedCurriculumSubject, ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  const lessons = await readAdminLessons();
  const courseId = lessons.find((lesson) => lesson.subject === subject)?.courseId ?? courseIdForSubject(subject);
  const response = await fetch("/api/teacher/catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reorder_lessons", courseId, unitId: null, lessonIds: uniqueIds })
  });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error || "Could not reorder lessons.");
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
}

export async function placeLessonAfter(subject: SupportedCurriculumSubject, lessonId: string, predecessorId: string | null, fallbackIds: string[]) {
  const current = placeLessonIdAfter(normaliseOrder(await readLessonOrder(subject), fallbackIds), lessonId, predecessorId);
  await writeLessonOrder(subject, current);
}

export function courseIdForSubject(subject: SupportedCurriculumSubject) {
  return `subject-${subject}` as const;
}

export async function readModuleLessonOrder(courseId: string, unitId: string): Promise<string[]> {
  return (await readAdminLessons())
    .filter((lesson) => lesson.courseId === courseId && lesson.unitId === unitId)
    .map((lesson) => lesson.id);
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
