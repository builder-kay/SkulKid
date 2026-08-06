"use client";

import Link from "next/link";
import { Children, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  RefreshCw,
  School,
  Sparkles,
  Star,
  UsersRound
} from "lucide-react";
import type { StudentDashboardActivity } from "@/lib/classes/types";
import { isTimedChallengeQuiz, timedChallengeCountdown } from "@/lib/classes/timed-challenge";
import { CharacterAvatar } from "@/components/student/character-avatar";
import { useStudentProfile } from "@/lib/student/student-profile";

const emptyActivity: StudentDashboardActivity = {
  classes: [],
  quizzes: [],
  subjects: []
};
let activityCache: StudentDashboardActivity | null = null;
let activityCachedAt = 0;
let activityRequest: Promise<StudentDashboardActivity> | null = null;
const activityCacheLifetimeMs = 30_000;

async function readActivity(force = false) {
  if (!force && activityCache && Date.now() - activityCachedAt < activityCacheLifetimeMs) {
    return activityCache;
  }
  if (activityRequest) return activityRequest;
  activityRequest = fetch("/api/student/dashboard-activity")
    .then(async (response) => {
      const payload = await response.json() as StudentDashboardActivity & { error?: string };
      if (!response.ok) throw new Error(payload.error || "We could not load your class updates.");
      activityCache = {
        classes: payload.classes ?? [],
        quizzes: payload.quizzes ?? [],
        subjects: payload.subjects ?? []
      };
      activityCachedAt = Date.now();
      return activityCache;
    })
    .finally(() => {
      activityRequest = null;
    });
  return activityRequest;
}

export function DashboardClassActivity() {
  const [activity, setActivity] = useState<StudentDashboardActivity>(activityCache ?? emptyActivity);
  const [loading, setLoading] = useState(activityCache === null);
  const [error, setError] = useState("");

  async function loadActivity(force = false) {
    if (!activityCache) setLoading(true);
    setError("");
    try {
      setActivity(await readActivity(force));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not load your class updates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadActivity();
  }, []);

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
            onClick={() => void loadActivity(true)}
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
          <p className="mt-5 text-xs font-black uppercase tracking-wider text-sky-700">After-school class desk</p>
          <h2 className="mt-1 text-2xl font-black text-text-primary sm:text-3xl" id="class-activity-heading">
            Join a class to unlock your class cup
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary sm:text-base">
            When you join with your teacher&apos;s code, quizzes, class subjects and kind chat stickers show up here.
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
            <p className="text-xs font-black uppercase tracking-wider">Class shortcuts</p>
          </div>
          <h2 className="mt-1 text-2xl font-black text-text-primary sm:text-3xl" id="class-activity-heading">
            Happening in your classes
          </h2>
          <p className="mt-1 text-sm text-text-secondary">Beat the clock on challenge quizzes, then earn class cup XP.</p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-text-primary shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:self-auto"
          href="/classes"
        >
          All my classes
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {activity.quizzes.length ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-indigo-200 bg-white shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
                  <ClipboardList aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3 className="font-black text-text-primary">Class quizzes</h3>
                  <p className="text-xs font-semibold text-text-secondary">Timed challenges and open quizzes</p>
                </div>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-indigo-700 shadow-sm">{activity.quizzes.length}</span>
            </div>
            <ActivityCarousel label="Quiz challenges">
              {activity.quizzes.map((quiz) => <QuizShortcut key={quiz.id} quiz={quiz} />)}
            </ActivityCarousel>
          </div>
        ) : (
          <Link
            aria-label="Open my classes to check for quizzes"
            className="group block overflow-hidden rounded-[1.75rem] border border-indigo-200 bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            href="/classes"
          >
            <div className="flex items-center justify-between gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
                  <ClipboardList aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3 className="font-black text-text-primary">Class quizzes</h3>
                  <p className="text-xs font-semibold text-text-secondary">Timed challenges and open quizzes</p>
                </div>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-indigo-700 shadow-sm">0</span>
            </div>
            <ActivityEmpty
              cta="Open my classes"
              description="Great job checking! New quiz challenges will appear here."
              icon={CheckCircle2}
              title="No quiz waiting right now"
            />
          </Link>
        )}

        {activity.subjects.length ? (
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
            <ActivityCarousel label="Class subjects">
              {activity.subjects.map((subject) => (
                <SubjectShortcut key={subject.id} subject={subject} />
              ))}
            </ActivityCarousel>
          </div>
        ) : (
          <Link
            aria-label="Open my classes to find subjects"
            className="group block overflow-hidden rounded-[1.75rem] border border-emerald-200 bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            href="/classes"
          >
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
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-emerald-700 shadow-sm">0</span>
            </div>
            <ActivityEmpty
              cta="Open my classes"
              description="Your teacher's subject shortcuts will appear here."
              icon={BookOpen}
              title="No class subjects yet"
            />
          </Link>
        )}
      </div>
    </section>
  );
}

function QuizShortcut({ quiz }: { quiz: StudentDashboardActivity["quizzes"][number] }) {
  const { profile } = useStudentProfile();
  const upcoming = quiz.state === "upcoming";
  const completed = quiz.state === "completed";
  const timed = !upcoming && !completed && isTimedChallengeQuiz({
    startAt: quiz.startAt,
    deadline: quiz.deadline,
    status: "published"
  });
  const href = upcoming ? `/classes/${quiz.classId}` : `/classes/${quiz.classId}/quizzes/${quiz.id}`;
  const timeLabel = upcoming && quiz.startAt
    ? `Starts ${formatActivityTime(quiz.startAt)}`
    : timed && quiz.deadline
      ? timedChallengeCountdown(quiz.deadline)
      : quiz.deadline
        ? `Ends ${formatActivityTime(quiz.deadline)}`
        : "No end time";
  const action = upcoming ? "View class" : completed ? "View result" : timed ? "Beat the clock" : quiz.attemptsUsed > 0 ? "Continue" : "Start quiz";

  return (
    <Link
      className={`group block min-h-52 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 ${
        timed
          ? "border-rose-300 bg-gradient-to-br from-white to-rose-50/80 hover:border-rose-400 focus-visible:ring-rose-500"
          : "border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70 hover:border-indigo-300 focus-visible:ring-indigo-500"
      }`}
      href={href}
    >
      <span className="flex items-start justify-between gap-3">
        {timed ? (
          <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-white bg-gradient-to-br from-rose-100 to-amber-100 shadow-sm">
            <CharacterAvatar avatar={profile.avatar} className="size-full" label={`${profile.username} ready for the challenge`} motion="expressive" />
          </span>
        ) : (
          <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${completed ? "bg-emerald-100 text-emerald-700" : upcoming ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-800"}`}>
            {completed ? <CheckCircle2 aria-hidden="true" className="size-5" /> : upcoming ? <CalendarClock aria-hidden="true" className="size-5" /> : <Star aria-hidden="true" className="size-5" />}
          </span>
        )}
        <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-wide ${
          completed ? "bg-emerald-100 text-emerald-800" : timed ? "bg-rose-100 text-rose-900" : upcoming ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-900"
        }`}>
          {completed ? "Completed" : timed ? "Beat the clock" : upcoming ? "Coming soon" : "Ready now"}
        </span>
      </span>
      <span className="mt-3 block">
        <span className="line-clamp-2 text-lg font-black leading-6 text-text-primary">{quiz.title}</span>
        <span className="mt-1 block truncate text-sm font-bold text-text-secondary">{quiz.className}</span>
      </span>
      <span className="mt-3 grid grid-cols-2 gap-2 text-center">
        <span className="rounded-xl bg-white px-3 py-1.5 ring-1 ring-indigo-100">
          <strong className="block font-black text-indigo-800">{quiz.questionCount}</strong>
          <span className="text-[0.68rem] font-black uppercase text-slate-500">Questions</span>
        </span>
        <span className="rounded-xl bg-white px-3 py-1.5 ring-1 ring-indigo-100">
          <strong className="block font-black text-indigo-800">{quiz.baseXpReward}</strong>
          <span className="text-[0.68rem] font-black uppercase text-slate-500">XP reward</span>
        </span>
      </span>
      <span className="mt-3 flex items-center justify-between gap-3">
        <span className={`text-xs font-black ${upcoming ? "text-sky-700" : completed ? "text-emerald-700" : timed ? "text-rose-800" : "text-amber-800"}`}>{timeLabel}</span>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-black text-white ${timed ? "bg-rose-600" : "bg-indigo-700"}`}>
          {action}
          <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

function SubjectShortcut({ subject }: { subject: StudentDashboardActivity["subjects"][number] }) {
  const href = subject.courseSlug
    ? `/courses/${subject.courseSlug}?classId=${encodeURIComponent(subject.classId)}`
    : `/classes/${subject.classId}`;

  return (
    <Link
      className="group block min-h-52 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      href={href}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-xl font-black text-white shadow-sm">
          {subject.courseName.charAt(0).toUpperCase()}
        </span>
        <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-wide ${subject.isClassOnly ? "bg-violet-100 text-violet-800" : "bg-emerald-100 text-emerald-800"}`}>
          {subject.isClassOnly ? "My class only" : "Class learning"}
        </span>
      </span>
      <span className="mt-3 block">
        <span className="line-clamp-2 text-lg font-black leading-6 text-text-primary">{subject.courseName}</span>
        <span className="mt-1.5 inline-flex items-center gap-2 text-sm font-bold text-text-secondary">
          <School aria-hidden="true" className="size-4 text-emerald-700" />
          {subject.className}
        </span>
      </span>
      <span className="mt-3 block rounded-xl bg-white p-2.5 text-sm leading-5 text-slate-600 ring-1 ring-emerald-100">
        Continue with the lessons your teacher picked for this class.
      </span>
      <span className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">
        Open subject
        <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function ActivityCarousel({ label, children }: { label: string; children: React.ReactNode }) {
  const slides = Children.toArray(children);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  function moveTo(index: number) {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    const viewport = viewportRef.current;
    const track = viewport?.firstElementChild as HTMLElement | null;
    const slide = track?.children.item(next) as HTMLElement | null;
    if (!viewport || !slide) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollTo({
      left: slidePositionInViewport(viewport, slide),
      behavior: reducedMotion ? "auto" : "smooth"
    });
    setCurrent(next);
  }

  function updateCurrentFromScroll() {
    const viewport = viewportRef.current;
    const track = viewport?.firstElementChild as HTMLElement | null;
    if (!viewport || !track) return;
    const slideElements = Array.from(track.children) as HTMLElement[];
    let closest = 0;
    let distance = Number.POSITIVE_INFINITY;
    for (const [index, slide] of slideElements.entries()) {
      const nextDistance = Math.abs(slidePositionInViewport(viewport, slide) - viewport.scrollLeft);
      if (nextDistance < distance) {
        distance = nextDistance;
        closest = index;
      }
    }
    setCurrent(closest);
  }

  return (
    <div className="p-4 sm:p-5">
      <div
        aria-label={label}
        aria-roledescription="carousel"
        className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={updateCurrentFromScroll}
        ref={viewportRef}
        role="region"
      >
        <div className="flex snap-x snap-mandatory gap-3">
          {slides.map((slide, index) => (
            <div
              aria-label={`${index + 1} of ${slides.length}`}
              aria-roledescription="slide"
              className="min-w-full snap-start"
              key={index}
              role="group"
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            aria-label={`Previous ${label.toLowerCase()}`}
            className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            disabled={current === 0}
            onClick={() => moveTo(current - 1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <span aria-live="polite" className="text-xs font-black text-slate-600">
              {current + 1} of {slides.length}
            </span>
            <span aria-hidden="true" className="flex max-w-32 gap-1.5 overflow-hidden">
              {slides.map((_, index) => (
                <span
                  className={`h-2 rounded-full transition-all ${index === current ? "w-5 bg-sky-600" : "w-2 bg-slate-300"}`}
                  key={index}
                />
              ))}
            </span>
          </div>

          <button
            aria-label={`Next ${label.toLowerCase()}`}
            className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            disabled={current === slides.length - 1}
            onClick={() => moveTo(current + 1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function slidePositionInViewport(viewport: HTMLElement, slide: HTMLElement) {
  const viewportLeft = viewport.getBoundingClientRect().left;
  const slideLeft = slide.getBoundingClientRect().left;
  return Math.max(
    0,
    Math.min(viewport.scrollWidth - viewport.clientWidth, viewport.scrollLeft + slideLeft - viewportLeft)
  );
}

function ActivityEmpty({
  icon: Icon,
  title,
  description,
  cta
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  cta?: string;
}) {
  return (
    <div className="grid min-h-48 place-items-center px-5 py-8 text-center">
      <div>
        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <p className="mt-3 font-black text-text-primary">{title}</p>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
        {cta ? (
          <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
            {cta}
            <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-0.5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading class activity" className="space-y-4">
      <div className="h-16 animate-pulse rounded-2xl bg-slate-200/70" />
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
