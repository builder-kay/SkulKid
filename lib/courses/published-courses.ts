"use client";

import { useEffect, useState } from "react";
import { subjects as coreSubjects } from "@/data/subjects";
import type { Subject } from "@/types/subject";

let cachedCourses: Subject[] | null = null;
let pendingRequest: Promise<Subject[]> | null = null;

async function loadPublishedCourses() {
  if (cachedCourses) return cachedCourses;
  if (pendingRequest) return pendingRequest;
  pendingRequest = fetch("/api/student/courses")
    .then(async (response) => {
      const payload = await response.json() as { courses?: Subject[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not load courses.");
      cachedCourses = mergeWithCoreSubjects(payload.courses ?? []);
      return cachedCourses;
    })
    .catch(() => {
      cachedCourses = coreSubjects;
      return cachedCourses;
    })
    .finally(() => { pendingRequest = null; });
  return pendingRequest;
}

function mergeWithCoreSubjects(liveCourses: Subject[]) {
  const liveBySlug = new Map(liveCourses.map((course) => [course.slug, course]));
  const core = coreSubjects.map((subject) => liveBySlug.get(subject.slug) ?? subject);
  return [...core, ...liveCourses.filter((course) => !coreSubjects.some((subject) => subject.slug === course.slug))];
}

export function usePublishedCourses() {
  const [courses, setCourses] = useState<Subject[]>(cachedCourses ?? []);
  const [loading, setLoading] = useState(cachedCourses === null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void loadPublishedCourses()
      .then((next) => { if (active) { setCourses(next); setError(null); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load courses."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { courses, loading, error };
}
