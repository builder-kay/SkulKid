"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Loader2,
  MessageSquareHeart,
  ShieldAlert,
  Sparkles,
  Trophy
} from "lucide-react";
import { ClassLeaderboardPanel, ClassLeaderboardStandings } from "@/components/student/class-leaderboard-panel";
import { StudentPageNav } from "@/components/student/student-page-nav";
import { StudentShell } from "@/components/student/student-shell";
import type { AdviceSuggestionType, ClassLeaderboardEntry, ClassQuizAttemptSummary, CourseVisibility, PointDeductionView } from "@/lib/classes/types";
import { cn } from "@/lib/utils";

type Detail = {
  classroom: { id: string; name: string; description: string; gradeLevel: number; teacherName: string };
  courses: Array<{
    id: string;
    courseId: string;
    courseName: string;
    courseSlug: string;
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
  messages: Array<{ id: string; body: string; createdAt: string; fromStudent: boolean }>;
  notifications: Array<{ id: string; title: string; body: string; audience: string; createdAt: string }>;
  leaderboard: ClassLeaderboardEntry[];
};

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
    { id: "advice", label: "Messages & points", icon: MessageSquareHeart, count: unreadAdvice || undefined },
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
                {detail.quizzes.length === 0 ? (
                  <EmptyBlock title="No quizzes yet" text="Your teacher has not published a class quiz. Check back soon." />
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
                ) : detail.courses.map((course) => (
                  <Link
                    className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
                    href={course.courseSlug ? `/courses/${course.courseSlug}` : "/courses"}
                    key={course.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <BookOpen className="size-5" />
                      </span>
                      {course.isClassOnly ? (
                        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-sky-800">Class only</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-slate-600">Platform</span>
                      )}
                    </div>
                    <h3 className="mt-4 text-lg font-black text-slate-950">{course.courseName}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{course.note || "Assigned class adventure"}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-sky-700 transition group-hover:gap-2.5">
                      Open subject <ArrowRight className="size-4" />
                    </span>
                  </Link>
                ))}
              </section>
            ) : null}

            {section === "advice" ? (
              <section className="grid gap-4">
                <form className="rounded-[1.5rem] border border-sky-200 bg-white p-5 shadow-sm" onSubmit={sendTeacherMessage}>
                  <h2 className="text-lg font-black text-slate-950">Message {detail.classroom.teacherName}</h2>
                  <p className="mt-1 text-sm text-slate-600">Ask a question or send a private class message to your teacher.</p>
                  <textarea className="mt-3 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2" maxLength={1000} onChange={(event) => setTeacherMessage(event.target.value)} placeholder="Write your message…" required value={teacherMessage} />
                  <button className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 font-black text-white disabled:opacity-50" disabled={sendingMessage || !teacherMessage.trim()} type="submit">{sendingMessage ? <Loader2 className="size-4 animate-spin" /> : <MessageSquareHeart className="size-4" />}Send to teacher</button>
                </form>
                {detail.notifications.map((item) => (
                  <article className="rounded-[1.5rem] border border-violet-200 bg-violet-50 p-5 shadow-sm" key={item.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black uppercase tracking-wider text-violet-700">Teacher notification</span><time className="text-xs font-bold text-slate-500">{new Date(item.createdAt).toLocaleString()}</time></div>
                    <h2 className="mt-3 text-lg font-black text-slate-950">{item.title}</h2><p className="mt-2 text-sm leading-7 text-slate-700">{item.body}</p>
                  </article>
                ))}
                {detail.messages.map((item) => (
                  <article className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-4 shadow-sm" key={item.id}><p className="text-xs font-black uppercase tracking-wider text-sky-700">You sent to {detail.classroom.teacherName}</p><p className="mt-2 text-sm leading-6 text-slate-800">{item.body}</p><time className="mt-2 block text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</time></article>
                ))}
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
                {detail.advice.length === 0 ? (
                  detail.deductions.length === 0 && detail.notifications.length === 0 && detail.messages.length === 0 ? <EmptyBlock title="No messages yet" text="Teacher tips, notifications and point changes will show up here." /> : null
                ) : detail.advice.map((item) => (
                  <article className={cn("rounded-[1.5rem] border p-5 shadow-sm", item.readAt ? "border-slate-200 bg-white" : "border-sky-200 bg-sky-50")} key={item.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="grid size-9 place-items-center rounded-xl bg-white text-sky-700 shadow-sm">
                        <MessageSquareHeart className="size-4" />
                      </span>
                      <p className="text-xs font-black uppercase tracking-wider text-sky-700">
                        {item.suggestionType === "class_adventure" ? "Class adventure" : item.suggestionType === "platform_adventure" ? "Platform adventure" : "Encouragement"}
                      </p>
                      {!item.readAt ? (
                        <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950">New</span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-800">{item.message}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {!item.readAt ? (
                        <button className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-black text-white hover:bg-sky-700" onClick={() => void markRead(item.id)} type="button">
                          Mark as read
                        </button>
                      ) : null}
                      {item.suggestionType === "platform_adventure" ? (
                        <Link className="text-xs font-black text-sky-700" href="/courses">Go to Subjects</Link>
                      ) : null}
                      {item.suggestionType === "class_adventure" ? (
                        <button className="text-xs font-black text-sky-700" onClick={() => setSection("quizzes")} type="button">See class quizzes</button>
                      ) : null}
                    </div>
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
