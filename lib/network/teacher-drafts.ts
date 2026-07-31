import { CONTENT_STORE, idbDelete, idbGet, idbSet } from "@/lib/network/idb";
import type { ClassQuizQuestion } from "@/lib/classes/types";

export type ClassQuizDraft = {
  title: string;
  courseId: string;
  description: string;
  startAt: string;
  deadline: string;
  offPlatformReward: string;
  xp: number;
  pass: number;
  maxAttempts: number;
  questions: ClassQuizQuestion[];
  updatedAt: string;
};

export type ClassCourseDraft = {
  selectedCourseId: string;
  courseNote: string;
  classOnlyName: string;
  classOnlyDescription: string;
  updatedAt: string;
};

export type LibraryQuizDraft = {
  quiz: unknown;
  updatedAt: string;
};

export function classQuizDraftKey(classId: string) {
  return `teacher-draft:class-quiz:${classId}`;
}

export function classCourseDraftKey(classId: string) {
  return `teacher-draft:class-course:${classId}`;
}

export function libraryQuizDraftKey(quizId: string) {
  return `teacher-draft:library-quiz:${quizId || "new"}`;
}

export async function saveClassQuizDraft(classId: string, draft: Omit<ClassQuizDraft, "updatedAt">) {
  const payload: ClassQuizDraft = { ...draft, updatedAt: new Date().toISOString() };
  await idbSet(CONTENT_STORE, classQuizDraftKey(classId), payload);
  return payload;
}

export async function readClassQuizDraft(classId: string) {
  return idbGet<ClassQuizDraft>(CONTENT_STORE, classQuizDraftKey(classId));
}

export async function clearClassQuizDraft(classId: string) {
  await idbDelete(CONTENT_STORE, classQuizDraftKey(classId));
}

export async function saveClassCourseDraft(classId: string, draft: Omit<ClassCourseDraft, "updatedAt">) {
  const payload: ClassCourseDraft = { ...draft, updatedAt: new Date().toISOString() };
  await idbSet(CONTENT_STORE, classCourseDraftKey(classId), payload);
  return payload;
}

export async function readClassCourseDraft(classId: string) {
  return idbGet<ClassCourseDraft>(CONTENT_STORE, classCourseDraftKey(classId));
}

export async function clearClassCourseDraft(classId: string) {
  await idbDelete(CONTENT_STORE, classCourseDraftKey(classId));
}

export async function saveLibraryQuizDraft(quizId: string, quiz: unknown) {
  const payload: LibraryQuizDraft = { quiz, updatedAt: new Date().toISOString() };
  await idbSet(CONTENT_STORE, libraryQuizDraftKey(quizId), payload);
  return payload;
}

export async function readLibraryQuizDraft(quizId: string) {
  return idbGet<LibraryQuizDraft>(CONTENT_STORE, libraryQuizDraftKey(quizId));
}

export async function clearLibraryQuizDraft(quizId: string) {
  await idbDelete(CONTENT_STORE, libraryQuizDraftKey(quizId));
}

export function formatDraftSavedAt(iso: string | null | undefined) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
