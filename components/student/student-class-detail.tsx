"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Calculator,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  Languages,
  Layers3,
  Loader2,
  MessageSquareHeart,
  ShieldAlert,
  Sparkles,
  Trophy
} from "lucide-react";
import { ClassLeaderboardPanel, ClassLeaderboardStandings } from "@/components/student/class-leaderboard-panel";
import { StudentClassChat } from "@/components/student/student-class-chat";
import { StudentPageNav } from "@/components/student/student-page-nav";
import { StudentShell } from "@/components/student/student-shell";
import type { AdviceSuggestionType, ClassLeaderboardEntry, ClassQuizAttemptSummary, CourseVisibility, PointDeductionView } from "@/lib/classes/types";
import { cn } from "@/lib/utils";

type Detail = {
  classroom: { id: string; name: string; description: string; gradeLevel: number; teacherName: string };
  pastQuizCount: number;
  courses: Array<{
    id: string;
    courseId: string;
    courseName: string;
    courseSlug: string;
    description: string;
    colourToken: string;
    coverUrl: string | null;
    gradeLevels: number[];
    moduleCount: number;
    lessonCount: number;
    note: string;
    visibility: CourseVisibility;
    isClassOnly: boolean;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    description: string;
    questionCount: number;
    startAt: string | null;
    deadline: string | null;
    offPlatformReward: string;
    baseXpReward: number;
    passingScore: number;
    maxAttempts: number;
    status: string;
    attemptsUsed: number;
    canRetake: boolean;
    bestAttempt: ClassQuizAttemptSummary | null;
    attempts: ClassQuizAttemptSummary[];
    attempt: null | { scorePercentage: number; passed: boolean; starsAwarded: number; xpAwarded: number };
  }>;
  advice: Array<{
    id: string;
    message: string;
    suggestionType: AdviceSuggestionType;
    createdAt: string;
    readAt: string | null;
    teacherName: string;
  }>;
  deductions: PointDeductionView[];
  messages: Array<{ id: string; body: string; createdAt: string; fromStudent: boolean; senderId: string; senderName: string; senderRole: "student" | "teacher" | "admin"; kind: "discussion" | "announcement"; editedAt: string | null }>;
  chat: {
    enabled: boolean; locked: boolean; postingStartsAt: string | null; postingEndsAt: string | null;
    timezone: string; guardianConsentRequired: boolean; consentReady: boolean; withinHours: boolean;
    canPost: boolean; rules: string[];
  };
  notifications: Array<{ id: string; title: string; body: string; audience: string; createdAt: string }>;
  leaderboard: ClassLeaderboardEntry[];
};

const classSubjectThemes: Record<string, { gradient: string; icon: React.ElementType }> = {
  Mathematics: { gradient: "from-blue-700 via-blue-600 to-cyan-500", icon: Calculator },
  "English Language": { gradient: "from-violet-700 via-purple-600 to-fuchsia-500", icon: Languages },
  Science: { gradient: "from-emerald-700 via-green-600 to-teal-500", icon: FlaskConical }
};

function ClassSubjectCard({ classId, course }: { classId: string; course: Detail["courses"][number] }) {
  const theme = classSubjectThemes[course.courseName] ?? { gradient: "from-slate-900 via-indigo-800 to-violet-600", icon: BookOpen };
  const SubjectIcon = theme.icon;
  const empty = course.moduleCount === 0 && course.lessonCount === 0;
  const href = course.courseSlug
    ? `/courses/${course.courseSlug}?classId=${encodeURIComponent(classId)}`
    : `/classes/${classId}`;
  const grades = course.gradeLevels.length
    ? course.gradeLevels.length === 1
      ? `Grade ${course.gradeLevels[0]}`
      : `Grades ${Math.min(...course.gradeLevels)}–${Math.max(...course.gradeLevels)}`
    : "All grades";

  return (
    <Link
      aria-label={`Open subject: ${course.courseName}`}
      className="group block h-full rounded-[1.5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
      href={href}
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_50px_rgba(15,23,42,.14)]">
        <div className={cn("relative min-h-44 overflow-hidden bg-gradient-to-br p-5 text-white", theme.gradient)}>
          <span className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-white/15" />
          <span className="pointer-events-none absolute -bottom-12 right-20 size-28 rounded-full border-[18px] border-white/10" />
          {course.coverUrl ? <Image alt="" className="object-cover opacity-25 mix-blend-overlay transition duration-500 group-hover:scale-105" fill src={course.coverUrl} unoptimized /> : null}
          <div className="relative flex items-start justify-between gap-3">
            <span className="grid size-14 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <SubjectIcon aria-hidden="true" className="size-7" />
            </span>
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black ring-1 ring-white/20 backdrop-blur">
                <GraduationCap className="size-3.5" />{grades}
              </span>
              <span className="rounded-full bg-slate-950/20 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider backdrop-blur">
                {course.isClassOnly ? "My class only" : "Platform subject"}
              </span>
            </div>
          </div>
          <div className="relative mt-5">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-black uppercase tracking-[.12em] ring-1 ring-white/15">
              <Sparkles className="size-3.5 text-amber-300" />Class adventure
            </p>
            <h3 className="mt-2 text-2xl font-black leading-tight">{course.courseName}</h3>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">
            {course.note || course.description || "A learning adventure selected by your teacher for this class."}
          </p>

          {empty ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-amber-950"><Sparkles className="size-4 text-amber-600" />Coming together</p>
              <p className="mt-1 text-xs leading-5 text-amber-900">Your teacher is preparing the first strand and lesson.</p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-sky-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-sky-800">Ready for class</p>
              <p className="mt-1 text-sm text-sky-950">Open the subject to continue your teacher&apos;s learning path.</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 divide-x divide-slate-200 rounded-2xl border border-slate-200 py-3 text-center">
            <ClassSubjectStat icon={Layers3} label="Strands" value={course.moduleCount} />
            <ClassSubjectStat icon={BookOpen} label="Lessons" value={course.lessonCount} />
          </div>

          <div className="mt-auto pt-5">
            <span className={cn(
              "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 font-black text-white shadow-sm transition",
              empty ? "bg-slate-800 group-hover:bg-violet-700" : "bg-sky-700 group-hover:bg-sky-600"
            )}>
              {empty ? "View subject" : "Open subject"}
              <ArrowRight className="ml-auto size-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function ClassSubjectStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return <div className="px-3"><Icon className="mx-auto size-4 text-slate-400" /><strong className="mt-1 block text-lg text-slate-950">{value}</strong><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span></div>;
}

type SectionId = "quizzes" | "subjects" | "advice" | "board";

export function StudentClassDetail({ classId }: { classId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<SectionId>("quizzes");
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportMessage, setReportMessage] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [teacherMessage, setTeacherMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/student/classes/${classId}`, { cache: "no-store" });
      const payload = await response.json() as Detail & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load class.");
      setDetail(payload);
      const unread = (payload.advice ?? []).some((item) => !item.readAt);
      const openQuiz = (payload.quizzes ?? []).some((quiz) => quiz.canRetake || !quiz.attemptsUsed);
      if (unread) setSection("advice");
      else if (openQuiz) setSection("quizzes");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load class.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [classId]);

  async function markRead(adviceId: string) {
    await fetch(`/api/student/advice/${adviceId}/read`, { method: "POST" });
    setDetail((current) => current
      ? { ...current, advice: current.advice.map((item) => item.id === adviceId ? { ...item, readAt: new Date().toISOString() } : item) }
      : current);
  }

  async function reportDeduction(event: React.FormEvent, deductionId: string) {
    event.preventDefault();
    setSubmittingReport(true);
    setError("");
    try {
      const response = await fetch(`/api/student/point-deductions/${deductionId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reportMessage })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to report this deduction.");
      setReportingId(null);
      setReportMessage("");
      await load();
      setSection("advice");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to report this deduction.");
    } finally {
      setSubmittingReport(false);
    }
  }

  async function sendTeacherMessage(event: React.FormEvent) {
    event.preventDefault();
    setSendingMessage(true);
    setError("");
    try {
      const response = await fetch(`/api/student/classes/${classId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: teacherMessage })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to send your message.");
      setTeacherMessage("");
      await load();
      setSection("advice");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send your message.");
    } finally {
      setSendingMessage(false);
    }
  }

  const unreadAdvice = useMemo(
    () => detail?.advice.filter((item) => !item.readAt).length ?? 0,
    [detail]
  );
  const openQuizzes = useMemo(
    () => detail?.quizzes.filter((quiz) => {
      const now = Date.now();
      const started = !quiz.startAt || new Date(quiz.startAt).getTime() <= now;
      const notEnded = !quiz.deadline || new Date(quiz.deadline).getTime() > now;
      return quiz.status !== "closed" && started && notEnded && (quiz.canRetake || !quiz.attemptsUsed);
    }).length ?? 0,
    [detail]
  );
  const leaderboard = detail?.leaderboard ?? [];
  const boardPanel = <ClassLeaderboardPanel entries={leaderboard} loading={loading} />;

  if (loading) {
    return (
      <StudentShell activeItem="classes" mobileAside={<ClassLeaderboardPanel entries={[]} loading />}>
        <main className="mx-auto w-full max-w-7xl space-y-5">
          <div className="h-10 w-40 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-52 animate-pulse rounded-[2rem] bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-[1.5rem] bg-slate-200" />
            <div className="h-40 animate-pulse rounded-[1.5rem] bg-slate-200" />
          </div>
        </main>
      </StudentShell>
    );
  }

  if (!detail) {
    return (
      <StudentShell activeItem="classes">
        <main className="mx-auto w-full max-w-3xl">
          <StudentPageNav backHref="/classes" backLabel="Back to classes" crumbs={[{ label: "My Classes", href: "/classes" }, { label: "Not found" }]} />
          <div className="mt-5 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <p className="font-black">{error || "Class not found."}</p>
          </div>
        </main>
      </StudentShell>
    );
  }

  const tabs: Array<{ id: SectionId; label: string; icon: typeof ClipboardList; count?: number }> = [
    { id: "quizzes", label: "Quizzes", icon: ClipboardList, count: openQuizzes || undefined },
    { id: "subjects", label: "Subjects", icon: BookOpen, count: detail.courses.length || undefined },
    { id: "advice", label: "Messages", icon: MessageSquareHeart, count: unreadAdvice || undefined },
    { id: "board", label: "Board", icon: Trophy }
  ];

  return (
    <StudentShell activeItem="classes" mobileAside={<ClassLeaderboardPanel entries={leaderboard} idPrefix="mobile-" />}>
      <main className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid min-w-0 gap-5 sm:gap-6">
            <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_24px_60px_rgba(8,47,73,.3)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 12% 20%, rgba(34,211,238,.28), transparent 40%), radial-gradient(circle at 88% 12%, rgba(56,189,248,.18), transparent 34%), linear-gradient(160deg, #0f172a 0%, #0c4a6e 58%, #155e75 100%)"
                }}
              />
              <div className="relative p-6 sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200/90">
                  Basic {detail.classroom.gradeLevel} · Teacher {detail.classroom.teacherName}
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{detail.classroom.name}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  {detail.classroom.description || "Quizzes, subjects and tips from your teacher live here."}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold ring-1 ring-white/15">
                    <ClipboardList className="size-4 text-amber-300" />
                    {openQuizzes} open quiz{openQuizzes === 1 ? "" : "zes"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold ring-1 ring-white/15">
                    <BookOpen className="size-4 text-cyan-200" />
                    {detail.courses.length} subjects
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold ring-1 ring-white/15">
                    <MessageSquareHeart className="size-4 text-rose-200" />
                    {unreadAdvice} new tip{unreadAdvice === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </header>

            <StudentPageNav
              backHref="/classes"
              backLabel="Back to classes"
              crumbs={[
                { label: "Home", href: "/dashboard" },
                { label: "My Classes", href: "/classes" },
                { label: detail.classroom.name }
              ]}
            />

            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Class sections">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = section === tab.id;
                return (
                  <button
                    aria-selected={active}
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                      active ? "bg-sky-600 text-white shadow-md" : "border border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-800"
                    )}
                    key={tab.id}
                    onClick={() => setSection(tab.id)}
                    role="tab"
                    type="button"
                  >
                    <Icon className="size-4" />
                    {tab.label}
                    {typeof tab.count === "number" ? (
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-black", active ? "bg-white/20 text-white" : "bg-sky-100 text-sky-800")}>
                        {tab.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {section === "quizzes" ? (
              <section className="grid gap-4" id="class-quizzes">
                {detail.pastQuizCount > 0 ? <Link className="flex min-h-16 items-center justify-between gap-3 rounded-[1.25rem] border border-orange-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 text-orange-950 shadow-sm" href={`/pasco?classId=${classId}`}><span className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-orange-500 text-white"><BookMarked className="size-5" /></span><span><b className="block">Review past quizzes in PASCO</b><span className="text-xs font-bold text-orange-700">{detail.pastQuizCount} ended quiz{detail.pastQuizCount === 1 ? "" : "zes"} from this class</span></span></span><ArrowRight className="size-5" /></Link> : null}
                {detail.quizzes.length === 0 ? (
                  <EmptyBlock title="No active quizzes" text={detail.pastQuizCount ? "Ended quizzes have moved to PASCO for revision." : "Your teacher has not published a class quiz. Check back soon."} />
                ) : detail.quizzes.map((quiz) => {
                  const best = quiz.bestAttempt ?? quiz.attempt;
                  const overdue = quiz.deadline ? new Date(quiz.deadline).getTime() < Date.now() : false;
                  const upcoming = quiz.startAt ? new Date(quiz.startAt).getTime() > Date.now() : false;
                  return (
                    <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm" key={quiz.id}>
                      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-slate-950">{quiz.title}</h3>
                            {quiz.status === "closed" || overdue ? (
                              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-black uppercase text-white">Quiz Ended</span>
                            ) : upcoming ? (
                              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-black uppercase text-blue-800">Coming soon</span>
                            ) : !quiz.attemptsUsed ? (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black uppercase text-emerald-800">New</span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {quiz.questionCount} questions · {quiz.baseXpReward} XP · pass {quiz.passingScore}% · {quiz.attemptsUsed}/{quiz.maxAttempts} attempts
                          </p>
                          {quiz.startAt ? <p className="mt-1 text-xs font-bold text-blue-700">Starts {new Date(quiz.startAt).toLocaleString()}</p> : null}
                          {quiz.deadline ? (
                            <p className={cn("mt-1 text-xs font-bold", overdue ? "text-amber-700" : "text-sky-700")}>
                              Due {new Date(quiz.deadline).toLocaleString()}
                            </p>
                          ) : null}
                          {!quiz.startAt && !quiz.deadline ? <p className="mt-1 text-xs font-bold text-sky-700">Available until your teacher ends it</p> : null}
                          {quiz.offPlatformReward ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><b>Class reward:</b> {quiz.offPlatformReward}</div> : null}
                          {best ? (
                            <p className="mt-2 text-sm font-bold text-emerald-700">
                              Best {best.scorePercentage}% · {best.xpAwarded} XP · {best.starsAwarded} stars
                            </p>
                          ) : null}
                        </div>
                        {quiz.status === "closed" || overdue ? <span className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600">Quiz Ended</span> : upcoming ? <span className="rounded-xl bg-blue-50 px-5 py-3 text-sm font-black text-blue-800">Opens {new Date(quiz.startAt!).toLocaleString()}</span> : !quiz.attemptsUsed ? (
                          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-black text-white hover:bg-sky-700" href={`/classes/${classId}/quizzes/${quiz.id}`}>
                            Take quiz <ArrowRight className="size-4" />
                          </Link>
                        ) : quiz.canRetake ? (
                          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-black text-white hover:bg-amber-600" href={`/classes/${classId}/quizzes/${quiz.id}`}>
                            Retake quiz <ArrowRight className="size-4" />
                          </Link>
                        ) : (
                          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 hover:bg-slate-50" href={`/classes/${classId}/quizzes/${quiz.id}`}>
                            View result
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            ) : null}

            {section === "subjects" ? (
              <section className="grid gap-4 sm:grid-cols-2">
                {detail.courses.length === 0 ? (
                  <div className="sm:col-span-2">
                    <EmptyBlock
                      title="No subjects assigned"
                      text="Your teacher has not assigned subjects yet."
                      action={<Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-600 px-4 font-black text-white" href="/courses">Browse platform subjects <ArrowRight className="size-4" /></Link>}
                    />
                  </div>
                ) : detail.courses.map((course) => <ClassSubjectCard classId={classId} course={course} key={course.id} />)}
              </section>
            ) : null}

            {section === "advice" ? (
              <section className="grid gap-4">
                <StudentClassChat
                  advice={detail.advice}
                  chat={detail.chat}
                  classId={classId}
                  className={detail.classroom.name}
                  messages={detail.messages}
                  notifications={detail.notifications}
                  onChange={setTeacherMessage}
                  onReadAdvice={(adviceId) => void markRead(adviceId)}
                  onReported={() => void load()}
                  onSubmit={sendTeacherMessage}
                  sending={sendingMessage}
                  teacherName={detail.classroom.teacherName}
                  value={teacherMessage}
                />
                {detail.deductions.length ? <div className="mt-2"><p className="text-xs font-black uppercase tracking-wider text-amber-800">Points and safety reports</p><h2 className="mt-1 text-xl font-black text-slate-950">Account activity</h2></div> : null}
                {detail.deductions.map((item) => (
                  <article className={cn("rounded-[1.5rem] border p-5 shadow-sm", item.status === "reversed" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")} key={item.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800"><ShieldAlert className="size-4" />Point deduction</span>
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", item.status === "reversed" ? "bg-emerald-200 text-emerald-900" : item.dispute?.status === "open" ? "bg-blue-100 text-blue-900" : "bg-amber-200 text-amber-950")}>{item.status === "reversed" ? "Reversed" : item.dispute?.status === "open" ? "Under admin review" : `-${item.amount} points`}</span>
                    </div>
                    <p className="mt-3 font-black text-slate-950">{item.teacherName} deducted {item.amount} points</p>
                    <p className="mt-1 text-sm leading-7 text-slate-800">{item.reason}</p>
                    <p className="mt-2 text-xs font-bold text-slate-600">Balance: {item.balanceBefore} → {item.balanceAfter} · {new Date(item.createdAt).toLocaleString()}</p>
                    {item.dispute ? (
                      <div className="mt-4 rounded-xl bg-white/70 p-3 text-sm"><p className="font-black">Your report: {item.dispute.status}</p><p className="mt-1 text-slate-700">{item.dispute.message}</p>{item.dispute.resolutionNote ? <p className="mt-2 font-bold text-slate-800">Admin response: {item.dispute.resolutionNote}</p> : null}</div>
                    ) : reportingId === item.id ? (
                      <form className="mt-4 grid gap-2" onSubmit={(event) => void reportDeduction(event, item.id)}>
                        <label className="text-sm font-black text-slate-900">Why do you believe this deduction is wrong?</label>
                        <textarea className="min-h-24 rounded-xl border border-amber-300 bg-white px-3 py-2" maxLength={600} minLength={12} onChange={(event) => setReportMessage(event.target.value)} required value={reportMessage} />
                        <div className="flex gap-2"><button className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={submittingReport || reportMessage.trim().length < 12} type="submit">Send report</button><button className="rounded-xl px-3 text-sm font-bold" onClick={() => { setReportingId(null); setReportMessage(""); }} type="button">Cancel</button></div>
                        <p className="text-xs font-bold text-slate-600">Your teacher can see the report, and it is also logged for platform administrators.</p>
                      </form>
                    ) : item.status !== "reversed" ? (
                      <button className="mt-4 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-black text-rose-800" onClick={() => setReportingId(item.id)} type="button">Report wrongful deduction</button>
                    ) : null}
                  </article>
                ))}
              </section>
            ) : null}

            {section === "board" ? <ClassLeaderboardStandings entries={leaderboard} /> : null}

            {/* Mobile: compact board access matching platform medal drawer pattern */}
            <div className="xl:hidden">
              <button
                className="flex w-full items-center justify-between gap-3 rounded-[1.5rem] border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-4 text-left shadow-sm"
                onClick={() => setSection("board")}
                type="button"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-sky-600 text-white">
                    <Trophy className="size-5" />
                  </span>
                  <span>
                    <span className="block font-black text-slate-950">Class leaderboard</span>
                    <span className="block text-xs font-bold text-sky-700">Open full standings · or tap the medal icon for the live board</span>
                  </span>
                </span>
                <ArrowRight className="size-5 text-sky-700" />
              </button>
            </div>
          </div>

          <div className="hidden xl:block xl:sticky xl:top-8 xl:self-start">
            {boardPanel}
          </div>
        </div>
      </main>
    </StudentShell>
  );
}

function EmptyBlock({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-6 text-center sm:p-8">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sky-50 text-sky-700">
        <Sparkles className="size-5" />
      </span>
      <h3 className="mt-3 text-lg font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">{text}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
