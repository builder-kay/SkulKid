"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Loader2, Star, Trophy } from "lucide-react";
import { StudentShell } from "@/components/student/student-shell";
import { StudentPageNav } from "@/components/student/student-page-nav";
import { applyServerGameState } from "@/lib/gamification/student-game";
import type { ClassQuizAttemptSummary } from "@/lib/classes/types";
import type { GameState } from "@/lib/gamification/student-game";

type QuizPayload = {
  quiz: {
    id: string;
    classId: string;
    title: string;
    description: string;
    startAt: string | null;
    deadline: string | null;
    offPlatformReward: string;
    baseXpReward: number;
    passingScore: number;
    maxAttempts: number;
    status: string;
    questions: Array<{ id: string; prompt: string; type: string; options: string[] }>;
  };
  attempts: ClassQuizAttemptSummary[];
  bestAttempt: ClassQuizAttemptSummary | null;
  attemptsUsed: number;
  canRetake: boolean;
  attempt: null | { scorePercentage: number; passed: boolean; starsAwarded: number; xpAwarded: number };
};

type SubmitResult = {
  scorePercentage: number;
  passed: boolean;
  starsAwarded: number;
  xpAwarded: number;
  attemptNumber: number;
  attemptsUsed: number;
  maxAttempts: number;
  canRetake: boolean;
  bestScore: number;
  gameState?: Partial<GameState>;
  appliesToPlatform?: boolean;
  review?: Array<{questionId:string;prompt:string;correctAnswer:string;explanation:string}>;
};

export function ClassQuizPlayer({ classId, quizId }: { classId: string; quizId: string }) {
  const [payload, setPayload] = useState<QuizPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [retaking, setRetaking] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [headerCompact, setHeaderCompact] = useState(false);

  useEffect(() => {
    const updateHeader = () => setHeaderCompact(window.scrollY > 88);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`/api/student/classes/${classId}/quizzes/${quizId}`, { cache: "no-store" });
        const data = await response.json() as QuizPayload & { error?: string };
        if (!response.ok) throw new Error(data.error || "Unable to load quiz.");
        setPayload({
          ...data,
          attempts: data.attempts ?? [],
          attemptsUsed: data.attemptsUsed ?? data.attempts?.length ?? 0,
          canRetake: Boolean(data.canRetake),
          bestAttempt: data.bestAttempt ?? null
        });
        if ((data.attemptsUsed ?? data.attempts?.length ?? 0) > 0 && !data.canRetake) {
          const best = data.bestAttempt ?? data.attempt;
          if (best) {
            setResult({
              scorePercentage: best.scorePercentage,
              passed: best.passed,
              starsAwarded: best.starsAwarded,
              xpAwarded: best.xpAwarded,
              attemptNumber: "attemptNumber" in best ? Number(best.attemptNumber) : data.attemptsUsed,
              attemptsUsed: data.attemptsUsed,
              maxAttempts: data.quiz.maxAttempts,
              canRetake: false,
              bestScore: best.scorePercentage
            });
          }
        } else if ((data.attemptsUsed ?? 0) > 0 && data.canRetake && !retaking) {
          const best = data.bestAttempt ?? data.attempt;
          if (best) {
            setResult({
              scorePercentage: best.scorePercentage,
              passed: best.passed,
              starsAwarded: best.starsAwarded,
              xpAwarded: best.xpAwarded,
              attemptNumber: "attemptNumber" in best ? Number(best.attemptNumber) : data.attemptsUsed,
              attemptsUsed: data.attemptsUsed,
              maxAttempts: data.quiz.maxAttempts,
              canRetake: true,
              bestScore: best.scorePercentage
            });
          }
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load quiz.");
      } finally {
        setLoading(false);
      }
    })();
  }, [classId, quizId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!payload) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/student/classes/${classId}/quizzes/${quizId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: payload.quiz.questions.map((question) => ({
            questionId: question.id,
            selectedIndex: answers[question.id] ?? -1
          }))
        })
      });
      const data = await response.json() as SubmitResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to submit quiz.");
      setResult(data);
      setRetaking(false);
      setPayload((current) => current
        ? {
            ...current,
            attemptsUsed: data.attemptsUsed,
            canRetake: data.canRetake,
            bestAttempt: {
              attemptNumber: data.attemptNumber,
              scorePercentage: data.bestScore,
              passed: data.passed || (current.bestAttempt?.passed ?? false),
              starsAwarded: data.starsAwarded,
              xpAwarded: data.xpAwarded,
              submittedAt: new Date().toISOString()
            }
          }
        : current);
      if (data.gameState) {
        applyServerGameState(data.gameState);
      } else {
        const refreshed = await fetch("/api/student/game-state", { cache: "no-store" });
        if (refreshed.ok) {
          const body = await refreshed.json() as { state: Partial<GameState> | null };
          applyServerGameState(body.state);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  function startRetake() {
    setAnswers({});
    setResult(null);
    setRetaking(true);
    setError("");
    setQuestionIndex(0);
  }

  if (loading) {
    return <StudentShell activeItem="classes"><div className="grid place-items-center p-16 text-slate-500"><Loader2 className="size-7 animate-spin" /></div></StudentShell>;
  }

  if (!payload) {
    const ended = error.trim().toLowerCase() === "quiz ended";
    return (
      <StudentShell activeItem="classes">
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6">
          <p className="text-xl font-black text-amber-950">{error || "Quiz not found."}</p>
          <p className="mt-2 text-sm text-amber-900">{ended ? "This challenge has moved to PASCO, where you can review every answer and practise again." : "Return to your class and choose another activity."}</p>
          <div className="mt-4 flex flex-wrap gap-3">{ended ? <Link className="inline-flex min-h-11 items-center rounded-xl bg-orange-600 px-4 text-sm font-black text-white" href={`/pasco/${quizId}`}>Open in PASCO</Link> : null}<Link className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-sm font-bold text-primary" href={`/classes/${classId}`}><ArrowLeft className="size-4" />Back to class</Link></div>
        </div>
      </StudentShell>
    );
  }

  const nextAttemptNumber = (result?.attemptsUsed ?? payload.attemptsUsed) + (retaking || !result ? 1 : 0);
  const showForm = !result || retaking;
  const progressPercent = showForm ? ((questionIndex + 1) / payload.quiz.questions.length) * 100 : 100;
  const endLabel = payload.quiz.deadline
    ? `Ends ${new Date(payload.quiz.deadline).toLocaleString()}`
    : "Teacher ends quiz";

  return (
    <StudentShell activeItem="classes">
      <main className="mx-auto grid w-full max-w-3xl gap-5">
        <header
          className={`sticky top-[4.25rem] z-20 overflow-hidden border border-slate-200 bg-white/95 shadow-sm backdrop-blur transition-[padding,border-radius,box-shadow] duration-200 motion-reduce:transition-none lg:top-0 ${headerCompact ? "rounded-2xl px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,.14)]" : "rounded-[1.75rem] p-5"}`}
          data-compact={headerCompact}
        >
          <div className={`grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none ${headerCompact ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`} aria-hidden={!headerCompact}>
            <div className="min-h-0 overflow-hidden">
              <div className="flex items-center justify-between gap-3">
                <p className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-black text-amber-800 sm:text-sm">
                  <Clock3 aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{endLabel}</span>
                </p>
                <span className="shrink-0 text-xs font-black text-slate-700">
                  {showForm ? `${questionIndex + 1}/${payload.quiz.questions.length}` : "Complete"}
                </span>
              </div>
            </div>
          </div>
          <div className={`grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none ${headerCompact ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`} aria-hidden={headerCompact}>
            <div className="min-h-0 overflow-hidden">
          <p className="text-xs font-black uppercase tracking-wider text-blue-700">Class quiz</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">{payload.quiz.title}</h1>
          <p className="mt-2 text-sm text-slate-600">{payload.quiz.description || `${payload.quiz.baseXpReward} XP · pass ${payload.quiz.passingScore}%`}</p>
          <p className="mt-2 text-sm font-bold text-slate-700">
            {showForm
              ? `Attempt ${Math.min(nextAttemptNumber, payload.quiz.maxAttempts)} of ${payload.quiz.maxAttempts}`
              : `Attempts used ${result?.attemptsUsed ?? payload.attemptsUsed} of ${payload.quiz.maxAttempts}`}
          </p>
          {payload.quiz.deadline ? <p className="mt-2 text-sm font-bold text-amber-700">Deadline {new Date(payload.quiz.deadline).toLocaleString()}</p> : null}
          {!payload.quiz.deadline ? <p className="mt-2 text-sm font-bold text-sky-700">Available until your teacher ends it</p> : null}
          {payload.quiz.offPlatformReward ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><Trophy className="mr-2 inline size-4 text-amber-600" /><b>Class reward:</b> {payload.quiz.offPlatformReward}</div> : null}
            </div>
          </div>
          {showForm ? (
            <div className={headerCompact ? "mt-2" : "mt-4"}>
              <div className="flex items-center gap-3">
                <div
                  aria-label="Quiz progress"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={Math.round(progressPercent)}
                  className={`flex-1 overflow-hidden rounded-full bg-slate-100 ${headerCompact ? "h-2" : "h-2.5"}`}
                  role="progressbar"
                >
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-300 motion-reduce:transition-none" style={{ width: `${progressPercent}%` }} />
                </div>
                {!headerCompact ? <span className="text-xs font-black">{questionIndex + 1}/{payload.quiz.questions.length}</span> : null}
              </div>
            </div>
          ) : null}
        </header>
        <StudentPageNav
          backHref={`/classes/${classId}`}
          backLabel="Back to class"
          crumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "My Classes", href: "/classes" },
            { label: payload.quiz.title }
          ]}
        />

        {result && !retaking ? (
          <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              {result.passed ? <Trophy className="size-8 text-amber-500" /> : <CheckCircle2 className="size-8 text-emerald-600" />}
              <div>
                <h2 className="text-2xl font-black">{result.passed ? "Great work!" : "Quiz submitted"}</h2>
                <div className="mt-2 flex justify-center gap-1 sm:justify-start" aria-label={`${result.starsAwarded} stars earned`}>{[1,2,3].map(star=><Star className={`size-7 ${star<=result.starsAwarded?"fill-amber-400 text-amber-400":"text-slate-300"}`} key={star}/>)}</div>
                <p className="text-sm">Score {result.scorePercentage}% · {result.xpAwarded} XP earned · {result.starsAwarded} stars earned</p>
                <p className="mt-1 text-sm">Best score {result.bestScore}% · Attempt {result.attemptNumber} of {result.maxAttempts}</p>
                {result.xpAwarded > 0 || result.starsAwarded > 0 ? (
                  <p className="mt-2 text-sm font-bold text-emerald-800">These rewards also count on your platform XP, stars, streak and leaderboard.</p>
                ) : (
                  <p className="mt-2 text-sm font-bold text-emerald-800">No new XP this attempt — beat your best score to earn more platform points.</p>
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {result.canRetake ? (
                <button className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-black text-white" onClick={startRetake} type="button">
                  Retake quiz
                </button>
              ) : null}
              <Link className="inline-flex rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-black text-emerald-900" href={`/classes/${classId}`}>Return to class</Link>
            </div>
            {result.review?.length ? <div className="mt-6 grid gap-3 text-left">{result.review.map((item,index)=><article className="rounded-xl border border-emerald-200 bg-white p-4" key={item.questionId}><p className="text-xs font-black uppercase text-emerald-700">Question {index+1}</p><h3 className="mt-1 font-black">{item.prompt}</h3><p className="mt-2 text-sm"><b>Correct answer:</b> {item.correctAnswer}</p>{item.explanation?<p className="mt-1 text-sm text-slate-600">{item.explanation}</p>:null}</article>)}</div>:null}
          </section>
        ) : (
          <form className="grid gap-4" onSubmit={submit}>
            {payload.quiz.questions.map((question, index) => index !== questionIndex ? null : (
              <fieldset className="rounded-[1.5rem] border border-slate-200 bg-white p-5" key={question.id}>
                <legend className="px-1 text-sm font-black text-slate-500">Question {index + 1}</legend>
                <p className="mt-1 font-black text-slate-950">{question.prompt}</p>
                <div className="mt-4 grid gap-2">
                  {question.options.map((option, optionIndex) => (
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-bold ${answers[question.id] === optionIndex ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 bg-slate-50 text-slate-700"}`} key={`${question.id}-${optionIndex}`}>
                      <input
                        checked={answers[question.id] === optionIndex}
                        className="size-4"
                        name={question.id}
                        onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                        required
                        type="radio"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            {error ? <p className="text-sm font-bold text-amber-800">{error}</p> : null}
            <div className="flex justify-between gap-3">
              <button className="inline-flex min-h-12 items-center gap-2 rounded-xl border px-5 font-black disabled:opacity-40" disabled={questionIndex===0} onClick={()=>setQuestionIndex(i=>i-1)} type="button"><ArrowLeft className="size-4"/>Back</button>
              {questionIndex < payload.quiz.questions.length-1 ? <button className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 font-black text-white disabled:opacity-50" disabled={answers[payload.quiz.questions[questionIndex].id]===undefined} onClick={()=>setQuestionIndex(i=>i+1)} type="button">Next<ArrowRight className="size-4"/></button>:
              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 font-black text-slate-950 disabled:opacity-60" disabled={submitting||Object.keys(answers).length<payload.quiz.questions.length} type="submit">{submitting?<Loader2 className="size-4 animate-spin"/>:<Trophy className="size-4"/>}Submit challenge</button>}
            </div>
          </form>
        )}
      </main>
    </StudentShell>
  );
}
