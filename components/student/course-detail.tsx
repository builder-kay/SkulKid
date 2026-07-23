"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Flag,
  Lock,
  Map as MapIcon,
  Play,
  Sparkles,
  Star,
  Trophy,
  Zap
} from "lucide-react";
import { StudentShell } from "@/components/student/student-shell";
import type { StudentNavItem } from "@/components/student/student-shell";
import { StudentPageNav } from "@/components/student/student-page-nav";
import { usePublishedCourses } from "@/lib/courses/published-courses";
import { getCourseSummary } from "@/lib/lessons/course-summary";
import { resolveLessonStatus } from "@/lib/lessons/resolve-lesson-status";
import { usePublishedLessons } from "@/lib/lessons/published-lessons";
import { useStudentGame } from "@/lib/gamification/student-game";
import { lessonProgressFromGameState } from "@/lib/student/lesson-progress";
import { cn } from "@/lib/utils";
import type { StudentLessonStatus } from "@/types/progress";
import type { SubjectName } from "@/types/subject";

export type CourseDetailProps = {
  subjectSlug: string;
};

const subjectThemes: Record<
  SubjectName,
  {
    hero: string;
    glowA: string;
    glowB: string;
    chip: string;
    accent: string;
    path: string;
    node: string;
    nodeGlow: string;
    cta: string;
  }
> = {
  Mathematics: {
    hero: "from-blue-950 via-indigo-700 to-cyan-500",
    glowA: "bg-amber-300/25",
    glowB: "bg-cyan-300/20",
    chip: "bg-white/10 text-cyan-100 ring-white/20",
    accent: "text-amber-300",
    path: "from-blue-400 to-cyan-400",
    node: "from-blue-500 to-indigo-600",
    nodeGlow: "shadow-[0_0_0_6px_rgba(59,130,246,0.22)]",
    cta: "bg-amber-300 text-slate-950 hover:bg-amber-200"
  },
  "English Language": {
    hero: "from-violet-950 via-purple-700 to-fuchsia-500",
    glowA: "bg-fuchsia-300/25",
    glowB: "bg-amber-300/15",
    chip: "bg-white/10 text-fuchsia-100 ring-white/20",
    accent: "text-amber-300",
    path: "from-violet-400 to-fuchsia-400",
    node: "from-violet-500 to-purple-600",
    nodeGlow: "shadow-[0_0_0_6px_rgba(139,92,246,0.22)]",
    cta: "bg-amber-300 text-slate-950 hover:bg-amber-200"
  },
  Science: {
    hero: "from-emerald-950 via-green-700 to-teal-500",
    glowA: "bg-lime-300/20",
    glowB: "bg-cyan-300/20",
    chip: "bg-white/10 text-emerald-100 ring-white/20",
    accent: "text-amber-300",
    path: "from-emerald-400 to-teal-400",
    node: "from-emerald-500 to-teal-600",
    nodeGlow: "shadow-[0_0_0_6px_rgba(16,185,129,0.22)]",
    cta: "bg-amber-300 text-slate-950 hover:bg-amber-200"
  }
};

const statusCopy: Record<StudentLessonStatus, { label: string; tone: string }> = {
  locked: { label: "Locked", tone: "bg-slate-200 text-slate-600" },
  available: { label: "Ready to play", tone: "bg-emerald-100 text-emerald-800" },
  in_progress: { label: "In progress", tone: "bg-amber-100 text-amber-900" },
  completed: { label: "Cleared", tone: "bg-blue-100 text-blue-900" },
  mastered: { label: "Mastered", tone: "bg-violet-100 text-violet-900" },
  revision_required: { label: "Retry", tone: "bg-orange-100 text-orange-900" }
};

export function CourseDetail({ subjectSlug }: CourseDetailProps) {
  const lessons = usePublishedLessons();
  const { state } = useStudentGame();
  const { courses, loading } = usePublishedCourses();
  const subject = courses.find((candidate) => candidate.slug === subjectSlug);

  if (loading) {
    return <StudentShell activeItem="courses"><main className="mx-auto grid min-h-72 w-full max-w-6xl place-items-center"><p className="font-bold text-muted">Loading course…</p></main></StudentShell>;
  }
  if (!subject) {
    notFound();
  }

  const progressRecords = lessonProgressFromGameState("current-student", state.completedLessonIds, state.quizRecords);
  const course = getCourseSummary(subject, lessons, progressRecords);
  const theme = subjectThemes[subject.name] ?? subjectThemes.Mathematics;
  const activeItem: StudentNavItem = subject.slug === "mathematics" ? "mathematics" : "courses";
  const unit = subject.units[0];
  const topic = unit?.topics[0];
  const nextLesson = course.lessons.find((lesson) => {
    const status = resolveLessonStatus(lesson, progressRecords, course.lessons);
    return status === "available" || status === "in_progress" || status === "revision_required";
  });
  const earnedStars = course.lessons.reduce((total, lesson) => {
    const progress = progressRecords.find((record) => record.lessonId === lesson.id);
    return total + (progress?.starsEarned ?? 0);
  }, 0);
  const maxStars = course.totalLessons * 3;

  if (!course.isAvailable) {
    return (
      <StudentShell activeItem={activeItem}>
        <main className="mx-auto w-full max-w-5xl space-y-5">
          <StudentPageNav
            backHref="/courses"
            backLabel="Back to courses"
            crumbs={[
              { label: "Home", href: "/dashboard" },
              { label: "Courses", href: "/courses" },
              { label: subject.name }
            ]}
          />
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-600 p-8 text-center text-white shadow-[var(--shadow-card)]">
            <Sparkles aria-hidden="true" className="mx-auto size-12 text-amber-300" />
            <h1 className="mt-4 text-3xl font-black">{subject.name}</h1>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-200">
              This adventure is still being built. Check back after a quest is published.
            </p>
            <Link
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 font-black text-slate-900"
              href="/courses"
            >
              Browse courses
            </Link>
          </section>
        </main>
      </StudentShell>
    );
  }

  return (
    <StudentShell activeItem={activeItem}>
      <main className="mx-auto grid w-full max-w-6xl gap-6">
        <header className={cn("relative overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,.22)] sm:p-8", theme.hero)}>
          <div className={cn("absolute -right-16 -top-20 size-64 rounded-full blur-3xl", theme.glowA)} />
          <div className={cn("absolute -bottom-24 left-1/4 size-56 rounded-full blur-3xl", theme.glowB)} />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-black ring-1", theme.chip)}>
                <MapIcon aria-hidden="true" className="size-4" />
                {subject.name} quest
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                {unit?.title ?? subject.name}
              </h1>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-white/85">
                {unit?.description ?? subject.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <HeroChip icon={Flag} label={topic?.title ?? "Course path"} />
                <HeroChip icon={Clock} label={`${course.totalMinutes} min`} />
                <HeroChip icon={Zap} label={`${course.totalXp} XP`} accent />
                <HeroChip icon={Star} label={`${earnedStars}/${maxStars} stars`} accent />
              </div>
              {nextLesson ? (
                <Link
                  className={cn(
                    "mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl px-6 text-base font-black shadow-lg transition",
                    theme.cta
                  )}
                  href={`/preview/lessons/${nextLesson.id}`}
                >
                  <Play aria-hidden="true" className="size-5 fill-current" />
                  Continue: {nextLesson.title}
                  <ChevronRight aria-hidden="true" className="size-5" />
                </Link>
              ) : (
                <p className={cn("mt-6 inline-flex items-center gap-2 text-sm font-black", theme.accent)}>
                  <Trophy aria-hidden="true" className="size-5" />
                  Quest complete — every mission cleared!
                </p>
              )}
            </div>

            <div className="grid w-full gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur sm:min-w-[17rem]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black uppercase tracking-wider text-white/70">Adventure progress</p>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-black">{course.progressPercent}%</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-white/80">
                  <span>Missions cleared</span>
                  <span>{course.progressPercent}%</span>
                </div>
                <div
                  aria-label="Missions cleared"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={course.progressPercent}
                  className="h-3 overflow-hidden rounded-full bg-white/20"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-200"
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <HudStat value={course.completedLessons} label="Cleared" />
                <HudStat value={course.unlockedLessons} label="Open" />
                <HudStat value={course.totalLessons} label="Missions" />
              </div>
            </div>
          </div>
        </header>

        <StudentPageNav
          backHref="/courses"
          backLabel="Back to courses"
          crumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Courses", href: "/courses" },
            { label: subject.name, href: `/courses/${subject.slug}` },
            { label: unit?.title ?? "Mission path" }
          ]}
        />

        <section
          aria-labelledby="quest-map-heading"
          className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-b from-white via-slate-50 to-blue-50/60 p-5 shadow-[var(--shadow-card)] sm:p-7"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-700">Quest map</p>
              <h2 id="quest-map-heading" className="mt-1 text-3xl font-black text-text-primary">
                Your mission path
              </h2>
              <p className="mt-2 max-w-xl text-text-secondary">
                Clear each stop to unlock the next. Earn XP and stars as you climb the path.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800 ring-1 ring-emerald-100">
              <Sparkles aria-hidden="true" className="size-4" />
              {course.unlockedLessons}/{course.totalLessons} available
            </span>
          </div>

          <ol className="relative mt-8 space-y-0">
            {course.lessons.map((lesson, index) => {
              const status = resolveLessonStatus(lesson, progressRecords, course.lessons);
              const progress = progressRecords.find((record) => record.lessonId === lesson.id);
              const locked = status === "locked";
              const cleared = status === "completed" || status === "mastered";
              const playable = !locked;
              const isNext = nextLesson?.id === lesson.id;
              const lessonUnit = subject.units.find((candidate) => candidate.id === lesson.unitId);
              const lessonTopic = lessonUnit?.topics.find((candidate) => candidate.id === lesson.topicId);
              const isLast = index === course.lessons.length - 1;

              return (
                <li
                  className="relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-5"
                  key={lesson.id}
                >
                  <div className="relative flex flex-col items-center">
                    {!isLast ? (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute top-14 bottom-0 w-1 rounded-full bg-gradient-to-b",
                          cleared ? theme.path : "from-slate-200 to-slate-200"
                        )}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 grid size-12 place-items-center rounded-full border-4 border-white text-white shadow-lg sm:size-14",
                        locked && "bg-slate-300 text-slate-600",
                        cleared && cn("bg-gradient-to-br", theme.node),
                        playable && !cleared && cn("bg-gradient-to-br animate-pulse", theme.node, theme.nodeGlow),
                        isNext && "ring-4 ring-amber-300/80"
                      )}
                    >
                      {locked ? (
                        <Lock aria-hidden="true" className="size-5 sm:size-6" />
                      ) : cleared ? (
                        <CheckCircle2 aria-hidden="true" className="size-6 sm:size-7" />
                      ) : (
                        <span className="text-lg font-black sm:text-xl">{index + 1}</span>
                      )}
                    </span>
                  </div>

                  <article
                    className={cn(
                      "mb-5 overflow-hidden rounded-[1.6rem] border bg-white p-4 shadow-sm transition sm:mb-6 sm:p-5",
                      locked && "border-slate-200 opacity-80",
                      cleared && "border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white",
                      isNext && "border-amber-300 shadow-[0_16px_40px_rgba(245,158,11,0.18)] ring-2 ring-amber-200",
                      playable && !cleared && !isNext && "border-blue-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", statusCopy[status].tone)}>
                        {statusCopy[status].label}
                      </span>
                      {subject.units.length > 1 && lessonTopic ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {lessonTopic.title}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-900">
                        <Star aria-hidden="true" className="size-3.5 fill-amber-400 text-amber-400" />
                        {progress?.starsEarned ?? 0}/3
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-800">
                        <Zap aria-hidden="true" className="size-3.5" />
                        {lesson.xpReward} XP
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        <Clock aria-hidden="true" className="size-3.5" />
                        {lesson.estimatedMinutes} min
                      </span>
                    </div>

                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wider text-muted">Mission {index + 1}</p>
                        <h3 className="mt-1 text-xl font-black text-text-primary sm:text-2xl">{lesson.title}</h3>
                        <p className="mt-2 max-w-2xl leading-7 text-text-secondary">{lesson.description}</p>
                      </div>

                      {locked ? (
                        <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-black text-muted">
                          <Lock aria-hidden="true" className="size-4" />
                          Unlock previous mission
                        </span>
                      ) : (
                        <Link
                          className={cn(
                            "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black shadow-sm transition",
                            isNext
                              ? theme.cta
                              : cleared
                                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                : "bg-primary text-white hover:bg-primary-dark"
                          )}
                          href={`/preview/lessons/${lesson.id}`}
                        >
                          {cleared ? (
                            <>
                              Replay
                              <Play aria-hidden="true" className="size-4" />
                            </>
                          ) : isNext ? (
                            <>
                              Play now
                              <Play aria-hidden="true" className="size-4 fill-current" />
                            </>
                          ) : (
                            <>
                              Start
                              <ChevronRight aria-hidden="true" className="size-4" />
                            </>
                          )}
                        </Link>
                      )}
                    </div>

                    {isNext ? (
                      <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
                        Your next stop on the quest map — jump in and earn XP.
                      </p>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ol>
        </section>
      </main>
    </StudentShell>
  );
}

function HeroChip({
  icon: Icon,
  label,
  accent = false
}: {
  icon: React.ElementType;
  label: string;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-sm font-black ring-1",
        accent ? "bg-amber-300/20 text-amber-100 ring-amber-200/30" : "bg-white/10 text-white/90 ring-white/15"
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}

function HudStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/10">
      <p className="text-xl font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">{label}</p>
    </div>
  );
}
