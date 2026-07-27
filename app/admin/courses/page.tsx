"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, BookOpenCheck, Globe2, Search, Users, XCircle } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

type AdminCourse = {
  id: string;
  title: string;
  description: string;
  gradeLevels: number[];
  courseStatus: "active" | "archived";
  audience: "class_only" | "public" | "both";
  teacherName: string;
  classNames: string[];
  lessonCount: number;
  publishedLessonCount: number;
  publicationState: string;
  currentVersion: number | null;
  latestVersion: number | null;
  reviewNote: string | null;
  updatedAt: string;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [audience, setAudience] = useState<"all" | "public" | "class">("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/courses", { cache: "no-store" });
      const result = await response.json() as { courses?: AdminCourse[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load courses.");
      setCourses(result.courses ?? []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load courses.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => courses.filter((course) => {
    if (audience === "public" && course.audience === "class_only") return false;
    if (audience === "class" && course.audience === "public") return false;
    return `${course.title} ${course.teacherName} ${course.classNames.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [audience, courses, query]);

  async function takeAction(course: AdminCourse, action: "unpublish" | "archive") {
    const reason = window.prompt(action === "archive"
      ? `Why should “${course.title}” be archived?`
      : `Why should “${course.title}” be removed from Public Learning?`);
    if (!reason) return;
    setBusyId(course.id);
    setError("");
    try {
      const response = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id, action, reason })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not update the course.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the course.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-[90rem] gap-6">
      <header className="rounded-[2rem] border border-white bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Learning oversight</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Public Learning and class courses</h1>
        <p className="mt-3 max-w-2xl text-slate-600">See who created each course, where learners can access it, and which approved version is live.</p>
      </header>

      <SkulKidCard className="grid gap-4 p-4 sm:grid-cols-[auto_1fr] sm:p-5">
        <div className="flex rounded-xl bg-slate-100 p-1">
          {([["all", "All"], ["public", "Public Learning"], ["class", "Class Learning"]] as const).map(([value, label]) => <button className={`min-h-10 rounded-lg px-3 text-sm font-black ${audience === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`} key={value} onClick={() => setAudience(value)} type="button">{label}</button>)}
        </div>
        <label className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" /><input aria-label="Search courses" className="min-h-10 w-full rounded-xl border border-slate-300 pl-10 pr-3" placeholder="Search by course, teacher or class" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      </SkulKidCard>

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950" role="alert">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? <SkulKidCard className="p-6 text-slate-500">Loading learning courses…</SkulKidCard> : null}
        {!loading && visible.length === 0 ? <SkulKidCard className="p-8 text-center text-slate-500">No courses match these filters.</SkulKidCard> : null}
        {visible.map((course) => {
          const publicCourse = course.audience !== "class_only";
          return (
            <SkulKidCard className="p-5 sm:p-6" key={course.id}>
              <div className="flex items-start justify-between gap-3">
                <span className={`grid size-11 place-items-center rounded-2xl ${publicCourse ? "bg-emerald-50 text-emerald-800" : "bg-violet-50 text-violet-800"}`}>{publicCourse ? <Globe2 className="size-5" /> : <Users className="size-5" />}</span>
                <div className="flex flex-wrap justify-end gap-2"><Badge value={course.audience === "class_only" ? "Class Learning" : course.audience === "both" ? "Classes + Public" : "Public Learning"} /><Badge value={publicationLabel(course)} /></div>
              </div>
              <h2 className="mt-4 text-xl font-black">{course.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{course.description}</p>
              <p className="mt-3 text-xs font-black uppercase tracking-wider text-emerald-700">Created by {course.teacherName}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Basic {course.gradeLevels.join(", Basic ") || "levels not set"}{course.classNames.length ? ` · ${course.classNames.join(", ")}` : ""}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Metric label="Lessons" value={course.lessonCount} />
                <Metric label="Ready" value={course.publishedLessonCount} />
                <Metric label="Live version" value={course.currentVersion ? `v${course.currentVersion}` : "—"} />
              </dl>
              {course.reviewNote ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-950">Latest review note: {course.reviewNote}</p> : null}
              <div className="mt-5 flex flex-wrap gap-2">
                {publicCourse && course.currentVersion ? <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 text-sm font-black text-amber-950 disabled:opacity-50" disabled={busyId === course.id} onClick={() => void takeAction(course, "unpublish")} type="button"><XCircle className="size-4" />Unpublish</button> : null}
                {course.courseStatus !== "archived" ? <button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-black text-white disabled:opacity-50" disabled={busyId === course.id} onClick={() => void takeAction(course, "archive")} type="button"><Archive className="size-4" />Archive course</button> : null}
              </div>
            </SkulKidCard>
          );
        })}
      </div>
    </main>
  );
}

function publicationLabel(course: AdminCourse) {
  if (course.courseStatus === "archived") return "Archived";
  const labels: Record<string, string> = { pending_review: "In review", changes_requested: "Changes requested", approved: "Published", superseded: "Updated", archived: "Unpublished", unpublished: "Unpublished" };
  return labels[course.publicationState] ?? course.publicationState;
}
function Badge({ value }: { value: string }) { return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">{value}</span>; }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-slate-50 p-3"><dt className="text-[11px] font-bold text-slate-500">{label}</dt><dd className="mt-1 text-lg font-black">{value}</dd></div>; }
