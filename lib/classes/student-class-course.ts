"use client";

import { useEffect, useState } from "react";
import type { StudentClassCourse } from "@/lib/classes/types";

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
    void fetch(`/api/student/classes/${encodeURIComponent(classId)}/courses/${encodeURIComponent(courseSlug)}`, {
      cache: "no-store"
    })
      .then(async (response) => {
        const payload = await response.json() as StudentClassCourse & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to load this class subject.");
        if (active) setData(payload);
      })
      .catch((cause) => {
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
