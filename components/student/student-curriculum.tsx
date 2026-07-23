"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, Calculator, CheckCircle2, ExternalLink, FileText, FlaskConical, Languages, Map as MapIcon, Sparkles, type LucideIcon } from "lucide-react";
import { StudentShell } from "@/components/student/student-shell";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { ghanaPrimaryCurriculum } from "@/data/ghana-primary-curriculum";
import { curriculumFixtureSchema } from "@/domains/curriculum/schemas/lesson-version-schemas";
import { readAdminLessons, type AdminLessonRecord } from "@/lib/admin/lesson-library";
import { cn } from "@/lib/utils";

type SubjectId = "mathematics" | "english-language" | "science";
type SubjectConfig = { id: SubjectId; name: string; officialName: string; icon: LucideIcon; colour: string; soft: string; description: string };

const subjects: SubjectConfig[] = [
  { id: "mathematics", name: "Mathematics", officialName: "Mathematics", icon: Calculator, colour: "bg-blue-700", soft: "bg-blue-50 text-blue-800 border-blue-200", description: "Build number sense, solve problems and understand shapes, measures and data." },
  { id: "english-language", name: "English Language", officialName: "English Language", icon: Languages, colour: "bg-violet-700", soft: "bg-violet-50 text-violet-800 border-violet-200", description: "Grow your speaking, listening, reading, writing, grammar and creative communication." },
  { id: "science", name: "Science", officialName: "Science", icon: FlaskConical, colour: "bg-emerald-700", soft: "bg-emerald-50 text-emerald-800 border-emerald-200", description: "Explore living things, materials, forces, the environment and how our world works." }
];
const grades = [1, 2, 3, 4, 5, 6];

export function StudentCurriculum() {
  const [subjectId, setSubjectId] = useState<SubjectId>("mathematics");
  const [grade, setGrade] = useState(1);
  const [records, setRecords] = useState<AdminLessonRecord[]>([]);
  useEffect(() => {
    const refresh = () => setRecords(readAdminLessons().filter((lesson) => lesson.status === "published"));
    refresh(); window.addEventListener("storage", refresh); window.addEventListener("skulkid:lessons-changed", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("skulkid:lessons-changed", refresh); };
  }, []);
  const subject = subjects.find((item) => item.id === subjectId)!;
  const lessons = useMemo(() => records.filter((lesson) => lesson.subject === subjectId && lesson.grade === grade), [records, subjectId, grade]);
  const units = useMemo(() => groupByUnit(lessons), [lessons]);
  const officialDocuments = ghanaPrimaryCurriculum.filter((document) => document.subject === subject.officialName && document.gradeLevels.includes(`B${grade}`));
  const availableGrades = new Set(records.filter((lesson) => lesson.subject === subjectId).map((lesson) => lesson.grade));

  return <StudentShell activeItem="curriculum"><main className="mx-auto w-full max-w-7xl">
    <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-violet-800 p-6 text-white shadow-[0_28px_70px_rgba(30,41,59,.25)] sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-cyan-300/20 blur-3xl" /><div className="relative max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest ring-1 ring-white/20"><BookOpenCheck className="size-4 text-amber-300" />Your learning map</span><h1 className="mt-5 text-3xl font-black sm:text-5xl">Know what you are learning—and why</h1><p className="mt-4 text-base leading-8 text-blue-100 sm:text-lg">Explore Ghana’s primary curriculum by subject and level. See the skills you will build and open lessons that are ready for you.</p></div>
    </header>

    <section className="mt-6" aria-labelledby="subject-heading"><div className="mb-3 flex items-center gap-3"><MapIcon className="size-5 text-primary" /><h2 className="text-xl font-black" id="subject-heading">Choose a subject</h2></div><div className="grid gap-3 md:grid-cols-3">{subjects.map((item) => { const Icon = item.icon; const active = item.id === subjectId; return <button aria-pressed={active} className={cn("flex items-center gap-4 rounded-2xl border-2 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md", active ? "border-primary ring-4 ring-blue-100" : "border-slate-200")} key={item.id} onClick={() => setSubjectId(item.id)} type="button"><span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl text-white", item.colour)}><Icon className="size-6" /></span><span><b className="block text-lg">{item.name}</b><span className="mt-1 block text-xs text-muted">Basic 1–6 curriculum</span></span>{active ? <CheckCircle2 className="ml-auto size-5 text-primary" /> : null}</button>; })}</div></section>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="grade-heading"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black" id="grade-heading">Choose your primary level</h2><p className="mt-1 text-sm text-muted">Basic 1 is the first primary level; Basic 6 is the final one.</p></div><div className="grid grid-cols-6 gap-2">{grades.map((value) => <button aria-pressed={grade === value} className={cn("grid min-h-12 min-w-11 place-items-center rounded-xl text-sm font-black transition", grade === value ? "bg-primary text-white shadow-md" : availableGrades.has(value) ? "bg-blue-50 text-blue-800 hover:bg-blue-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200")} key={value} onClick={() => setGrade(value)} type="button">B{value}</button>)}</div></div></section>

    <section className={cn("mt-6 rounded-[2rem] border p-6 sm:p-8", subject.soft)}><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-widest">{subject.name} · Basic {grade}</p><h2 className="mt-2 text-3xl font-black">What you will explore</h2><p className="mt-3 leading-7">{subject.description}</p></div><div className="rounded-2xl bg-white/80 px-5 py-4 text-center shadow-sm"><b className="block text-3xl">{lessons.length}</b><span className="text-xs font-bold">published lesson{lessons.length === 1 ? "" : "s"}</span></div></div>
      {officialDocuments.map((document) => <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 sm:flex-row sm:items-center sm:justify-between" key={document.id}><div className="flex items-start gap-3"><FileText className="mt-0.5 size-5 shrink-0" /><div><p className="font-black">{document.title}</p><p className="mt-1 text-sm leading-6 opacity-80">{document.note}</p></div></div><a className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-current/20 px-4 text-sm font-black hover:bg-white" href={document.documentUrl ?? document.officialSourceUrl} rel="noreferrer" target="_blank">Official source<ExternalLink className="size-4" /></a></div>)}
    </section>

    <section className="mt-7" aria-labelledby="path-heading"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-violet-700">Published learning path</p><h2 className="mt-1 text-2xl font-black" id="path-heading">{subject.name} · Basic {grade}</h2></div><Link className="hidden items-center gap-2 text-sm font-black text-primary sm:inline-flex" href={`/courses/${subject.id}`}>Open course<ArrowRight className="size-4" /></Link></div>
      {units.length ? <div className="mt-4 grid gap-5">{units.map((unit, unitIndex) => <SkulKidCard className="overflow-hidden" key={unit.name}><div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white">{unitIndex + 1}</span><div><p className="text-xs font-black uppercase tracking-wider text-muted">Curriculum unit</p><h3 className="text-xl font-black">{unit.name}</h3></div></div></div><div className="divide-y divide-slate-100">{unit.lessons.map((lesson, index) => { const details = lessonDetails(lesson); return <article className="p-5 sm:p-6" key={lesson.id}><div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-800">Lesson {index + 1}</span>{details.code ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{details.code}</span> : null}<span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">{lesson.xp} XP</span></div><h4 className="mt-3 text-xl font-black">{lesson.title}</h4><p className="mt-2 text-sm leading-6 text-text-secondary">{lesson.description}</p>{details.objectives.length ? <ul className="mt-3 grid gap-1 text-sm text-slate-700">{details.objectives.slice(0, 3).map((objective) => <li className="flex gap-2" key={objective}><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />{objective}</li>)}</ul> : null}</div><Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-black text-white" href={`/preview/lessons/${lesson.id}`}>Start lesson<ArrowRight className="size-4" /></Link></div></article>; })}</div></SkulKidCard>)}</div> : <SkulKidCard className="mt-4 border-dashed p-8 text-center"><Sparkles className="mx-auto size-10 text-violet-500" /><h3 className="mt-3 text-xl font-black">Lessons are being prepared</h3><p className="mx-auto mt-2 max-w-xl text-text-secondary">You can still explore the official curriculum above. Published {subject.name} lessons for Basic {grade} will appear here automatically.</p><Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-5 font-black" href={`/courses/${subject.id}`}>Browse {subject.name}<ArrowRight className="size-4" /></Link></SkulKidCard>}
    </section>
  </main></StudentShell>;
}

function groupByUnit(lessons: AdminLessonRecord[]) {
  const groups = new Map<string, AdminLessonRecord[]>();
  lessons.forEach((lesson) => { const name = lesson.unit.trim() || "General learning"; groups.set(name, [...(groups.get(name) ?? []), lesson]); });
  return [...groups].map(([name, groupedLessons]) => ({ name, lessons: groupedLessons }));
}

function lessonDetails(record: AdminLessonRecord) {
  const parsed = curriculumFixtureSchema.safeParse(record.fixture);
  if (!parsed.success) return { code: "", objectives: [] as string[] };
  const version = parsed.data.lessonVersions.find((item) => item.lessonId === record.id) ?? parsed.data.lessonVersions[0];
  return { code: version?.learningObjectives[0]?.code ?? "", objectives: version?.learningObjectives.map((objective) => objective.description) ?? [] };
}
