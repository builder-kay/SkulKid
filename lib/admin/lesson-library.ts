import type { SupportedCurriculumSubject } from "@/domains/curriculum-ai/schemas/generated-course";

export const adminLessonStorageKey = "skulkid-admin-lessons-v1";
export const adminLessonOrderStorageKey = "skulkid-admin-lesson-order-v1";

export type AdminLessonStatus = "draft" | "published";

export type AdminLessonRecord = {
  id: string;
  subject: SupportedCurriculumSubject;
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

export function readAdminLessons(): AdminLessonRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(adminLessonStorageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed as AdminLessonRecord[] : [];
  } catch { return []; }
}

export function writeAdminLesson(record: AdminLessonRecord) {
  const lessons = readAdminLessons();
  const existingIndex = lessons.findIndex((lesson) => lesson.id === record.id);
  if (existingIndex >= 0) lessons[existingIndex] = record;
  else lessons.unshift(record);
  window.localStorage.setItem(adminLessonStorageKey, JSON.stringify(lessons));
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
}

export function readLessonOrder(subject: SupportedCurriculumSubject): string[] {
  if (typeof window === "undefined") return [];
  try {
    const orders = JSON.parse(window.localStorage.getItem(adminLessonOrderStorageKey) ?? "{}") as Partial<Record<SupportedCurriculumSubject, string[]>>;
    return orders[subject] ?? [];
  } catch { return []; }
}

export function writeLessonOrder(subject: SupportedCurriculumSubject, ids: string[]) {
  let orders: Partial<Record<SupportedCurriculumSubject, string[]>> = {};
  try { orders = JSON.parse(window.localStorage.getItem(adminLessonOrderStorageKey) ?? "{}"); } catch { /* replace invalid local data */ }
  orders[subject] = [...new Set(ids)];
  window.localStorage.setItem(adminLessonOrderStorageKey, JSON.stringify(orders));
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
}

export function placeLessonAfter(subject: SupportedCurriculumSubject, lessonId: string, predecessorId: string | null, fallbackIds: string[]) {
  const current = normaliseOrder(readLessonOrder(subject), fallbackIds).filter((id) => id !== lessonId);
  if (!predecessorId) current.push(lessonId);
  else {
    const predecessorIndex = current.indexOf(predecessorId);
    current.splice(predecessorIndex >= 0 ? predecessorIndex + 1 : current.length, 0, lessonId);
  }
  writeLessonOrder(subject, current);
}

export function normaliseOrder(savedOrder: string[], availableIds: string[]) {
  const available = new Set(availableIds);
  return [...savedOrder.filter((id) => available.has(id)), ...availableIds.filter((id) => !savedOrder.includes(id))];
}
