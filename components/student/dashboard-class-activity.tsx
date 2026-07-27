"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  MessageSquareHeart,
  RefreshCw,
  School,
  Sparkles,
  Star,
  UsersRound
} from "lucide-react";
import type { StudentDashboardActivity } from "@/lib/classes/types";

const emptyActivity: StudentDashboardActivity = {
  classes: [],
  quizzes: [],
  subjects: []
};

export function DashboardClassActivity() {
  const [activity, setActivity] = useState<StudentDashboardActivity>(emptyActivity);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadActivity() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/student/dashboard-activity", { cache: "no-store" });
      const payload = await response.json() as StudentDashboardActivity & { error?: string };
      if (!response.ok) throw new Error(payload.error || "We could not load your class updates.");
      setActivity({
        classes: payload.classes ?? [],
        quizzes: payload.quizzes ?? [],
        subjects: payload.subjects ?? []
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not load your class updates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadActivity();
  }, []);

  const snapshot = useMemo(() => ({
    openQuizzes: activity.quizzes.filter((quiz) => quiz.state === "open").length,
    upcomingQuizzes: activity.quizzes.filter((quiz) => quiz.state === "upcoming").length,
    newTips: activity.classes.reduce((total, classroom) => total + classroom.unreadAdviceCount, 0)
  }), [activity]);

  if (loading) return <ActivitySkeleton />;

  if (error) {
    return (
      <section aria-labelledby="class-activity-heading" className="rounded-[2rem] border border-rose-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-rose-700">Class shortcuts</p>
            <h2 className="mt-1 text-2xl font-black text-text-primary" id="class-activity-heading">Your class updates are hiding</h2>
            <p className="mt-2 text-sm text-text-secondary">{error}</p>
          </div>
          <button
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-black text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            onClick={() => void loadActivity()}
            type="button"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (activity.classes.length === 0) {
    return (
      <section
        aria-labelledby="class-activity-heading"
        className="relative overflow-hidden rounded-[2rem] border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-[var(--shadow-card)] sm:p-8"
      >
        <div aria-hidden="true" className="absolute -right-10 -top-12 size-40 rounded-full bg-cyan-200/35" />
        <div className="relative max-w-2xl">
          <span className="grid size-12 place-items-center rounded-2xl bg-sky-700 text-white shadow-lg shadow-sky-200">
            <UsersRound className="size-6" />
          </span>
          <p className="mt-5 text-xs font-black uppercase tracking-wider text-sky-700">Class shortcuts</p>
          <h2 className="mt-1 text-2xl font-black text-text-primary sm:text-3xl" id="class-activity-heading">
            Join a class to see what is happening
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary sm:text-base">
            When you join your teacher&apos;s class, quizzes, class subjects and teacher tips will appear here.
          </p>
          <Link
            className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-sky-700 px-5 font-black text-white transition hover:-translate-y-0.5 hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            href="/classes"
          >
            Join a class
            <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="class-activity-heading" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sky-700">
            <Sparkles aria-hidden="true" className="size-4" />
            <p className="text-xs font-black uppercase tracking-wider">Your learning shortcuts</p>
          </div>
          <h2 className="mt-1 text-2xl font-black text-text-primary sm:text-3xl" id="class-activity-heading">
            Happening in your classes
          </h2>
          <p className="mt-1 text-sm text-text-secondary">Jump straight to your quizzes, subjects and teacher updates.</p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-text-primary shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:self-auto"
          href="/classes"
        >
          All my classes
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ActivityStat icon={School} label="Classes" value={activity.classes.length} />
        <ActivityStat icon={ClipboardList} label="Quizzes ready" value={snapshot.openQuizzes} attention={snapshot.openQuizzes > 0} />
        <ActivityStat icon={Clock3} label="Coming soon" value={snapshot.upcomingQuizzes} />
        <ActivityStat icon={MessageSquareHeart} label="New teacher tips" value={snapshot.newTips} attention={snapshot.newTips > 0} />
      </div>

      <div aria-label="Your class shortcuts" className="flex snap-x gap-3 overflow-x-auto pb-1">
        {activity.classes.map((classroom) => (
          <Link
            className="group min-w-[15rem] snap-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            href={`/classes/${classroom.id}`}
            key={classroom.id}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-800">
                <School aria-hidden="true" className="size-5" />
              </span>
              <ArrowRight aria-hidden="true" className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-700" />
            </div>
            <h3 className="mt-3 truncate font-black text-text-primary">{classroom.name}</h3>
            <p className="mt-0.5 text-xs font-bold text-text-secondary">
              Primary {classroom.gradeLevel} · {classroom.teacherName}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[0.7rem] font-black">
              <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">{classroom.courseCount} subjects</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">{classroom.openQuizCount} quizzes</span>
              {classroom.unreadAdviceCount > 0 ? (
                <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">{classroom.unreadAdviceCount} new tips</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[1.75rem] border border-indigo-200 bg-white shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
                <ClipboardList aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h3 className="font-black text-text-primary">Quiz challenges</h3>
                <p className="text-xs font-semibold text-text-secondary">Ready now and coming soon</p>
              </div>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-indigo-700 shadow-sm">{activity.quizzes.length}</span>
          </div>

          {activity.quizzes.length ? (
            <div className="divide-y divide-slate-100">
              {activity.quizzes.slice(0, 4).map((quiz) => <QuizShortcut key={quiz.id} quiz={quiz} />)}
            </div>
          ) : (
            <ActivityEmpty
              icon={CheckCircle2}
              title="No quiz waiting right now"
              description="Great job checking! New quiz challenges will appear here."
            />
          )}
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-emerald-200 bg-white shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white">
                <BookOpen aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h3 className="font-black text-text-primary">Class subjects</h3>
                <p className="text-xs font-semibold text-text-secondary">Learning picked by your teachers</p>
              </div>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-emerald-700 shadow-sm">{activity.subjects.length}</span>
          </div>

          {activity.subjects.length ? (
            <div className="divide-y divide-slate-100">
              {activity.subjects.slice(0, 4).map((subject) => (
                <Link
                  className="group flex min-h-20 items-center gap-3 px-5 py-3 transition hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
                  href={subject.courseSlug ? `/courses/${subject.courseSlug}` : `/classes/${subject.classId}`}
                  key={subject.id}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 font-black text-emerald-800">
                    {subject.courseName.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-black text-text-primary">{subject.courseName}</span>
                      {subject.isClassOnly ? <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[0.65rem] font-black text-violet-800">Class-only</span> : null}
                    </span>
                    <span className="block truncate text-xs font-bold text-text-secondary">{subject.className}</span>
                    {subject.note ? <span className="mt-0.5 block truncate text-xs text-slate-500">{subject.note}</span> : null}
                  </span>
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                </Link>
              ))}
            </div>
          ) : (
            <ActivityEmpty
              icon={BookOpen}
              title="No class subjects yet"
              description="Your teacher's subject shortcuts will appear here."
            />
          )}
        </div>
      </div>
    </section>
  );
}

function QuizShortcut({ quiz }: { quiz: StudentDashboardActivity["quizzes"][number] }) {
  const upcoming = quiz.state === "upcoming";
  const completed = quiz.state === "completed";
  const href = upcoming ? `/classes/${quiz.classId}` : `/classes/${quiz.classId}/quizzes/${quiz.id}`;
  const timeLabel = upcoming && quiz.startAt
    ? `Starts ${formatActivityTime(quiz.startAt)}`
    : quiz.deadline
      ? `Ends ${formatActivityTime(quiz.deadline)}`
      : "No end time";
  const action = upcoming ? "View class" : completed ? "View result" : quiz.attemptsUsed > 0 ? "Continue" : "Start quiz";

  return (
    <Link
      className="group flex min-h-24 items-center gap-3 px-5 py-3 transition hover:bg-indigo-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      href={href}
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${completed ? "bg-emerald-100 text-emerald-700" : upcoming ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-800"}`}>
        {completed ? <CheckCircle2 aria-hidden="true" className="size-5" /> : upcoming ? <CalendarClock aria-hidden="true" className="size-5" /> : <Star aria-hidden="true" className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-black text-text-primary">{quiz.title}</span>
        <span className="block truncate text-xs font-bold text-text-secondary">{quiz.className} · {quiz.questionCount} questions · {quiz.baseXpReward} XP</span>
        <span className={`mt-1 block text-xs font-black ${upcoming ? "text-sky-700" : completed ? "text-emerald-700" : "text-amber-800"}`}>{timeLabel}</span>
      </span>
      <span className="hidden shrink-0 items-center gap-1 text-xs font-black text-indigo-700 sm:inline-flex">
        {action}
        <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function ActivityStat({
  icon: Icon,
  label,
  value,
  attention = false
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  attention?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-3 sm:p-4 ${attention ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`grid size-8 place-items-center rounded-lg ${attention ? "bg-amber-400 text-amber-950" : "bg-sky-100 text-sky-800"}`}>
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <strong className="text-2xl font-black text-text-primary">{value}</strong>
      </div>
      <p className="mt-2 text-xs font-black leading-tight text-text-secondary">{label}</p>
    </div>
  );
}

function ActivityEmpty({
  icon: Icon,
  title,
  description
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-48 place-items-center px-5 py-8 text-center">
      <div>
        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <p className="mt-3 font-black text-text-primary">{title}</p>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading class activity" className="space-y-4">
      <div className="h-16 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div className="h-24 animate-pulse rounded-2xl bg-white" key={item} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((item) => (
          <div className="grid min-h-64 place-items-center rounded-[1.75rem] border border-slate-200 bg-white" key={item}>
            <Loader2 aria-hidden="true" className="size-7 animate-spin text-sky-600" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading what is happening in your classes.</span>
    </section>
  );
}

function formatActivityTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "soon";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}
