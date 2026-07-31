"use client";

import { useEffect, useState } from "react";
import type { StudentClassCourse } from "@/lib/classes/types";
import {
  cacheClassCourseContent,
  readCachedClassCourse
} from "@/lib/network/content-cache";
import { fetchWithRetry } from "@/lib/network/fetch-retry";

export function useStudentClassCourse(classId?: string, courseSlug?: string) {
  const enabled = Boolean(classId && courseSlug);
  const [data, setData] = useState<StudentClassCourse | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId || !courseSlug) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setData(null);
    setLoading(true);
    setError(null);
    void fetchWithRetry(
      `/api/student/classes/${encodeURIComponent(classId)}/courses/${encodeURIComponent(courseSlug)}`,
      { cache: "no-store" }
    )
      .then(async (response) => {
        const payload = await response.json() as StudentClassCourse & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to load this class subject.");
        await cacheClassCourseContent(classId, courseSlug, payload);
        if (active) setData(payload);
      })
      .catch(async (cause) => {
        const cached = await readCachedClassCourse<StudentClassCourse>(classId, courseSlug);
        if (cached && active) {
          setData(cached);
          setError(null);
          return;
        }
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load this class subject.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [classId, courseSlug]);

  return { data, loading, error };
}
