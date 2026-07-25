"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { buildCourseLessonOrder } from "@/lib/courses/module-lesson-order";
import type { Subject } from "@/types/subject";

export type CourseStatus = "draft" | "published";
export type ManagedCourse = Subject & {
  status: CourseStatus;
  order: number;
  icon: string;
  visibility: "platform" | "class";
  ownerClassId: string | null;
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
};

const changedEvent = "skulkid:courses-changed";

export async function readCourses(): Promise<ManagedCourse[]> {
  const response = await fetch("/api/teacher/catalog", { cache: "no-store" });
  const result = await response.json() as { courses?: ManagedCourse[]; error?: string };
  if (!response.ok) throw new Error(result.error || "Could not load courses.");
  return result.courses ?? [];
}

export async function saveCourse(input: CourseInput) {
  const supabase = createBrowserSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");
  const existing = input.id
    ? await supabase.from("Subject").select("order").eq("id", input.id).maybeSingle()
    : null;
  const countResult = input.id
    ? null
    : await supabase.from("Subject").select("id", { count: "exact", head: true });
  const id = input.id ?? `course-${crypto.randomUUID()}`;
  if (input.status === "published") {
    const { count, error: lessonError } = await supabase.from("AdminLessonRecord").select("id", { count: "exact", head: true }).eq("courseId", id).eq("status", "published");
    if (lessonError) throw lessonError;
    if (!count) throw new Error("Save this course as a draft first, then attach and publish at least one lesson.");
  }
  const { error } = await supabase.from("Subject").upsert({
    id,
    name: input.name.trim(),
    slug: slugify(input.slug || input.name),
    description: input.description.trim(),
    icon: input.icon ?? "book-open",
    colourToken: input.color,
    coverUrl: input.coverUrl?.trim() || null,
    gradeLevels: input.gradeLevels,
    order: existing?.data?.order ?? countResult?.count ?? 0,
    status: input.status === "published" ? "ACTIVE" : "ARCHIVED",
    createdBy: user.id,
    updatedAt: new Date().toISOString()
  }, { onConflict: "id" });
  if (error) throw error;
  notify();
  return id;
}

export async function setCourseStatus(id: string, status: CourseStatus) {
  const supabase = createBrowserSupabaseClient();
  if (status === "published") {
    const { count, error: lessonError } = await supabase.from("AdminLessonRecord").select("id", { count: "exact", head: true }).eq("courseId", id).eq("status", "published");
    if (lessonError) throw lessonError;
    if (!count) throw new Error("Publish at least one lesson in this course before making it live.");
  }
  const { error } = await supabase.from("Subject").update({
    status: status === "published" ? "ACTIVE" : "ARCHIVED"
  }).eq("id", id);
  if (error) throw error;
  notify();
}

export async function saveUnit(courseId: string, input: { id?: string; title: string; description: string }) {
  const supabase = createBrowserSupabaseClient();
  const countResult = input.id ? null : await supabase.from("Unit").select("id", { count: "exact", head: true }).eq("subjectId", courseId);
  const id = input.id ?? `unit-${crypto.randomUUID()}`;
  const { error } = await supabase.from("Unit").upsert({
    id,
    subjectId: courseId,
    name: input.title.trim(),
    slug: slugify(input.title),
    description: input.description.trim(),
    order: countResult?.count ?? 0,
    updatedAt: new Date().toISOString()
  }, { onConflict: "id" });
  if (error) throw error;
  notify();
  return id;
}

export async function saveTopic(unitId: string, input: { id?: string; title: string; description: string }) {
  const supabase = createBrowserSupabaseClient();
  const countResult = input.id ? null : await supabase.from("Topic").select("id", { count: "exact", head: true }).eq("unitId", unitId);
  const { error } = await supabase.from("Topic").upsert({
    id: input.id ?? `topic-${crypto.randomUUID()}`,
    unitId,
    name: input.title.trim(),
    slug: slugify(input.title),
    description: input.description.trim(),
    order: countResult?.count ?? 0,
    updatedAt: new Date().toISOString()
  }, { onConflict: "id" });
  if (error) throw error;
  notify();
}

export async function moveCourse(id: string, direction: -1 | 1, courses: ManagedCourse[]) {
  const ordered = [...courses].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((course) => course.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ordered.length) return;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  const supabase = createBrowserSupabaseClient();
  const results = await Promise.all(ordered.map((course, order) => supabase.from("Subject").update({ order }).eq("id", course.id)));
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;
  notify();
}

export async function attachLessonToTopic(lessonId: string, courseId: string, unitId: string, topicId: string) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("AdminLessonRecord").update({ courseId, unitId, topicId }).eq("id", lessonId);
  if (error) throw error;
  await renumberCourseByModules(courseId);
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
  notify();
}

/** Link a lesson to a module (Unit) and place it at the end of that module's order. */
export async function attachLessonToModule(lessonId: string, courseId: string, unitId: string, unitTitle: string) {
  const supabase = createBrowserSupabaseClient();
  const { data, error: readError } = await supabase.from("AdminLessonRecord").select("record").eq("id", lessonId).maybeSingle();
  if (readError) throw readError;
  const record = data?.record && typeof data.record === "object" ? data.record as Record<string, unknown> : null;
  const nextRecord = record
    ? { ...record, courseId, unitId, unit: unitTitle, chapter: unitTitle }
    : null;
  const { error } = await supabase.from("AdminLessonRecord").update({
    courseId,
    unitId,
    ...(nextRecord ? { record: nextRecord } : {})
  }).eq("id", lessonId);
  if (error) throw error;

  const { data: moduleLessons, error: listError } = await supabase
    .from("AdminLessonRecord")
    .select("id")
    .eq("courseId", courseId)
    .eq("unitId", unitId)
    .order("position");
  if (listError) throw listError;
  const orderedIds = [...(moduleLessons ?? []).map((row) => String(row.id)).filter((id) => id !== lessonId), lessonId];
  await renumberCourseByModules(courseId, { [unitId]: orderedIds });
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
  notify();
}

export async function writeModuleLessonOrder(courseId: string, unitId: string, orderedIds: string[]) {
  const supabase = createBrowserSupabaseClient();
  const uniqueIds = [...new Set(orderedIds)];
  const results = await Promise.all(
    uniqueIds.map((id) => supabase.from("AdminLessonRecord").update({ courseId, unitId }).eq("id", id))
  );
  const failure = results.find((result) => result.error)?.error;
  if (failure) throw failure;
  await renumberCourseByModules(courseId, { [unitId]: uniqueIds });
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
  notify();
}

export async function detachLessonFromModule(lessonId: string, courseId: string) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("AdminLessonRecord").update({ unitId: null, topicId: null }).eq("id", lessonId);
  if (error) throw error;
  await renumberCourseByModules(courseId);
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
  notify();
}

/**
 * Rebuild subject-wide `position` from module order, then lesson order inside each module.
 * Overrides let a module supply an explicit lesson id sequence (for reorder / attach).
 */
export async function renumberCourseByModules(courseId: string, overrides: Record<string, string[]> = {}) {
  const supabase = createBrowserSupabaseClient();
  const [unitsResult, lessonsResult] = await Promise.all([
    supabase.from("Unit").select("id").eq("subjectId", courseId).order("order"),
    supabase.from("AdminLessonRecord").select("id,unitId").eq("courseId", courseId).order("position")
  ]);
  if (unitsResult.error) throw unitsResult.error;
  if (lessonsResult.error) throw lessonsResult.error;

  const finalOrder = buildCourseLessonOrder(
    (unitsResult.data ?? []).map((unit) => String(unit.id)),
    (lessonsResult.data ?? []).map((lesson) => ({ id: String(lesson.id), unitId: lesson.unitId ? String(lesson.unitId) : null })),
    overrides
  );

  if (!finalOrder.length) return;
  const results = await Promise.all(
    finalOrder.map((id, position) => supabase.from("AdminLessonRecord").update({ position }).eq("id", id))
  );
  const failure = results.find((result) => result.error)?.error;
  if (failure) throw failure;
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

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "course";
}
