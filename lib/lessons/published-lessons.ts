"use client";

import { useEffect, useState } from "react";
import type { Lesson } from "@/types/lesson";

let lessonIndex: Lesson[] | null = null;
let lessonIndexRequest: Promise<Lesson[]> | null = null;
const fullLessons = new Map<string, Lesson>();
const fullLessonRequests = new Map<string, Promise<Lesson | null>>();

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
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
    .finally(() => { lessonIndexRequest = null; });
  return lessonIndexRequest;
}

async function readPublishedLesson(lessonId: string) {
  if (fullLessons.has(lessonId)) return fullLessons.get(lessonId) ?? null;
  const pending = fullLessonRequests.get(lessonId);
  if (pending) return pending;
  const request = fetchJson<{ lesson: Lesson | null }>(`/api/student/lessons?id=${encodeURIComponent(lessonId)}`)
    .then((payload) => {
      if (payload.lesson) fullLessons.set(lessonId, payload.lesson);
      return payload.lesson;
    })
    .finally(() => { fullLessonRequests.delete(lessonId); });
  fullLessonRequests.set(lessonId, request);
  return request;
}

export function usePublishedLessons() {
  const [lessons, setLessons] = useState<Lesson[]>(lessonIndex ?? []);
  useEffect(() => {
    let active = true;
    void readLessonIndex().then((next) => { if (active) setLessons(next); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  return lessons;
}

export function usePublishedLesson(lessonId: string) {
  const [lesson, setLesson] = useState<Lesson | null | undefined>(() => fullLessons.get(lessonId));
  useEffect(() => {
    let active = true;
    setLesson(fullLessons.get(lessonId));
    void readPublishedLesson(lessonId)
      .then((next) => { if (active) setLesson(next); })
      .catch(() => { if (active) setLesson(null); });
    return () => { active = false; };
  }, [lessonId]);
  return { lesson, loading: lesson === undefined };
}
