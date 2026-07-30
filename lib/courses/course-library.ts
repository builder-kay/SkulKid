"use client";

import { useCallback, useEffect, useState } from "react";
import { buildCourseLessonOrder } from "@/lib/courses/module-lesson-order";
import type { Subject } from "@/types/subject";

export type CourseStatus = "draft" | "published";
export type ManagedCourse = Subject & {
  status: CourseStatus;
  order: number;
  icon: string;
  visibility: "platform" | "class";
  ownerClassId: string | null;
  createdBy?: string | null;
  canManage?: boolean;
  currentPublicRevisionId?: string | null;
};

export type CourseInput = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  coverUrl: string | null;
  gradeLevels: number[];
  status: CourseStatus;
  icon?: string;
  audience?: "class_only" | "public" | "both";
  classIds?: string[];
};

const changedEvent = "skulkid:courses-changed";

export async function readCourses(): Promise<ManagedCourse[]> {
  const response = await fetch("/api/teacher/catalog", { cache: "no-store" });
  const result = await response.json() as { courses?: ManagedCourse[]; error?: string };
  if (!response.ok) throw new Error(result.error || "Could not load courses.");
  return result.courses ?? [];
}

export async function saveCourse(input: CourseInput) {
  const result = await mutateCatalog<{ id: string }>({
    action: "save_course",
    ...input,
    audience: input.audience ?? "public",
    classIds: input.classIds ?? []
  });
  notify();
  return result.id;
}

export async function setCourseStatus(id: string, status: CourseStatus) {
  await mutateCatalog({ action: "set_status", courseId: id, status });
  notify();
}

export async function saveUnit(courseId: string, input: { id?: string; title: string; description: string; requiresPrevious?: boolean }) {
  const { id } = await mutateCatalog<{ id: string }>({ action: "save_unit", courseId, ...input });
  notify();
  return id;
}

export async function saveTopic(unitId: string, input: { id?: string; title: string; description: string }) {
  const { id } = await mutateCatalog<{ id: string }>({ action: "save_topic", unitId, ...input });
  notify();
  return id;
}

export async function moveStrand(courseId: string, id: string, direction: -1 | 1, strands: ManagedCourse["units"]) {
  const ordered = [...strands].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((strand) => strand.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ordered.length) return;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await mutateCatalog({ action: "reorder_strands", courseId, strandIds: ordered.map((strand) => strand.id) });
  notify();
}

export async function moveSubStrand(strandId: string, id: string, direction: -1 | 1, subStrands: ManagedCourse["units"][number]["topics"]) {
  const ordered = [...subStrands].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((subStrand) => subStrand.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ordered.length) return;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await mutateCatalog({ action: "reorder_sub_strands", strandId, subStrandIds: ordered.map((subStrand) => subStrand.id) });
  notify();
}

export async function attachLessonToTopic(lessonId: string, courseId: string, unitId: string, topicId: string) {
  await mutateCatalog({ action: "attach_lesson", lessonId, courseId, unitId, topicId });
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
  notify();
}

/** Link a lesson to a module (Unit) and place it at the end of that module's order. */
export async function attachLessonToModule(lessonId: string, courseId: string, unitId: string, unitTitle: string) {
  await mutateCatalog({ action: "attach_lesson", lessonId, courseId, unitId, topicId: null, unitTitle });
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
  notify();
}

export async function writeModuleLessonOrder(courseId: string, unitId: string, orderedIds: string[]) {
  const uniqueIds = [...new Set(orderedIds)];
  await mutateCatalog({ action: "reorder_lessons", courseId, unitId, lessonIds: uniqueIds });
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
  notify();
}

export async function detachLessonFromModule(lessonId: string, courseId: string) {
  await mutateCatalog({ action: "detach_lesson", lessonId, courseId });
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
  notify();
}

/**
 * Rebuild subject-wide `position` from module order, then lesson order inside each module.
 * Overrides let a module supply an explicit lesson id sequence (for reorder / attach).
 */
export async function renumberCourseByModules(courseId: string, overrides: Record<string, string[]> = {}) {
  const explicit = Object.entries(overrides);
  await Promise.all(explicit.map(([unitId, lessonIds]) =>
    mutateCatalog({ action: "reorder_lessons", courseId, unitId, lessonIds })
  ));
}

export { buildCourseLessonOrder } from "@/lib/courses/module-lesson-order";


export function useCourses() {
  const [courses, setCourses] = useState<ManagedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      setCourses(await readCourses());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load courses.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    window.addEventListener(changedEvent, refresh);
    return () => window.removeEventListener(changedEvent, refresh);
  }, [refresh]);
  return { courses, loading, error, refresh };
}

function notify() {
  window.dispatchEvent(new Event(changedEvent));
}

async function mutateCatalog<T = { ok?: boolean }>(body: unknown): Promise<T> {
  const response = await fetch("/api/teacher/catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "Could not update course content.");
  return result;
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "course";
}
