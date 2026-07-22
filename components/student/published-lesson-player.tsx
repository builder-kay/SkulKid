"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, Gift, Layers, Target, Trophy } from "lucide-react";
import { BlockRenderer } from "@/components/lesson-player/block-renderer";
import { XpBadge } from "@/components/gamification/xp-badge";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { usePublishedLessons } from "@/lib/lessons/published-lessons";
import { useStudentGame, type QuizAnswerResult } from "@/lib/gamification/student-game";

export function PublishedLessonPlayer({ lessonId }: { lessonId: string }) {
  const { state, completeLesson, submitQuiz } = useStudentGame();
  const [answers, setAnswers] = useState<Record<string, QuizAnswerResult>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; earnedStars: number; earnedXp: number } | null>(null);
  const lesson = usePublishedLessons().find((candidate) => candidate.id === lessonId);
  if (!lesson) return <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-12"><SkulKidCard className="p-8 text-center"><h1 className="text-3xl font-bold">Lesson unavailable</h1><p className="mt-3 text-text-secondary">This lesson has not been published or is no longer available.</p><Link className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-bold text-white" href="/courses">View courses</Link></SkulKidCard></main>;
  const blocks = [...lesson.blocks].sort((a, b) => a.order - b.order);
  const completed = state.completedLessonIds.includes(lesson.id);
  const questionBlocks = blocks.filter((block) => ["multiple_choice", "true_false", "fill_blank"].includes(block.type));
  const hasQuiz = questionBlocks.length > 0;
  const allQuestionsAnswered = questionBlocks.every((block) => answers[block.id]);
  const quizPassed = quizResult?.passed || state.quizRecords[lesson.id]?.passed || false;
  const recordAnswer = (blockId: string, correct: boolean, attempts: number) => setAnswers((current) => ({ ...current, [blockId]: { blockId, correct: current[blockId]?.correct || correct, attempts } }));
  return <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 sm:py-12">
    <Link className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold shadow-sm" href={`/courses/${lesson.subjectId.replace("subject-", "")}`}><ArrowLeft className="size-4" />Back to course</Link>
    <SkulKidCard className="mb-6 p-6"><div className="grid gap-5 md:grid-cols-[1fr_auto]"><div className="space-y-4"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-900">{lesson.difficulty}</span><XpBadge xp={lesson.xpReward} /></div><div><h1 className="text-3xl font-bold sm:text-4xl">{lesson.title}</h1><p className="mt-3 leading-7 text-text-secondary">{lesson.description}</p></div><div className="flex gap-3 rounded-xl bg-blue-50 p-4 text-blue-950"><Target className="mt-1 size-5 shrink-0" /><p className="leading-7">{lesson.objective}</p></div></div><dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm"><div className="flex items-center gap-2"><Clock className="size-4" /><dt className="font-semibold">Time</dt><dd className="font-bold">{lesson.estimatedMinutes} min</dd></div><div className="flex items-center gap-2"><Layers className="size-4" /><dt className="font-semibold">Blocks</dt><dd className="font-bold">{blocks.length}</dd></div></dl></div></SkulKidCard>
    <div className="grid gap-5">{blocks.map((block) => <BlockRenderer block={block} key={block.id} previewMode onAnswer={recordAnswer} />)}</div>
    {hasQuiz ? <SkulKidCard className="mt-6 border-blue-200 bg-blue-50 p-6 text-center"><Trophy className="mx-auto size-10 text-blue-700" /><h2 className="mt-3 text-2xl font-black">Submit your quiz</h2><p className="mt-2 text-text-secondary">Answer all {questionBlocks.length} question{questionBlocks.length === 1 ? "" : "s"}. Pass mark: {lesson.passingScore ?? 70}% · Mastery: {lesson.masteryScore ?? 80}%.</p><button className="mt-5 min-h-12 rounded-xl bg-blue-700 px-6 font-black text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!allQuestionsAnswered} onClick={() => setQuizResult(submitQuiz(lesson.id, Object.values(answers), lesson.passingScore ?? 70, lesson.masteryScore ?? 80))}>{allQuestionsAnswered ? "Submit quiz & claim reward" : `Answer ${questionBlocks.length - Object.keys(answers).length} more`}</button>{quizResult ? <div aria-live="polite" className={`mx-auto mt-5 max-w-xl rounded-2xl p-4 ${quizResult.passed ? "bg-emerald-100 text-emerald-950" : "bg-rose-100 text-rose-950"}`}><p className="text-xl font-black">{quizResult.passed ? "Quiz passed!" : "Not passed yet"} · {quizResult.score}%</p><p className="mt-1 text-sm">+{quizResult.earnedXp} XP · {quizResult.earnedStars} star{quizResult.earnedStars === 1 ? "" : "s"}</p></div> : null}</SkulKidCard> : null}
    <SkulKidCard className="mt-6 overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 text-center">
      {completed ? <><CheckCircle2 className="mx-auto size-12 text-emerald-600" /><h2 className="mt-3 text-2xl font-black">Achievement recorded!</h2><p className="mt-2 text-text-secondary">This lesson is complete. Your XP and badge progress have been updated.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-black text-white" href="/dashboard">See my rewards</Link></> : <><Trophy className="mx-auto size-12 text-amber-500" /><h2 className="mt-3 text-2xl font-black">Ready to finish?</h2><p className="mt-2 text-text-secondary">Complete the lesson to earn {lesson.xpReward} XP. {hasQuiz ? "Quiz stars are based on your score." : "A mystery bonus may be hiding too."}</p><button className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-600 px-6 font-black text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={hasQuiz && !quizPassed} onClick={() => completeLesson(lesson.id, lesson.xpReward)}><Gift className="size-5" />{hasQuiz && !quizPassed ? "Pass the quiz to complete" : "Complete lesson & reveal reward"}</button></>}
    </SkulKidCard>
    {state.lastReward && completed ? <div aria-live="polite" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center"><p className="font-black text-amber-950">{state.lastReward.title}</p><p className="mt-1 text-sm text-amber-900">{state.lastReward.detail} +{state.lastReward.xp} XP · +{state.lastReward.stars} stars</p></div> : null}
  </main>;
}
