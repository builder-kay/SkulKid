"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Subject, Topic, Unit } from "@/types/subject";

export type CourseStatus = "draft" | "published";
export type ManagedCourse = Subject & {
  status: CourseStatus;
  order: number;
  icon: string;
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
  const supabase = createBrowserSupabaseClient();
  const [coursesResult, unitsResult, topicsResult, lessonsResult] = await Promise.all([
    supabase.from("Subject").select("id,name,slug,description,icon,colourToken,coverUrl,gradeLevels,order,status").order("order"),
    supabase.from("Unit").select("id,subjectId,name,slug,description,order").order("order"),
    supabase.from("Topic").select("id,unitId,name,slug,description,order").order("order"),
    supabase.from("AdminLessonRecord").select("id,courseId,unitId,topicId,status").eq("status", "published").order("position")
  ]);
  const error = coursesResult.error ?? unitsResult.error ?? topicsResult.error ?? lessonsResult.error;
  if (error) throw error;

  const lessons = lessonsResult.data ?? [];
  const topicsByUnit = new Map<string, Topic[]>();
  for (const topic of topicsResult.data ?? []) {
    const mapped: Topic = {
      id: String(topic.id),
      unitId: String(topic.unitId),
      title: String(topic.name),
      slug: String(topic.slug),
      description: String(topic.description),
      order: Number(topic.order),
      lessonIds: lessons.filter((lesson) => lesson.topicId === topic.id).map((lesson) => String(lesson.id))
    };
    topicsByUnit.set(mapped.unitId, [...(topicsByUnit.get(mapped.unitId) ?? []), mapped]);
  }

  const unitsByCourse = new Map<string, Unit[]>();
  for (const unit of unitsResult.data ?? []) {
    const mapped: Unit = {
      id: String(unit.id),
      subjectId: String(unit.subjectId),
      title: String(unit.name),
      slug: String(unit.slug),
      description: String(unit.description),
      order: Number(unit.order),
      topics: topicsByUnit.get(String(unit.id)) ?? []
    };
    unitsByCourse.set(mapped.subjectId, [...(unitsByCourse.get(mapped.subjectId) ?? []), mapped]);
  }

  return (coursesResult.data ?? []).map((course) => ({
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
    icon: String(course.icon)
  }));
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
  const { error } = await supabase.from("Unit").upsert({
    id: input.id ?? `unit-${crypto.randomUUID()}`,
    subjectId: courseId,
    name: input.title.trim(),
    slug: slugify(input.title),
    description: input.description.trim(),
    order: countResult?.count ?? 0,
    updatedAt: new Date().toISOString()
  }, { onConflict: "id" });
  if (error) throw error;
  notify();
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
  window.dispatchEvent(new Event("skulkid:lessons-changed"));
  notify();
}

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
