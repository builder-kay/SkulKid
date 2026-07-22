"use client";

import Link from "next/link";
import { ArrowRight, Clock, ListOrdered } from "lucide-react";
import { XpBadge } from "@/components/gamification/xp-badge";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { usePublishedLessons } from "@/lib/lessons/published-lessons";

export default function LessonsPage() {
  const lessons = usePublishedLessons();
  return <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 sm:py-12"><div className="mb-8"><h1 className="text-3xl font-bold sm:text-4xl">Published lessons</h1><p className="mt-2 text-text-secondary">Lessons currently available to students.</p></div>
    <section className="grid gap-4" aria-label="Published lessons">{lessons.length ? lessons.map((lesson) => <SkulKidCard className="p-5" key={lesson.id}><div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold"><ListOrdered className="size-4" />Lesson {lesson.order}</span><XpBadge xp={lesson.xpReward} /></div><h2 className="mt-3 text-2xl font-bold">{lesson.title}</h2><p className="mt-2 text-text-secondary">{lesson.description}</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary"><Clock className="size-4" />{lesson.estimatedMinutes} min</span></div><Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-white" href={`/preview/lessons/${lesson.id}`}>Open lesson<ArrowRight className="size-4" /></Link></div></SkulKidCard>) : <SkulKidCard className="p-8 text-center"><h2 className="text-2xl font-bold">No published lessons yet</h2><p className="mt-2 text-text-secondary">Lessons will appear here as soon as an administrator publishes them.</p></SkulKidCard>}</section>
  </main>;
}
