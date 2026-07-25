"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, History, Loader2, RotateCcw, Star, Trophy, XCircle } from "lucide-react";
import { StudentShell } from "@/components/student/student-shell";
import { StudentPageNav } from "@/components/student/student-page-nav";
import { cn } from "@/lib/utils";
import { scorePascoPractice } from "@/lib/quizzes/pasco-rules";

type Question = { id: string; prompt: string; type: string; options: string[]; correctIndex: number; correctAnswer: string; explanation: string };
type Attempt = { attemptNumber: number; scorePercentage: number; passed: boolean; starsAwarded: number; xpAwarded: number; submittedAt: string; answers: Array<{ questionId: string; selectedIndex: number; correct: boolean }> };
type Payload = {
  quiz: { id: string; classId: string; className: string; gradeLevel: number; title: string; description: string; questions: Question[]; endedAt: string; endedByTeacher: boolean; baseXpReward: number; passingScore: number; offPlatformReward: string };
  attempts: Attempt[]; bestAttempt: Attempt | null;
};

export function PascoQuizPage({ quizId }: { quizId: string }) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [mode, setMode] = useState<"review" | "practice">("review");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { void (async () => {
    try {
      const response = await fetch(`/api/student/pasco/${quizId}`, { cache: "no-store" });
      const data = await response.json() as Payload & { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to load this PASCO quiz.");
      setPayload(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load this PASCO quiz."); }
    finally { setLoading(false); }
  })(); }, [quizId]);

  if (loading) return <StudentShell activeItem="pasco"><div className="grid min-h-96 place-items-center"><Loader2 className="size-7 animate-spin text-orange-600" /></div></StudentShell>;
  if (!payload) return <StudentShell activeItem="pasco"><main className="mx-auto max-w-2xl"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-black">{error || "PASCO quiz not found."}</h1><Link className="mt-4 inline-flex items-center gap-2 font-black text-orange-700" href="/pasco"><ArrowLeft className="size-4" />Back to PASCO</Link></div></main></StudentShell>;

  return <StudentShell activeItem="pasco"><main className="mx-auto grid w-full max-w-5xl gap-5">
    <StudentPageNav backHref="/pasco" backLabel="Back to PASCO" crumbs={[{ label: "Home", href: "/dashboard" }, { label: "PASCO", href: "/pasco" }, { label: payload.quiz.title }]} />
    <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-orange-950 to-rose-900 p-6 text-white shadow-xl sm:p-8"><p className="text-xs font-black uppercase tracking-[.16em] text-amber-300">PASCO · {payload.quiz.className}</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{payload.quiz.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-orange-100">{payload.quiz.description || "Review this past quiz and practise at your own pace."}</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-black"><span className="rounded-full bg-white/10 px-3 py-2">{payload.quiz.questions.length} questions</span><span className="rounded-full bg-white/10 px-3 py-2">Pass mark {payload.quiz.passingScore}%</span><span className="rounded-full bg-white/10 px-3 py-2">Ended {new Date(payload.quiz.endedAt).toLocaleString()}</span></div>{payload.quiz.offPlatformReward ? <p className="mt-4 rounded-xl bg-amber-300/15 p-3 text-sm font-bold text-amber-100 ring-1 ring-amber-300/25"><Trophy className="mr-2 inline size-4" />Original class reward: {payload.quiz.offPlatformReward}</p> : null}</header>
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2"><button aria-pressed={mode === "review"} className={cn("min-h-12 rounded-xl font-black", mode === "review" ? "bg-orange-600 text-white" : "text-slate-600 hover:bg-slate-50")} onClick={() => setMode("review")} type="button"><BookOpenCheck className="mr-2 inline size-4" />Review answers</button><button aria-pressed={mode === "practice"} className={cn("min-h-12 rounded-xl font-black", mode === "practice" ? "bg-orange-600 text-white" : "text-slate-600 hover:bg-slate-50")} onClick={() => setMode("practice")} type="button"><RotateCcw className="mr-2 inline size-4" />Practice again</button></div>
    {mode === "review" ? <ReviewView payload={payload} /> : <PracticeView questions={payload.quiz.questions} passingScore={payload.quiz.passingScore} />}
  </main></StudentShell>;
}

function ReviewView({ payload }: { payload: Payload }) {
  const [selectedAttempt, setSelectedAttempt] = useState(payload.bestAttempt?.attemptNumber ?? payload.attempts.at(-1)?.attemptNumber ?? 0);
  const attempt = payload.attempts.find((item) => item.attemptNumber === selectedAttempt) ?? payload.bestAttempt;
  const answers = new Map((attempt?.answers ?? []).map((answer) => [answer.questionId, answer]));
  return <div className="grid gap-5">
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><History className="size-5 text-orange-600" /><h2 className="text-xl font-black">Your quiz history</h2></div>{payload.attempts.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{payload.attempts.map((item) => <button aria-pressed={selectedAttempt === item.attemptNumber} className={cn("rounded-xl border p-4 text-left transition", selectedAttempt === item.attemptNumber ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500" : "border-slate-200 bg-slate-50")} key={item.attemptNumber} onClick={() => setSelectedAttempt(item.attemptNumber)} type="button"><p className="text-xs font-black uppercase text-slate-500">Attempt {item.attemptNumber}{payload.bestAttempt?.attemptNumber === item.attemptNumber ? " · Best" : ""}</p><p className="mt-1 text-2xl font-black">{item.scorePercentage}%</p><p className="mt-1 text-xs text-slate-600">{item.xpAwarded} XP · {item.starsAwarded} stars · {new Date(item.submittedAt).toLocaleString()}</p></button>)}</div> : <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-900">You did not attempt this quiz, but you can study every answer and practise it now.</p>}</section>
    <section className="grid gap-4">{payload.quiz.questions.map((question, index) => {
      const original = answers.get(question.id);
      return <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" key={question.id}><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black uppercase text-orange-800">Question {index + 1}</span>{original ? original.correct ? <span className="flex items-center gap-1 text-xs font-black text-emerald-700"><CheckCircle2 className="size-4" />You got this right</span> : <span className="flex items-center gap-1 text-xs font-black text-rose-700"><XCircle className="size-4" />Review this one</span> : null}</div><h3 className="mt-4 text-lg font-black">{question.prompt}</h3><div className="mt-4 grid gap-2">{question.options.map((option, optionIndex) => { const correct = optionIndex === question.correctIndex; const selected = original?.selectedIndex === optionIndex; return <div className={cn("rounded-xl border px-4 py-3 text-sm font-bold", correct ? "border-emerald-400 bg-emerald-50 text-emerald-950" : selected ? "border-rose-300 bg-rose-50 text-rose-900" : "border-slate-200 bg-slate-50 text-slate-600")} key={optionIndex}>{String.fromCharCode(65 + optionIndex)}. {option}{correct ? <span className="float-right text-xs font-black">Correct answer</span> : selected ? <span className="float-right text-xs font-black">Your answer</span> : null}</div>; })}</div><div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950"><b>Why?</b> {question.explanation || `The correct answer is ${question.correctAnswer}.`}</div></article>;
    })}</section>
  </div>;
}

function PracticeView({ questions, passingScore }: { questions: Question[]; passingScore: number }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"answer" | "review" | "result">("answer");
  const score = useMemo(() => scorePascoPractice(questions, answers), [answers, questions]);
  function restart() { setAnswers({}); setIndex(0); setPhase("answer"); }
  if (phase === "review") return <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5"><h2 className="text-2xl font-black">Review your answers</h2><p className="mt-2 text-sm text-slate-600">This practice is unscored on SkulKid and will not change your rewards.</p><div className="mt-5 grid gap-2">{questions.map((question, questionIndex) => <button className="flex min-h-12 items-center justify-between rounded-xl border border-slate-200 px-4 text-left font-bold" key={question.id} onClick={() => { setIndex(questionIndex); setPhase("answer"); }} type="button"><span>{questionIndex + 1}. {question.prompt}</span><span className={answers[question.id] == null ? "text-amber-700" : "text-emerald-700"}>{answers[question.id] == null ? "Not answered" : "Answered"}</span></button>)}</div><div className="mt-5 flex justify-between gap-3"><button className="min-h-11 rounded-xl border px-4 font-black" onClick={() => setPhase("answer")} type="button">Keep editing</button><button className="min-h-11 rounded-xl bg-orange-600 px-5 font-black text-white disabled:opacity-50" disabled={Object.keys(answers).length !== questions.length} onClick={() => setPhase("result")} type="button">Check practice</button></div></section>;
  if (phase === "result") return <section className="rounded-[1.75rem] bg-slate-950 p-6 text-center text-white"><Trophy className="mx-auto size-10 text-amber-300" /><p className="mt-3 text-sm font-black uppercase text-orange-300">Practice complete</p><h2 className="mt-2 text-4xl font-black">{score}%</h2><p className="mt-2 text-slate-300">{score >= passingScore ? "Strong revision—keep it fresh!" : "Good practice. Review the answers and try again."}</p><p className="mt-3 text-xs font-bold text-slate-400">No XP, stars, attempts or leaderboard points were changed.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button className="rounded-xl bg-white px-5 py-3 font-black text-slate-950" onClick={restart} type="button"><RotateCcw className="mr-2 inline size-4" />Practise again</button><button className="rounded-xl border border-white/25 px-5 py-3 font-black" onClick={() => setPhase("review")} type="button">Review choices</button></div><div className="mt-6 grid gap-3 text-left">{questions.map((question, questionIndex) => <div className={cn("rounded-xl p-4", answers[question.id] === question.correctIndex ? "bg-emerald-500/15" : "bg-rose-500/15")} key={question.id}><p className="font-black">{questionIndex + 1}. {question.prompt}</p><p className="mt-2 text-sm">Correct answer: <b>{question.correctAnswer}</b></p><p className="mt-1 text-sm text-slate-300">{question.explanation || "Review the correct answer above."}</p></div>)}</div></section>;
  const question = questions[index];
  return <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><span className="text-xs font-black uppercase text-orange-700">Practice question {index + 1} of {questions.length}</span><span className="text-xs font-bold text-slate-500">{Object.keys(answers).length} answered</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-500" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div><h2 className="mt-6 text-xl font-black">{question.prompt}</h2><div className="mt-5 grid gap-3">{question.options.map((option, optionIndex) => <button aria-pressed={answers[question.id] === optionIndex} className={cn("min-h-14 rounded-xl border px-4 text-left font-bold", answers[question.id] === optionIndex ? "border-orange-500 bg-orange-500 text-white" : "border-slate-200 bg-slate-50 hover:border-orange-300")} key={optionIndex} onClick={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} type="button">{String.fromCharCode(65 + optionIndex)}. {option}</button>)}</div><div className="mt-6 flex items-center justify-between gap-3"><button className="inline-flex min-h-11 items-center gap-1 rounded-xl border px-4 font-black disabled:opacity-40" disabled={index === 0} onClick={() => setIndex((current) => current - 1)} type="button"><ArrowLeft className="size-4" />Back</button>{index < questions.length - 1 ? <button className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-orange-600 px-5 font-black text-white" onClick={() => setIndex((current) => current + 1)} type="button">Next<ArrowRight className="size-4" /></button> : <button className="min-h-11 rounded-xl bg-slate-950 px-5 font-black text-white" onClick={() => setPhase("review")} type="button">Review practice</button>}</div></section>;
}
