"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, BookOpenCheck, Calculator, Clock3, Eye, FileCheck2, FlaskConical, Layers3, Pencil, PlayCircle, Plus, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { curriculumFixtureSchema } from "@/domains/curriculum/schemas/lesson-version-schemas";
import { readAdminLessons, type AdminLessonRecord } from "@/lib/admin/lesson-library";

const subjectDetails = [
  { id: "mathematics", name: "Mathematics", colour: "#2563EB" },
  { id: "english-language", name: "English Language", colour: "#7C3AED" },
  { id: "science", name: "Science", colour: "#16A34A" }
] as const;

function useLiveLessons() {
  const [lessons, setLessons] = useState<AdminLessonRecord[]>([]);
  useEffect(() => {
    const refresh = () => { void readAdminLessons().then(setLessons); };
    refresh();
    window.addEventListener("skulkid:lessons-changed", refresh);
    return () => { window.removeEventListener("skulkid:lessons-changed", refresh); };
  }, []);
  return lessons;
}

export function LiveAdminMetrics() {
  const lessons = useLiveLessons();
  const published = lessons.filter((lesson) => lesson.status === "published");
  const drafts = lessons.length - published.length;
  const details = published.map(contentDetails);
  const activeSubjects = new Set(published.map((lesson) => lesson.subject)).size;
  const blocks = details.reduce((total, item) => total + item.blocks, 0);
  const objectives = details.reduce((total, item) => total + item.objectives, 0);
  const minutes = published.reduce((total, lesson) => total + lesson.estimatedMinutes, 0);
  return <section aria-label="Platform summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Metric icon={BookOpenCheck} label="Active subjects" value={activeSubjects} detail={`${subjectDetails.length} supported subjects`} tone="blue" />
    <Metric icon={FileCheck2} label="Published lessons" value={published.length} detail={`${drafts} draft${drafts === 1 ? "" : "s"}`} tone="green" />
    <Metric icon={Layers3} label="Lesson blocks" value={blocks} detail={`${objectives} learning objective${objectives === 1 ? "" : "s"}`} tone="violet" />
    <Metric icon={Clock3} label="Learning time" value={`${minutes}m`} detail="Across live published lessons" tone="amber" />
  </section>;
}

export function LiveCurriculumCoverage() {
  const lessons = useLiveLessons();
  return <SkulKidCard className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Curriculum coverage</p><h2 className="mt-1 text-2xl font-black">Subjects ready for pupils</h2></div><Link href="/admin/curriculum" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900">Manage curriculum<ArrowRight className="size-4" /></Link></div><div className="grid gap-4 p-5 sm:p-6 md:grid-cols-3">{subjectDetails.map((subject) => {
    const records = lessons.filter((lesson) => lesson.subject === subject.id);
    const published = records.filter((lesson) => lesson.status === "published").length;
    const drafts = records.length - published;
    return <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={subject.id}><div className="flex items-center justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white text-lg font-black shadow-sm" style={{ color: subject.colour }}>{subject.name.charAt(0)}</span><span className={`rounded-full px-2.5 py-1 text-xs font-black ${published ? "bg-green-100 text-green-900" : drafts ? "bg-blue-100 text-blue-900" : "bg-amber-100 text-amber-950"}`}>{published ? "Live" : drafts ? "Draft only" : "Not started"}</span></div><h3 className="mt-4 text-lg font-black">{subject.name}</h3><dl className="mt-4 grid grid-cols-2 gap-2 text-center"><Count label="Published" value={published} /><Count label="Drafts" value={drafts} /></dl><Link href={records.length ? "/admin/lessons" : "/admin/lessons/new"} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900">{records.length ? "Manage lessons" : "Create first lesson"}<ArrowRight className="size-4" /></Link></article>;
  })}</div></SkulKidCard>;
}

export function LiveRecentLessons() {
  const lessons = useLiveLessons();
  const recent = useMemo(() => [...lessons].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 5), [lessons]);
  return <SkulKidCard className="overflow-hidden"><div className="border-b border-slate-200 p-5 sm:p-6"><p className="text-xs font-black uppercase tracking-wider text-violet-700">Content activity</p><h2 className="mt-1 text-2xl font-black">Recently updated lessons</h2></div>{recent.length ? <div className="divide-y divide-slate-200">{recent.map((lesson) => { const subject = subjectDetails.find((item) => item.id === lesson.subject); const details = contentDetails(lesson); const published = lesson.status === "published"; return <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={lesson.id}><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-black" style={{ color: subject?.colour }}>{subject?.name.charAt(0) ?? "L"}</span><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-bold">{lesson.title}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${published ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-950"}`}>{lesson.status}</span></div><p className="mt-0.5 text-sm text-muted">{subject?.name ?? lesson.subject} · {lesson.estimatedMinutes} min · {details.blocks} blocks</p></div></div><Link href={published ? `/preview/lessons/${lesson.id}` : `/admin/lessons/new?edit=${lesson.id}`} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">{published ? <><Eye className="size-4" />Preview</> : <><Pencil className="size-4" />Continue editing</>}</Link></div>; })}</div> : <div className="p-8 text-center"><Plus className="mx-auto size-9 text-violet-600" /><h3 className="mt-3 text-lg font-black">No lessons created yet</h3><p className="mt-1 text-sm text-muted">Your newly created lessons will appear here.</p><Link className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 font-bold text-white" href="/admin/lessons/new"><Plus className="size-4" />Create lesson</Link></div>}</SkulKidCard>;
}

export function LiveAdminCurriculumSubjects() {
  const lessons = useLiveLessons();
  const display = [
    { ...subjectDetails[0], icon: Calculator, soft: "bg-blue-100 text-blue-800", description: "Build number confidence through clear examples, practice and feedback." },
    { ...subjectDetails[1], icon: BookOpen, soft: "bg-violet-100 text-violet-800", description: "Grow reading, writing and communication confidence." },
    { ...subjectDetails[2], icon: FlaskConical, soft: "bg-green-100 text-green-800", description: "Explore living things, materials, energy and everyday discovery." }
  ];
  return <section aria-label="Subjects" className="mt-6 grid gap-5 lg:grid-cols-3">{display.map((subject) => { const Icon = subject.icon; const records = lessons.filter((lesson) => lesson.subject === subject.id); const published = records.filter((lesson) => lesson.status === "published"); const units = new Set(published.map((lesson) => lesson.unit.trim()).filter(Boolean)).size; const topics = new Set(published.map((lesson) => lesson.topic.trim()).filter(Boolean)).size; return <SkulKidCard key={subject.id} className="flex flex-col p-6"><div className="flex items-start justify-between gap-3"><span className={`grid size-12 place-items-center rounded-2xl ${subject.soft}`}><Icon className="size-6" /></span><span className={`rounded-full px-3 py-1 text-xs font-black ${published.length ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900"}`}>{published.length ? "Available" : "Needs content"}</span></div><h2 className="mt-5 text-2xl font-black">{subject.name}</h2><p className="mt-2 min-h-14 leading-7 text-text-secondary">{subject.description}</p><dl className="mt-5 grid grid-cols-3 gap-2 text-center"><Count label="Units" value={units} /><Count label="Topics" value={topics} /><Count label="Published" value={published.length} /></dl>{records.length > published.length ? <p className="mt-3 text-center text-xs font-bold text-amber-800">{records.length - published.length} draft{records.length - published.length === 1 ? "" : "s"} not visible to pupils</p> : null}<div className="mt-6 grid gap-2"><Link href={`/courses/${subject.id}`} className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-200 px-4 font-bold hover:bg-slate-50"><span className="flex items-center gap-2"><PlayCircle className="size-4" />Student course</span><ArrowRight className="size-4" /></Link><Link href={`/admin/lessons/new`} className="inline-flex min-h-11 items-center justify-between rounded-xl bg-violet-50 px-4 font-bold text-violet-800 hover:bg-violet-100"><span className="flex items-center gap-2"><Sparkles className="size-4" />Create lesson</span><ArrowRight className="size-4" /></Link></div></SkulKidCard>; })}</section>;
}

function contentDetails(record: AdminLessonRecord) {
  const parsed = curriculumFixtureSchema.safeParse(record.fixture);
  if (!parsed.success) return { blocks: 0, objectives: 0 };
  const version = parsed.data.lessonVersions.find((item) => item.lessonId === record.id) ?? parsed.data.lessonVersions[0];
  return { blocks: version?.blocks.length ?? 0, objectives: version?.learningObjectives.length ?? 0 };
}

const tones = { blue: "bg-blue-100 text-blue-800", green: "bg-green-100 text-green-800", violet: "bg-violet-100 text-violet-800", amber: "bg-amber-100 text-amber-900" } as const;
function Metric({ icon: Icon, label, value, detail, tone }: { icon: LucideIcon; label: string; value: number | string; detail: string; tone: keyof typeof tones }) { return <SkulKidCard className="group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"><div className="flex items-center justify-between gap-3"><span className={`grid size-11 place-items-center rounded-2xl ${tones[tone]}`}><Icon className="size-5" /></span><span className="text-xs font-black uppercase tracking-wide text-muted">Live</span></div><p className="mt-4 text-3xl font-black">{value}</p><p className="mt-1 font-bold text-text-secondary">{label}</p><p className="mt-1 text-sm text-muted">{detail}</p></SkulKidCard>; }
function Count({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-white p-3"><b className="block text-xl">{value}</b><span className="text-xs text-muted">{label}</span></div>; }
