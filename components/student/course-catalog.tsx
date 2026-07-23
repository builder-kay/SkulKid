"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Compass, GraduationCap, Sparkles, Trophy } from "lucide-react";
import { CourseCard } from "@/components/student/course-card";
import { StudentShell } from "@/components/student/student-shell";
import { StudentPageNav } from "@/components/student/student-page-nav";
import { usePublishedCourses } from "@/lib/courses/published-courses";
import { useStudentGame } from "@/lib/gamification/student-game";
import { getCourseSummary } from "@/lib/lessons/course-summary";
import { usePublishedLessons } from "@/lib/lessons/published-lessons";
import { lessonProgressFromGameState } from "@/lib/student/lesson-progress";
import { cn } from "@/lib/utils";

export function CourseCatalog() {
  const [selectedGrade, setSelectedGrade] = useState(6);
  const lessons = usePublishedLessons();
  const { state } = useStudentGame();
  const { courses, loading } = usePublishedCourses();
  const progress = lessonProgressFromGameState("current-student", state.completedLessonIds, state.quizRecords);
  const courseSummaries = courses
    .filter((subject) => !subject.gradeLevels?.length || subject.gradeLevels.includes(selectedGrade))
    .map((subject) => getCourseSummary(subject, lessons, progress));
  const firstAvailable = courseSummaries.find((course) => course.isAvailable);
  const completedLessons = courseSummaries.reduce((total, course) => total + course.completedLessons, 0);
  const totalLessons = courseSummaries.reduce((total, course) => total + course.totalLessons, 0);
  const coursesStarted = courseSummaries.filter((course) => course.progressPercent > 0).length;

  return (
    <StudentShell activeItem="courses">
      <main className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
        <StudentPageNav
          backHref="/dashboard"
          backLabel="Back to dashboard"
          crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Courses" }]}
        />

        <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-800 p-5 text-white shadow-[0_22px_60px_rgba(49,46,129,.24)] sm:rounded-[2rem] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-fuchsia-400/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-violet-100 ring-1 ring-white/15">
                <Compass className="size-4" />
                Learning map
              </div>
              <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                Pick a course. Start your next adventure.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                Complete missions, collect XP and watch every learning path fill up.
              </p>
              <div className="mt-5 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
                <HeroStat icon={BookOpen} label="Live courses" value={courseSummaries.length} />
                <HeroStat icon={CheckCircle2} label="Lessons done" value={completedLessons} />
                <HeroStat icon={Trophy} label="Paths started" value={coursesStarted} />
              </div>
            </div>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 text-base font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              href={firstAvailable ? `/courses/${firstAvailable.subject.slug}` : "/courses"}
            >
              <Sparkles className="size-5" />
              {completedLessons > 0 ? "Continue learning" : "Start learning"}
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </div>
        </header>

        <section aria-labelledby="course-list-heading">
          <div className="mb-4 flex flex-col gap-4 px-1 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-violet-700">Choose your quest</p>
              <h2 className="mt-1 text-2xl font-black text-text-primary sm:text-3xl" id="course-list-heading">Your courses</h2>
            </div>
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1" aria-label="Filter courses by grade">
              <span className="sticky left-0 inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-violet-100 px-3 text-xs font-black text-violet-800">
                <GraduationCap className="size-4" />
                Grade
              </span>
              {[1, 2, 3, 4, 5, 6].map((grade) => (
                <button
                  aria-pressed={selectedGrade === grade}
                  className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-sm font-black transition", selectedGrade === grade ? "bg-slate-950 text-white shadow-md" : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700")}
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  type="button"
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm">
            <p className="font-bold text-violet-950">Showing courses for <span className="font-black">Grade {selectedGrade}</span></p>
            {totalLessons > 0 ? <p className="hidden font-bold text-violet-700 sm:block">{completedLessons} of {totalLessons} lessons cleared</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="col-span-full grid min-h-56 place-items-center rounded-[2rem] border border-white bg-white/80 text-center shadow-[var(--shadow-card)]">
                <div><span className="mx-auto grid size-12 animate-pulse place-items-center rounded-2xl bg-violet-100 text-violet-700"><BookOpen className="size-6" /></span><p className="mt-3 font-bold text-muted">Loading your learning paths…</p></div>
              </div>
            ) : courseSummaries.map((course) => (
              <CourseCard course={course} featured={course.subject.name === "Mathematics"} grade={selectedGrade} key={course.subject.id} />
            ))}
            {!loading && !courseSummaries.length ? <p className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center font-bold text-muted">No courses are live yet.</p> : null}
          </div>
        </section>
      </main>
    </StudentShell>
  );
}

function HeroStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur-sm sm:p-4"><Icon className="size-4 text-amber-300 sm:size-5" /><b className="mt-2 block text-xl font-black sm:text-2xl">{value}</b><span className="block truncate text-[10px] font-bold uppercase tracking-wide text-slate-300 sm:text-xs">{label}</span></div>;
}
