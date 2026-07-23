"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, BookOpen, CheckCircle2, Clock3, Eye, FilePenLine, Filter, GripVertical, Pencil, Plus, Search, Trophy } from "lucide-react";
import { Input, Select } from "@/components/design-system/form-controls";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { subjects } from "@/data/subjects";
import { normaliseOrder, readAdminLessons, readLessonOrder, writeLessonOrder } from "@/lib/admin/lesson-library";
import type { AdminLessonRecord, AdminLessonStatus } from "@/lib/admin/lesson-library";
import type { SupportedCurriculumSubject } from "@/domains/curriculum-ai/schemas/generated-course";

const subjectStyles: Record<SupportedCurriculumSubject, { accent: string; soft: string }> = {
  mathematics: { accent: "bg-blue-600", soft: "bg-blue-50 text-blue-800" },
  "english-language": { accent: "bg-violet-600", soft: "bg-violet-50 text-violet-800" },
  science: { accent: "bg-green-600", soft: "bg-green-50 text-green-800" }
};

export function LessonLibrary({ initialSubject }: { initialSubject: SupportedCurriculumSubject }) {
  const [subject, setSubject] = useState(initialSubject);
  const [status, setStatus] = useState<"all" | AdminLessonStatus>("all");
  const [query, setQuery] = useState("");
  const [savedLessons, setSavedLessons] = useState<AdminLessonRecord[]>([]);
  const [orderVersion, setOrderVersion] = useState(0);
  useEffect(() => setSavedLessons(readAdminLessons()), []);

  const allLessons = savedLessons;
  const subjectLessons = allLessons.filter((lesson) => lesson.subject === subject);
  const orderedIds = normaliseOrder(readLessonOrder(subject), subjectLessons.map((lesson) => lesson.id));
  const orderedLessons = orderedIds.map((id) => subjectLessons.find((lesson) => lesson.id === id)).filter((lesson): lesson is AdminLessonRecord => Boolean(lesson));
  const visible = orderedLessons.filter((lesson) => (status === "all" || lesson.status === status) && `${lesson.title} ${lesson.unit} ${lesson.topic}`.toLowerCase().includes(query.toLowerCase()));
  const publishedCount = allLessons.filter((lesson) => lesson.subject === subject && lesson.status === "published").length;
  const draftCount = allLessons.filter((lesson) => lesson.subject === subject && lesson.status === "draft").length;
  const activeSubject = subjects.find((item) => item.slug === subject);
  function moveLesson(lessonId: string, direction: -1 | 1) { const current = normaliseOrder(readLessonOrder(subject), subjectLessons.map((lesson) => lesson.id)); const index = current.indexOf(lessonId); const target = index + direction; if (index < 0 || target < 0 || target >= current.length) return; [current[index], current[target]] = [current[target], current[index]]; writeLessonOrder(subject, current); setOrderVersion((value) => value + 1); }
  void orderVersion;

  return <main className="mx-auto w-full max-w-[94rem] space-y-6">
    <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8 lg:p-10"><div className={`pointer-events-none absolute -right-20 -top-24 size-80 rounded-full ${subjectStyles[subject].accent} opacity-20 blur-3xl`} /><div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Lesson library</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">{activeSubject?.name} lessons</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">Review drafts, manage published lessons and continue building the learning path.</p></div><Link href="/admin/lessons/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-black text-slate-950 shadow-lg hover:bg-slate-100"><Plus className="size-5" />Create another lesson</Link></div></header>

    <nav aria-label="Choose subject" className="grid gap-3 sm:grid-cols-3">{subjects.map((item) => { const slug = item.slug as SupportedCurriculumSubject; const count = allLessons.filter((lesson) => lesson.subject === slug).length; return <button type="button" onClick={() => setSubject(slug)} key={item.id} className={`rounded-2xl border p-4 text-left transition ${subject === slug ? "border-slate-950 bg-slate-950 text-white shadow-lg" : "border-slate-200 bg-white hover:border-slate-400"}`}><span className="flex items-center justify-between gap-3"><span className="font-black">{item.name}</span><span className={`rounded-full px-2.5 py-1 text-xs font-black ${subject === slug ? "bg-white/15" : subjectStyles[slug].soft}`}>{count}</span></span><span className={`mt-1 block text-xs ${subject === slug ? "text-slate-300" : "text-muted"}`}>View learning path</span></button>; })}</nav>

    <section className="grid gap-4 sm:grid-cols-3"><Stat icon={BookOpen} label="Total lessons" value={visible.length} /><Stat icon={CheckCircle2} label="Published" value={publishedCount} tone="green" /><Stat icon={FilePenLine} label="Drafts" value={draftCount} tone="amber" /></section>

    <SkulKidCard className="p-4 sm:p-5"><div className="grid gap-3 sm:grid-cols-[1fr_13rem]"><label className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted" /><Input className="pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lessons, units or topics" aria-label="Search lessons" /></label><label className="relative"><Filter className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted" /><Select className="pl-11" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Filter by status"><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Drafts</option></Select></label></div></SkulKidCard>

    {visible.length ? <><div className="flex items-center gap-2 text-sm font-bold text-muted"><GripVertical className="size-4" />Use the arrow controls to arrange the learning path.</div><ol className="grid gap-4 lg:grid-cols-2">{visible.map((lesson) => { const orderIndex = orderedLessons.findIndex((item) => item.id === lesson.id); return <li key={lesson.id}><LessonCard lesson={lesson} number={orderIndex + 1} canMoveUp={orderIndex > 0} canMoveDown={orderIndex < orderedLessons.length - 1} onMoveUp={() => moveLesson(lesson.id, -1)} onMoveDown={() => moveLesson(lesson.id, 1)} /></li>; })}</ol></> : <SkulKidCard className="grid min-h-72 place-items-center p-8 text-center"><div><BookOpen className="mx-auto size-12 text-slate-300" /><h2 className="mt-4 text-2xl font-black">No lessons found</h2><p className="mt-2 text-text-secondary">Try another filter or create the first lesson for this subject.</p><Link href="/admin/lessons/new" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 font-bold text-white"><Plus className="size-4" />Create lesson</Link></div></SkulKidCard>}
  </main>;
}

function LessonCard({ lesson, number, canMoveUp, canMoveDown, onMoveUp, onMoveDown }: { lesson: AdminLessonRecord; number: number; canMoveUp: boolean; canMoveDown: boolean; onMoveUp: () => void; onMoveDown: () => void }) {
  const style = subjectStyles[lesson.subject];
  return <article className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg sm:p-6"><span className={`absolute inset-y-0 left-0 w-1.5 ${style.accent}`} /><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-xl text-sm font-black ${style.soft}`}>{String(number).padStart(2, "0")}</span><div className="min-w-0"><p className="text-xs font-black uppercase tracking-wider text-muted">Lesson {number} / Basic {lesson.grade}</p><h2 className="mt-1 truncate text-xl font-black">{lesson.title}</h2></div></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${lesson.status === "published" ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-950"}`}>{lesson.status === "published" ? "Published" : "Draft"}</span></div><p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-text-secondary">{lesson.description}</p><p className="mt-3 text-xs font-bold text-violet-700">{lesson.unit} / {lesson.topic}</p><div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs font-bold text-muted"><span className="flex items-center gap-1.5"><Clock3 className="size-4" />{lesson.estimatedMinutes} min</span><span className="flex items-center gap-1.5"><Trophy className="size-4" />{lesson.xp} XP</span><span>{lesson.questionCount} questions</span><span className="ml-auto flex items-center gap-1 text-violet-700">{lesson.status === "published" ? <><Eye className="size-4" />Ready for pupils</> : <><FilePenLine className="size-4" />Continue editing</>}</span></div><div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-2"><Link href={`/admin/lessons/new?edit=${encodeURIComponent(lesson.id)}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 text-xs font-black text-violet-800 hover:bg-violet-50"><Pencil className="size-4" />Edit lesson</Link><div className="flex gap-1"><button type="button" disabled={!canMoveUp} onClick={onMoveUp} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Move ${lesson.title} earlier`}><ArrowUp className="size-4" /></button><button type="button" disabled={!canMoveDown} onClick={onMoveDown} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Move ${lesson.title} later`}><ArrowDown className="size-4" /></button></div></div></article>;
}

function Stat({ icon: Icon, label, value, tone = "violet" }: { icon: typeof BookOpen; label: string; value: number; tone?: "violet" | "green" | "amber" }) { const colours = { violet: "bg-violet-100 text-violet-800", green: "bg-green-100 text-green-800", amber: "bg-amber-100 text-amber-900" }; return <SkulKidCard className="flex items-center gap-4 p-4"><span className={`grid size-11 place-items-center rounded-xl ${colours[tone]}`}><Icon className="size-5" /></span><div><p className="text-2xl font-black">{value}</p><p className="text-sm font-bold text-muted">{label}</p></div></SkulKidCard>; }
