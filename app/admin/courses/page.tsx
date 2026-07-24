"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpenCheck, ExternalLink } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

type AdminCourse = {
  id: string;
  title: string;
  subject: string;
  grade: number | null;
  status: string;
  lessonCount: number;
  publishedLessonCount: number;
  updatedAt: string | null;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/admin/courses");
        const result = await response.json() as { courses?: AdminCourse[]; error?: string };
        if (!response.ok) throw new Error(result.error || "Could not load subjects.");
        if (active) setCourses(result.courses ?? []);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load subjects.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <main className="mx-auto grid w-full max-w-[90rem] gap-6">
      <header className="rounded-[2rem] border border-white bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Subject oversight</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Subjects created by teachers</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Review learning paths, publication coverage and jump into teacher tools when needed.</p>
      </header>

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? <SkulKidCard className="p-6 text-slate-500">Loading subjects…</SkulKidCard> : null}
        {!loading && courses.length === 0 ? <SkulKidCard className="p-6 text-slate-500">No teacher subjects found yet.</SkulKidCard> : null}
        {courses.map((course) => (
          <SkulKidCard className="p-5 sm:p-6" key={course.id}>
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><BookOpenCheck className="size-5" /></span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black capitalize text-slate-700">{course.status}</span>
            </div>
            <h2 className="mt-4 text-xl font-black">{course.title}</h2>
            <p className="mt-1 text-sm font-bold text-emerald-700">{course.subject}{course.grade ? ` · Basic ${course.grade}` : ""}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold text-slate-500">Lessons</dt><dd className="mt-1 text-lg font-black">{course.lessonCount}</dd></div>
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold text-slate-500">Published</dt><dd className="mt-1 text-lg font-black">{course.publishedLessonCount}</dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white" href="/teacher/curriculum">
                Manage in teacher tools <ExternalLink className="size-4" />
              </Link>
            </div>
          </SkulKidCard>
        ))}
      </div>
    </main>
  );
}
