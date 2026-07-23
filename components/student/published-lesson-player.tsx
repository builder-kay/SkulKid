"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brain, CheckCircle2, Clock, Crown, Eye, Flame, Gift, Map as MapIcon, RotateCcw, Sparkles, Star, Target, Trophy, X, Zap, type LucideIcon } from "lucide-react";
import { BlockRenderer } from "@/components/lesson-player/block-renderer";
import { XpBadge } from "@/components/gamification/xp-badge";
import { StudentShell } from "@/components/student/student-shell";
import type { StudentNavItem } from "@/components/student/student-shell";
import { StudentPageNav } from "@/components/student/student-page-nav";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { subjects } from "@/data/subjects";
import { usePublishedLesson } from "@/lib/lessons/published-lessons";
import { useStudentGame, type QuizAnswerResult } from "@/lib/gamification/student-game";
import type { LessonBlock } from "@/types/lesson";

export function PublishedLessonPlayer({ lessonId }: { lessonId: string }) {
  const { state, completeLesson, completeVideoPrompt, submitQuiz } = useStudentGame();
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; earnedStars: number; earnedXp: number } | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  useEffect(() => {
    if (!quizOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setQuizOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [quizOpen]);
  const { lesson, loading } = usePublishedLesson(lessonId);
  const subject = subjects.find((candidate) => candidate.id === lesson?.subjectId);
  const courseHref = subject ? `/courses/${subject.slug}` : "/courses";
  const activeItem: StudentNavItem = subject?.slug === "mathematics" ? "mathematics" : "courses";
  const unit = subject?.units.find((candidate) => candidate.id === lesson?.unitId);

  if (loading) {
    return <StudentShell activeItem="courses"><main className="mx-auto grid min-h-72 w-full max-w-3xl place-items-center"><div className="text-center"><span className="mx-auto block size-10 animate-spin rounded-full border-4 border-violet-100 border-t-violet-700" /><p className="mt-4 font-bold text-muted">Preparing your lesson…</p></div></main></StudentShell>;
  }

  if (!lesson) {
    return (
      <StudentShell activeItem="courses">
        <main className="mx-auto w-full max-w-3xl space-y-5">
          <StudentPageNav
            backHref="/courses"
            backLabel="Back to courses"
            crumbs={[
              { label: "Home", href: "/dashboard" },
              { label: "Courses", href: "/courses" },
              { label: "Lesson" }
            ]}
          />
          <SkulKidCard className="p-8 text-center">
            <h1 className="text-3xl font-bold">Lesson unavailable</h1>
            <p className="mt-3 text-text-secondary">This lesson has not been published or is no longer available.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-bold text-white" href="/courses">View courses</Link>
              <Link className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-5 font-bold text-slate-700" href="/dashboard">Go to dashboard</Link>
            </div>
          </SkulKidCard>
        </main>
      </StudentShell>
    );
  }

  const blocks = [...lesson.blocks].sort((a, b) => a.order - b.order);
  const completed = state.completedLessonIds.includes(lesson.id);
  const questionBlocks = blocks.filter((block) => ["multiple_choice", "true_false", "fill_blank"].includes(block.type));
  const hasQuiz = questionBlocks.length > 0;
  const missionProgress = completed ? 100 : 25;
  const journeyBlocks = blocks.filter((block) => block.type !== "introduction" && !["multiple_choice", "true_false", "fill_blank"].includes(block.type));
  const quizPassed = quizResult?.passed || state.quizRecords[lesson.id]?.passed || false;

  return (
    <StudentShell activeItem={activeItem}>
      <main className="mx-auto w-full max-w-6xl space-y-5">
        <StudentPageNav
          backHref={courseHref}
          backLabel="Back to mission path"
          crumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Courses", href: "/courses" },
            { label: subject?.name ?? "Course", href: courseHref },
            ...(unit ? [{ label: unit.title, href: courseHref }] : []),
            { label: lesson.title }
          ]}
        />
        <section className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-slate-950 via-violet-900 to-blue-700 p-6 text-white shadow-[0_30px_80px_rgba(49,46,129,.3)] sm:p-9 lg:p-11">
          <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-cyan-300/20 blur-3xl" /><div className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-end">
            <div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider ring-1 ring-white/20"><Sparkles className="size-4 text-amber-300" />Learning mission</span><span className="rounded-full bg-blue-300/20 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-blue-100 ring-1 ring-blue-200/20">{lesson.difficulty}</span></div><h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">{lesson.title}</h1><p className="mt-4 max-w-3xl text-base leading-8 text-blue-100 sm:text-lg">{lesson.description}</p><div className="mt-6 flex gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15"><Target className="mt-1 size-5 shrink-0 text-amber-300" /><div><p className="text-xs font-black uppercase tracking-wider text-blue-200">Your mission</p><p className="mt-1 leading-7 text-white">{lesson.objective}</p></div></div></div>
            <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur"><div className="flex items-center justify-between"><p className="text-sm font-black">Mission reward</p><XpBadge xp={lesson.xpReward} /></div><div className="mt-5 grid grid-cols-2 gap-2"><MissionFact icon={Clock} value={`${lesson.estimatedMinutes} min`} label="Mission time" /><MissionFact icon={MapIcon} value={`${journeyBlocks.length}`} label="Stages" /></div><div className="mt-4"><div className="flex justify-between text-xs font-black"><span>Mission progress</span><span>{missionProgress}%</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all duration-500" style={{ width: `${missionProgress}%` }} /></div></div></div>
          </div>
        </section>
        <div className="flex items-center gap-3 px-1"><span className="grid size-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><MapIcon className="size-5" /></span><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Lesson stages</p><h2 className="text-2xl font-black">Learn, practise, conquer</h2></div></div>
        <div className="relative grid gap-5 before:absolute before:bottom-8 before:left-[1.35rem] before:top-8 before:hidden before:w-1 before:rounded-full before:bg-gradient-to-b before:from-violet-200 before:via-fuchsia-200 before:to-emerald-200 sm:pl-14 sm:before:block">{journeyBlocks.map((block, index) => <div className="relative" key={block.id}><span className="absolute -left-14 top-7 z-10 hidden size-11 place-items-center rounded-full border-4 border-slate-100 bg-white text-sm font-black text-violet-700 shadow-md sm:grid">{index + 1}</span><BlockRenderer block={block} completedVideoPromptIds={state.completedVideoPromptIds} onVideoPromptComplete={completeVideoPrompt} previewMode /></div>)}</div>
        {hasQuiz ? <><SkulKidCard className="relative overflow-hidden border-violet-200 bg-gradient-to-br from-violet-700 via-fuchsia-700 to-blue-700 p-7 text-center text-white shadow-[0_24px_65px_rgba(109,40,217,.25)]"><Trophy className="mx-auto size-12 text-amber-300" /><p className="mt-3 text-xs font-black uppercase tracking-[.2em] text-violet-200">{completed ? "Reward claimed" : "Lesson complete"}</p><h2 className="mt-1 text-3xl font-black">{completed ? "Quiz completed" : "Ready for the final challenge?"}</h2><p className="mx-auto mt-2 max-w-xl text-violet-100">{completed ? "Your result and lesson reward have been recorded." : `Take a ${questionBlocks.length}-question quiz to test what you learned and unlock your reward.`}</p><button className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-amber-300 px-7 font-black text-slate-950 shadow-lg disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/60 disabled:shadow-none" disabled={completed} onClick={() => setQuizOpen(true)} type="button"><Sparkles className="size-5" />{completed ? "Quiz completed" : "Take quiz"}</button></SkulKidCard><QuizModal masteryScore={lesson.masteryScore ?? 80} onClaim={(results) => { setQuizResult(submitQuiz(lesson.id, results, lesson.passingScore ?? 70, lesson.masteryScore ?? 80)); completeLesson(lesson.id, lesson.xpReward); setQuizOpen(false); }} onClose={() => setQuizOpen(false)} open={quizOpen && !completed} passingScore={lesson.passingScore ?? 70} questions={questionBlocks} title={lesson.title} /></> : null}
        {!hasQuiz || quizPassed || completed ? <SkulKidCard className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 text-center">
          {completed ? <><CheckCircle2 className="mx-auto size-12 text-emerald-600" /><h2 className="mt-3 text-2xl font-black">Achievement recorded!</h2><p className="mt-2 text-text-secondary">This lesson is complete. Your XP and badge progress have been updated.</p><div className="mt-5 flex flex-wrap items-center justify-center gap-3"><Link className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-black text-white" href={courseHref}>Back to mission path</Link><Link className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-5 font-black text-slate-700" href="/achievements">See my rewards</Link><Link className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-5 font-black text-slate-700" href="/dashboard">Dashboard</Link></div></> : <><Trophy className="mx-auto size-12 text-amber-500" /><h2 className="mt-3 text-2xl font-black">Ready to finish?</h2><p className="mt-2 text-text-secondary">Complete the lesson to earn {lesson.xpReward} XP. {hasQuiz ? "Quiz stars are based on your score." : "A mystery bonus may be hiding too."}</p><button className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-600 px-6 font-black text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={hasQuiz && !quizPassed} onClick={() => completeLesson(lesson.id, lesson.xpReward)}><Gift className="size-5" />{hasQuiz && !quizPassed ? "Pass the quiz to complete" : "Complete lesson & reveal reward"}</button></>}
        </SkulKidCard> : null}
        {state.lastReward && completed ? <div aria-live="polite" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center"><p className="font-black text-amber-950">{state.lastReward.title}</p><p className="mt-1 text-sm text-amber-900">{state.lastReward.detail} +{state.lastReward.xp} XP · +{state.lastReward.stars} stars</p></div> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-black text-primary hover:bg-blue-50" href={courseHref}>← Mission path</Link>
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-black text-slate-700 hover:bg-slate-50" href="/courses">All courses</Link>
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-black text-slate-700 hover:bg-slate-50" href="/dashboard">Dashboard</Link>
        </div>
      </main>
    </StudentShell>
  );
}
function MissionFact({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return <div className="rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/10"><Icon className="mx-auto size-5 text-amber-300" aria-hidden="true" /><b className="mt-2 block text-sm">{value}</b><span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-blue-200">{label}</span></div>;
}

function LegacyQuizModal({ open, title, questionCount, answeredCount, progress, allAnswered, result, onClose, onSubmit, children }: { open: boolean; title: string; questionCount: number; answeredCount: number; progress: number; allAnswered: boolean; result: { score: number; passed: boolean; earnedStars: number; earnedXp: number } | null; onClose: () => void; onSubmit: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onClick={onClose} role="presentation"><section aria-labelledby="quiz-modal-title" aria-modal="true" className="mx-auto min-h-full max-w-4xl rounded-[2rem] bg-slate-50 shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog"><header className="sticky top-0 z-10 rounded-t-[2rem] bg-gradient-to-r from-violet-800 to-blue-700 p-5 text-white shadow-lg sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-violet-200">Final challenge</p><h2 className="mt-1 text-2xl font-black sm:text-3xl" id="quiz-modal-title">{title} quiz</h2></div><button aria-label="Close quiz" className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 hover:bg-white/20" onClick={onClose} type="button"><X className="size-6" /></button></div><div className="mt-4 flex items-center gap-3"><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all" style={{ width: `${progress}%` }} /></div><span className="text-xs font-black">{answeredCount}/{questionCount}</span></div></header><div className="grid gap-5 p-4 sm:p-6">{children}<div className="rounded-[1.75rem] bg-slate-950 p-6 text-center text-white"><Trophy className="mx-auto size-10 text-amber-300" /><h3 className="mt-3 text-2xl font-black">Submit your answers</h3><button className="mt-5 min-h-12 rounded-xl bg-amber-300 px-7 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50" disabled={!allAnswered} onClick={onSubmit} type="button">{allAnswered ? "Submit quiz & claim reward" : `Answer ${questionCount - answeredCount} more`}</button>{result ? <div aria-live="polite" className={`mx-auto mt-5 max-w-xl rounded-2xl p-4 ${result.passed ? "bg-emerald-100 text-emerald-950" : "bg-rose-100 text-rose-950"}`}><p className="text-xl font-black">{result.passed ? "Quiz passed!" : "Not passed yet"} · {result.score}%</p><p className="mt-1 text-sm">+{result.earnedXp} XP · {result.earnedStars} star{result.earnedStars === 1 ? "" : "s"}</p>{result.passed ? <button className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 font-black text-white" onClick={onClose} type="button">Return to mission</button> : null}</div> : null}</div></div></section></div>;
}
void LegacyQuizModal;

function QuizModal({ open, title, questions, passingScore, masteryScore, onClose, onClaim }: { open: boolean; title: string; questions: LessonBlock[]; passingScore: number; masteryScore: number; onClose: () => void; onClaim: (results: QuizAnswerResult[]) => void }) {
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState(1);
  const [grade, setGrade] = useState<{ score: number; passed: boolean; wrong: string[] } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const answered = questions.filter((q) => choices[q.id]?.trim()).length;
  const submit = () => { const wrong = questions.filter((q) => !answerIsCorrect(q, choices[q.id] ?? "")).map((q) => q.id); setGrade({ score: Math.round(((questions.length - wrong.length) / questions.length) * 100), passed: ((questions.length - wrong.length) / questions.length) * 100 >= passingScore, wrong }); };
  const retake = () => { setChoices({}); setGrade(null); setReviewing(false); setAttempt((value) => value + 1); };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <section aria-modal="true" className="mx-auto max-w-4xl rounded-[2rem] bg-slate-50 shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog">
        <header className="sticky top-0 z-10 rounded-t-[2rem] bg-gradient-to-r from-violet-800 to-blue-700 p-5 text-white">
          <div className="flex justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-200">Attempt {attempt}</p><h2 className="text-2xl font-black">{title} quiz</h2><p className="mt-1 text-sm text-blue-100">Your answers are graded together after submission.</p></div><button aria-label="Close quiz" className="grid size-11 place-items-center rounded-xl bg-white/10" onClick={onClose}><X /></button></div>
          <div className="mt-4 grid grid-cols-[1fr_auto_auto] items-center gap-3"><div><div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-blue-100"><span>Challenge progress</span><span>{Math.round((answered / questions.length) * 100)}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-lime-300 to-emerald-300 transition-all duration-500" style={{ width: `${Math.round((answered / questions.length) * 100)}%` }} /></div></div><div className="rounded-xl bg-white/10 px-3 py-2 text-center"><b className="block text-lg">{answered}</b><span className="text-[10px] font-bold uppercase text-blue-200">Answered</span></div><div className="rounded-xl bg-white/10 px-3 py-2 text-center"><b className="block text-lg">{questions.length - answered}</b><span className="text-[10px] font-bold uppercase text-blue-200">Left</span></div></div>
        </header>
        <div className="grid gap-5 p-4 sm:p-6">
          {questions.map((question, index) => <ExamQuestion choice={choices[question.id] ?? ""} disabled={Boolean(grade)} key={question.id} number={index + 1} onChange={(value) => setChoices((current) => ({ ...current, [question.id]: value }))} question={question} reveal={Boolean(reviewing && grade?.wrong.includes(question.id))} />)}
          <div className="rounded-3xl bg-slate-950 p-6 text-center text-white">
            {!grade ? <QuizSubmitPanel answered={answered} onSubmit={submit} total={questions.length} /> : <QuizOutcome attempt={attempt} grade={grade} masteryScore={masteryScore} onClaim={() => onClaim(questions.map((question) => ({ blockId: question.id, correct: !grade.wrong.includes(question.id), attempts: attempt })))} onRetake={retake} onReview={() => setReviewing(true)} passingScore={passingScore} reviewing={reviewing} total={questions.length} />}
          </div>
        </div>
      </section>
    </div>
  );
}

function ExamQuestion({ question, number, choice, disabled, reveal, onChange }: { question: LessonBlock; number: number; choice: string; disabled: boolean; reveal: boolean; onChange: (value: string) => void }) {
  const prompt = question.type === "multiple_choice" ? question.question : question.type === "true_false" ? question.statement : question.type === "fill_blank" ? question.sentence : "Question";
  const options = question.type === "multiple_choice" ? question.options.map((option) => ({ value: option.id, label: `${option.label}. ${option.text}` })) : question.type === "true_false" ? [{ value: "true", label: "True" }, { value: "false", label: "False" }] : [];
  return <section className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-sm transition ${choice ? "border-violet-300 shadow-violet-100" : "border-slate-200"}`}><span className={`absolute inset-y-0 left-0 w-1.5 ${choice ? "bg-violet-500" : "bg-slate-200"}`} /><div className="flex items-center justify-between gap-3"><p className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-black uppercase text-violet-700"><Brain className="size-4" />Challenge {number}</p>{choice ? <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700"><CheckCircle2 className="size-4" />Locked in</span> : <span className="text-xs font-bold text-muted">Choose one</span>}</div><h3 className="mt-4 text-xl font-black leading-8">{prompt}</h3>{options.length ? <div className="mt-4 grid gap-3">{options.map((option) => <button className={`min-h-14 rounded-2xl border px-4 text-left font-bold transition hover:-translate-y-0.5 hover:shadow-md ${choice === option.value ? "border-violet-500 bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg" : "border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50"}`} disabled={disabled} key={option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div> : <input className="mt-4 min-h-12 w-full rounded-xl border border-slate-300 px-4" disabled={disabled} onChange={(event) => onChange(event.target.value)} value={choice} />}{reveal ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-950"><p className="font-black">Correct answer: {correctAnswer(question)}</p><p className="mt-1 text-sm">{"explanation" in question ? question.explanation : "Review the lesson and compare your answer."}</p></div> : null}</section>;
}

function QuizSubmitPanel({ answered, total, onSubmit }: { answered: number; total: number; onSubmit: () => void }) {
  const ready = answered === total;
  return <><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-violet-500/20 text-amber-300"><Zap className="size-8 fill-current" /></span><h3 className="mt-4 text-2xl font-black">{ready ? "All challenges locked in!" : "Complete every challenge"}</h3><p className="mt-2 text-slate-300">{ready ? "Submit when you are ready to reveal your score." : `${total - answered} question${total - answered === 1 ? "" : "s"} left before grading.`}</p><button className="mt-5 min-h-12 rounded-xl bg-gradient-to-r from-amber-300 to-orange-300 px-8 font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 disabled:opacity-40" disabled={!ready} onClick={onSubmit}>Reveal my score</button></>;
}

function QuizOutcome({ grade, total, attempt, passingScore, masteryScore, reviewing, onReview, onRetake, onClaim }: { grade: { score: number; passed: boolean; wrong: string[] }; total: number; attempt: number; passingScore: number; masteryScore: number; reviewing: boolean; onReview: () => void; onRetake: () => void; onClaim: () => void }) {
  const correct = total - grade.wrong.length;
  const stars = !grade.passed ? 0 : grade.score >= 90 ? 3 : grade.score >= masteryScore ? 2 : 1;
  return <><div className="mx-auto grid size-28 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 ring-8 ring-white/10"><div><b className="block text-3xl">{grade.score}%</b><span className="text-[10px] font-black uppercase text-blue-100">Score</span></div></div><div className="mt-4 flex justify-center gap-2" aria-label={`${stars} stars earned`}>{[1,2,3].map((star) => <Star className={`size-8 ${star <= stars ? "fill-amber-300 text-amber-300" : "text-slate-600"}`} key={star} />)}</div><div className="mt-5 grid grid-cols-3 gap-2"><ResultMetric icon={CheckCircle2} value={`${correct}/${total}`} label="Correct" /><ResultMetric icon={Flame} value={`${attempt}`} label="Attempt" /><ResultMetric icon={Crown} value={`${stars}`} label="Stars" /></div><h3 className="mt-5 text-3xl font-black">{grade.passed ? grade.score >= masteryScore ? "Mastery achieved!" : "Mission passed!" : "Keep training!"}</h3><p className="mt-2 text-slate-300">{grade.passed ? grade.wrong.length ? "You passed, with a few challenges left to conquer." : "Perfect run—every answer was correct!" : `Reach ${passingScore}% to pass this mission.`}</p><div className="mt-6 flex flex-wrap justify-center gap-3">{grade.wrong.length > 0 && !reviewing ? <button className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 font-black hover:bg-white/10" onClick={onReview}><Eye className="size-5" />Review mistakes</button> : null}{!grade.passed || (grade.wrong.length > 0 && !reviewing) ? <button className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-slate-950" onClick={onRetake}><RotateCcw className="size-5" />Retake quiz</button> : null}{grade.passed ? <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-black text-emerald-950 shadow-lg" onClick={onClaim}><Gift className="size-5" />Claim reward &amp; move on</button> : null}</div>{reviewing && grade.passed ? <p className="mx-auto mt-5 max-w-lg rounded-xl bg-amber-300/10 p-3 text-sm font-bold text-amber-200">Mistakes reviewed—your retake option is now locked. Claim your reward to complete the mission.</p> : null}</>;
}

function ResultMetric({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) { return <div className="rounded-2xl bg-white/10 p-3"><Icon className="mx-auto size-5 text-amber-300" /><b className="mt-2 block text-lg">{value}</b><span className="text-[10px] font-black uppercase text-slate-300">{label}</span></div>; }

function answerIsCorrect(question: LessonBlock, answer: string) { if (question.type === "multiple_choice") return answer === question.correctOptionId; if (question.type === "true_false") return answer === String(question.correctAnswer); if (question.type === "fill_blank") return question.acceptedAnswers.some((accepted) => question.caseSensitive ? accepted === answer : accepted.toLowerCase() === answer.trim().toLowerCase()); return false; }
function correctAnswer(question: LessonBlock) { if (question.type === "multiple_choice") return question.options.find((option) => option.id === question.correctOptionId)?.text ?? ""; if (question.type === "true_false") return question.correctAnswer ? "True" : "False"; if (question.type === "fill_blank") return question.acceptedAnswers[0] ?? ""; return ""; }
