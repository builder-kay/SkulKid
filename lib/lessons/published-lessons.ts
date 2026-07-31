"use client";

import { useEffect, useState } from "react";
import type { Lesson } from "@/types/lesson";
import { cacheLessonContent, readCachedLesson } from "@/lib/network/content-cache";
import { fetchWithRetry } from "@/lib/network/fetch-retry";

let lessonIndex: Lesson[] | null = null;
let lessonIndexRequest: Promise<Lesson[]> | null = null;
const fullLessons = new Map<string, Lesson>();
const fullLessonRequests = new Map<string, Promise<Lesson | null>>();

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetchWithRetry(url, { cache: "no-store" });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Learning content could not be loaded.");
  return payload;
}

async function readLessonIndex() {
  if (lessonIndex) return lessonIndex;
  if (lessonIndexRequest) return lessonIndexRequest;
  lessonIndexRequest = fetchJson<{ lessons: Lesson[] }>("/api/student/lessons")
    .then((payload) => {
      lessonIndex = payload.lessons;
      return payload.lessons;
    })
    .catch(async (error) => {
      const cached = await readCachedLesson<Lesson[]>("__index__");
      if (cached) {
        lessonIndex = cached;
        return cached;
      }
      throw error;
    })
    .then(async (lessons) => {
      await cacheLessonContent("__index__", lessons);
      return lessons;
    })
    .finally(() => { lessonIndexRequest = null; });
  return lessonIndexRequest;
}

async function readPublishedLesson(lessonId: string) {
  if (fullLessons.has(lessonId)) return fullLessons.get(lessonId) ?? null;
  const pending = fullLessonRequests.get(lessonId);
  if (pending) return pending;
  const request = fetchJson<{ lesson: Lesson | null }>(`/api/student/lessons?id=${encodeURIComponent(lessonId)}`)
    .then(async (payload) => {
      if (payload.lesson) {
        fullLessons.set(lessonId, payload.lesson);
        await cacheLessonContent(lessonId, payload.lesson);
      }
      return payload.lesson;
    })
    .catch(async () => {
      const cached = await readCachedLesson<Lesson>(lessonId);
      if (cached) {
        fullLessons.set(lessonId, cached);
        return cached;
      }
      return null;
    })
    .finally(() => { fullLessonRequests.delete(lessonId); });
  fullLessonRequests.set(lessonId, request);
  return request;
}

export function usePublishedLessons(enabled = true) {
  const [lessons, setLessons] = useState<Lesson[]>(enabled ? lessonIndex ?? [] : []);
  useEffect(() => {
    if (!enabled) {
      setLessons([]);
      return;
    }
    let active = true;
    void readLessonIndex().then((next) => { if (active) setLessons(next); }).catch(() => undefined);
    return () => { active = false; };
  }, [enabled]);
  return lessons;
}

export function usePublishedLesson(lessonId: string, enabled = true) {
  const [lesson, setLesson] = useState<Lesson | null | undefined>(() => enabled ? fullLessons.get(lessonId) : null);
  useEffect(() => {
    if (!enabled) {
      setLesson(null);
      return;
    }
    let active = true;
    setLesson(fullLessons.get(lessonId));
    void readPublishedLesson(lessonId)
      .then((next) => { if (active) setLesson(next); })
      .catch(() => { if (active) setLesson(null); });
    return () => { active = false; };
  }, [enabled, lessonId]);
  return { lesson, loading: enabled && lesson === undefined };
}
