"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Lock,
  PlayCircle,
  Route,
  Sparkles,
  Star,
  Target
} from "lucide-react";
import { SubjectBadge } from "@/components/brand/subject-badge";
import { XpBadge } from "@/components/gamification/xp-badge";
import { StudentShell } from "@/components/student/student-shell";
import type { StudentNavItem } from "@/components/student/student-shell";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SkulKidButton } from "@/components/shared/skulkid-button";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { subjects } from "@/data/subjects";
import { sampleStudentProgress } from "@/data/sample-student-progress";
import { getCourseSummary } from "@/lib/lessons/course-summary";
import { resolveLessonStatus } from "@/lib/lessons/resolve-lesson-status";
import { usePublishedLessons } from "@/lib/lessons/published-lessons";
import { cn } from "@/lib/utils";
import type { StudentLessonStatus } from "@/types/progress";

export type CourseDetailProps = {
  subjectSlug: string;
};

const statusLabels: Record<StudentLessonStatus, string> = {
  locked: "Locked",
  available: "Available",
  in_progress: "In progress",
  completed: "Completed",
  mastered: "Mastered",
  revision_required: "Revision"
};

const statusStyles: Record<StudentLessonStatus, string> = {
  locked: "bg-slate-100 text-muted",
  available: "bg-blue-100 text-blue-900",
  in_progress: "bg-amber-100 text-amber-900",
  completed: "bg-green-100 text-green-900",
  mastered: "bg-violet-100 text-violet-900",
  revision_required: "bg-orange-100 text-orange-900"
};

export function CourseDetail({ subjectSlug }: CourseDetailProps) {
  const lessons = usePublishedLessons();
  const subject = subjects.find((candidate) => candidate.slug === subjectSlug);

  if (!subject) {
    notFound();
  }

  const course = getCourseSummary(subject, lessons, sampleStudentProgress);
  const activeItem: StudentNavItem = subject.slug === "mathematics" ? "mathematics" : "courses";

  if (!course.isAvailable) {
    return (
      <StudentShell activeItem={activeItem}>
        <main className="mx-auto w-full max-w-5xl">
          <SkulKidCard className="mt-6 p-8 text-center">
            <Sparkles aria-hidden="true" className="mx-auto size-12 text-muted" />
            <h1 className="mt-4 text-3xl font-bold">{subject.name}</h1>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-text-secondary">
              No lessons have been published for this subject yet. Please check back after an administrator publishes one.
            </p>
          </SkulKidCard>
        </main>
      </StudentShell>
    );
  }

  const unit = subject.units[0];
  const topic = unit?.topics[0];

  return (
    <StudentShell activeItem={activeItem}>
      <main className="mx-auto w-full max-w-6xl">
        <section className="grid gap-6 rounded-[2rem] border border-white/90 bg-white/80 p-5 shadow-[var(--shadow-card)] backdrop-blur sm:p-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            <SubjectBadge subject={subject.name} />
            <div>
              <h1 className="text-3xl font-bold text-text-primary sm:text-5xl">
                {unit?.title ?? subject.name}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-text-secondary">
                {unit?.description ?? subject.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-white px-3 text-sm font-bold text-text-secondary shadow-sm">
                <Route aria-hidden="true" className="size-4" />
                {topic?.title ?? "Course path"}
              </span>
              <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-white px-3 text-sm font-bold text-text-secondary shadow-sm">
                <Clock aria-hidden="true" className="size-4" />
                {course.totalMinutes} min
              </span>
              <XpBadge xp={course.totalXp} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xl font-bold">Course Progress</h2>
            <div className="mt-5">
              <ProgressBar label="Completed lessons" value={course.progressPercent} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xl font-black">{course.completedLessons}</p>
                <p className="text-muted">Done</p>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xl font-black">{course.unlockedLessons}</p>
                <p className="text-muted">Open</p>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xl font-black">{course.totalLessons}</p>
                <p className="text-muted">Total</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="lesson-path-heading" className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-blue-100 text-primary">
              <Target aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h2 id="lesson-path-heading" className="text-2xl font-bold text-text-primary">
                Lesson Path
              </h2>
              <p className="text-text-secondary">Follow the sequence and unlock each next step.</p>
            </div>
          </div>
          <div className="grid gap-4">
          {course.lessons.map((lesson) => {
            const status = resolveLessonStatus(lesson, sampleStudentProgress, course.lessons);
            const progress = sampleStudentProgress.find((record) => record.lessonId === lesson.id);
            const locked = status === "locked";
            const lessonUnit = subject.units.find((candidate) => candidate.id === lesson.unitId);
            const lessonTopic = lessonUnit?.topics.find((candidate) => candidate.id === lesson.topicId);

            return (
              <SkulKidCard className="relative overflow-hidden p-5" key={lesson.id}>
                <div className={cn("absolute inset-y-0 left-0 w-1.5", locked ? "bg-slate-200" : "bg-primary")} />
                <div className="grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl border",
                      locked ? "bg-slate-100 text-muted" : "bg-blue-100 text-primary"
                    )}
                  >
                    {locked ? (
                      <Lock aria-hidden="true" className="size-6" />
                    ) : progress?.status === "completed" || progress?.status === "mastered" ? (
                      <CheckCircle2 aria-hidden="true" className="size-6" />
                    ) : (
                      <PlayCircle aria-hidden="true" className="size-6" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {subject.units.length > 1 ? (
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-900">
                          {lessonUnit?.title} · {lessonTopic?.title}
                        </span>
                      ) : null}
                      <span className={cn("rounded-full px-3 py-1 text-sm font-bold", statusStyles[status])}>
                        {statusLabels[status]}
                      </span>
                      <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-amber-100 px-3 text-sm font-bold text-amber-900">
                        <Star aria-hidden="true" className="size-4" />
                        {progress?.starsEarned ?? 0}/3
                      </span>
                    </div>
                    <h3 className="text-xl font-bold">{lesson.title}</h3>
                    <p className="leading-7 text-text-secondary">{lesson.description}</p>
                  </div>
                  <SkulKidButton
                    asChild={!locked}
                    className="w-full md:w-auto"
                    disabled={locked}
                    size="lg"
                    variant={locked ? "outline" : "primary"}
                  >
                    {locked ? (
                      <span>Locked</span>
                    ) : (
                      <Link href={`/preview/lessons/${lesson.id}`}>
                        {progress ? "Review" : "Start"}
                        <PlayCircle aria-hidden="true" className="size-4" />
                      </Link>
                    )}
                  </SkulKidButton>
                </div>
              </SkulKidCard>
            );
          })}
          </div>
        </section>
      </main>
    </StudentShell>
  );
}
