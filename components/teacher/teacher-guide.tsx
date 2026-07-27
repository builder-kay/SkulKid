"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  MessageSquareText,
  MonitorCheck,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Users,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  filterTeacherTutorials,
  teacherTutorialPaths,
  teacherTutorials,
  type TeacherTutorial,
  type TeacherTutorialPath
} from "@/lib/teacher/tutorials";

const pathIcons = {
  start: Users,
  build: BookOpenCheck,
  assess: ClipboardCheck,
  communicate: MessageSquareText,
  monitor: MonitorCheck,
  personalise: Settings2
} satisfies Record<TeacherTutorialPath, typeof Users>;

const firstSetup = [
  ["Create class", "create-class"],
  ["Create course", "create-course"],
  ["Add module", "add-module"],
  ["Create lesson", "create-lesson"],
  ["Publish or assign", "publish-public-learning"],
  ["Create a quiz", "reusable-quiz"]
] as const;

export function TeacherGuide({ initialTopic = "" }: { initialTopic?: string }) {
  const initialTutorial = teacherTutorials.find((tutorial) => tutorial.id === initialTopic);
  const [query, setQuery] = useState("");
  const [path, setPath] = useState<"all" | TeacherTutorialPath>(initialTutorial?.path ?? "all");
  const searchRef = useRef<HTMLInputElement>(null);
  const visible = useMemo(() => filterTeacherTutorials(teacherTutorials, query, path), [path, query]);

  useEffect(() => {
    if (!initialTutorial) return;
    const target = document.getElementById(`tutorial-${initialTutorial.id}`);
    window.setTimeout(() => {
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      target?.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
    }, 120);
  }, [initialTutorial]);

  function clearSearch() {
    setQuery("");
    setPath("all");
    searchRef.current?.focus();
  }

  function jumpToTutorial(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    setQuery("");
    setPath("all");
    window.setTimeout(() => {
      const target = document.getElementById(`tutorial-${id}`) as HTMLDetailsElement | null;
      if (target && !target.open) target.open = true;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      target?.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
    }, 0);
  }

  return (
    <main className="mx-auto grid w-full max-w-[96rem] gap-6">
      <header className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-slate-950 via-violet-950 to-blue-800 p-6 text-white shadow-2xl sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative grid gap-7 xl:grid-cols-[1fr_23rem] xl:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.16em] ring-1 ring-white/20"><GraduationCap className="size-4 text-amber-300" />Teacher Learning Centre</span>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Teach confidently, one clear step at a time.</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-blue-100 sm:text-lg">Find the exact workflow for classes, courses, lessons, Public Learning, quizzes, communication and learner support.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-wider text-blue-200">Quick help</p>
            <p className="mt-2 text-sm leading-6 text-white">Search by what you want to do, or follow the first successful teaching setup below.</p>
            <button className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 font-black text-violet-950" onClick={() => searchRef.current?.focus()} type="button"><Search className="size-4" />Search the guide</button>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-[1.75rem] border border-emerald-200 bg-white shadow-sm" aria-labelledby="first-setup-title">
        <div className="bg-emerald-50 p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Recommended first path</p>
          <h2 className="mt-1 text-2xl font-black" id="first-setup-title">Your first successful teaching setup</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-950/75">Start with a classroom, organise the learning, then give learners something useful to complete.</p>
        </div>
        <ol className="grid gap-0 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-6">
          {firstSetup.map(([label, id], index) => (
            <li className="relative" key={id}>
              <a
                className="group flex min-h-24 items-center gap-3 rounded-2xl p-3 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                href={`#tutorial-${id}`}
                onClick={(event) => jumpToTutorial(event, id)}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-800">{index + 1}</span>
                <span className="font-black text-slate-800">{label}</span>
                <ArrowRight className="ml-auto size-4 text-slate-300 group-hover:text-emerald-700" />
              </a>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label className="relative">
          <Search className="pointer-events-none absolute left-4 top-4 size-5 text-slate-400" />
          <input
            aria-label="Search teacher tutorials"
            className="min-h-13 w-full rounded-2xl border border-slate-300 bg-slate-50 pl-12 pr-12 text-base outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search: create a course, schedule a quiz, send advice…"
            ref={searchRef}
            value={query}
          />
          {query ? <button aria-label="Clear tutorial search" className="absolute right-2 top-2 grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-200" onClick={() => setQuery("")} type="button"><X className="size-4" /></button> : null}
        </label>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Filter tutorials by learning path">
          <FilterButton active={path === "all"} label="All guides" onClick={() => setPath("all")} />
          {teacherTutorialPaths.map((item) => <FilterButton active={path === item.id} label={item.label} onClick={() => setPath(item.id)} key={item.id} />)}
        </div>
        <p className="text-xs font-bold text-slate-500" aria-live="polite">{visible.length} guide{visible.length === 1 ? "" : "s"} shown</p>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-8 xl:block">
          <p className="px-2 text-xs font-black uppercase tracking-wider text-slate-500">On this page</p>
          <nav className="mt-3 grid gap-1" aria-label="Teacher guide table of contents">
            {teacherTutorialPaths.map((item) => {
              const Icon = pathIcons[item.id];
              const count = visible.filter((tutorial) => tutorial.path === item.id).length;
              return <a className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold", count ? "text-slate-700 hover:bg-violet-50 hover:text-violet-900" : "pointer-events-none text-slate-300")} href={`#path-${item.id}`} key={item.id}><Icon className="size-4" /><span className="flex-1">{item.label}</span><span className="text-xs">{count}</span></a>;
            })}
          </nav>
        </aside>

        <div className="min-w-0 space-y-8">
          {teacherTutorialPaths.map((pathItem) => {
            const tutorials = visible.filter((tutorial) => tutorial.path === pathItem.id);
            if (!tutorials.length) return null;
            const Icon = pathIcons[pathItem.id];
            return (
              <section className="scroll-mt-6" id={`path-${pathItem.id}`} key={pathItem.id} aria-labelledby={`path-title-${pathItem.id}`}>
                <div className="mb-4 flex items-start gap-3 px-1">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Icon className="size-5" /></span>
                  <div><h2 className="text-2xl font-black sm:text-3xl" id={`path-title-${pathItem.id}`}>{pathItem.label}</h2><p className="mt-1 text-sm text-slate-600">{pathItem.description}</p></div>
                </div>
                <div className="grid gap-4">
                  {tutorials.map((tutorial) => <TutorialCard initialOpen={tutorial.id === initialTopic || Boolean(query)} key={tutorial.id} tutorial={tutorial} />)}
                </div>
              </section>
            );
          })}

          {!visible.length ? (
            <section className="grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center">
              <div><CircleHelp className="mx-auto size-12 text-violet-400" /><h2 className="mt-4 text-2xl font-black">No guide matched that search</h2><p className="mt-2 max-w-md text-slate-600">Try a shorter phrase such as “quiz”, “module”, “message” or “Public Learning”.</p><button className="mt-5 min-h-11 rounded-xl bg-violet-700 px-5 font-black text-white" onClick={clearSearch} type="button">Show every guide</button></div>
            </section>
          ) : null}
        </div>
      </div>

      <section className="rounded-[1.75rem] border border-blue-200 bg-blue-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Ready to teach?</p><h2 className="mt-1 text-xl font-black text-blue-950">Open the teacher overview and choose your next action.</h2></div>
          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 font-black text-white" href="/teacher">Teacher overview <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </main>
  );
}

function TutorialCard({ tutorial, initialOpen }: { tutorial: TeacherTutorial; initialOpen: boolean }) {
  const Icon = pathIcons[tutorial.path];
  const [open, setOpen] = useState(initialOpen);
  return (
    <details
      className="group scroll-mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm open:border-violet-200 open:shadow-md"
      id={`tutorial-${tutorial.id}`}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      open={open}
    >
      <summary className="flex min-h-24 cursor-pointer list-none items-center gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-600 sm:p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700 transition group-open:bg-violet-100 group-open:text-violet-700"><Icon className="size-5" /></span>
        <span className="min-w-0 flex-1"><span className="block text-xl font-black text-slate-950">{tutorial.title}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{tutorial.summary}</span></span>
        <ChevronDown className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-100 p-5 sm:p-6">
        <VisualFlow labels={tutorial.visual} />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <section><h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-500"><Sparkles className="size-4 text-violet-600" />Before you begin</h3><ul className="mt-3 flex flex-wrap gap-2">{tutorial.prerequisites.map((item) => <li className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700" key={item}>{item}</li>)}</ul></section>
            <section className="mt-6"><h3 className="text-lg font-black">Step by step</h3><ol className="mt-4 grid gap-3">{tutorial.steps.map((step, index) => <li className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700" key={step}><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-violet-700 text-xs font-black text-white">{index + 1}</span><span>{step}</span></li>)}</ol></section>
          </div>
          <aside className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><CheckCircle2 className="size-5 text-emerald-700" /><h3 className="mt-2 font-black text-emerald-950">You’ll know it worked when…</h3><p className="mt-2 text-sm leading-6 text-emerald-900">{tutorial.success}</p></div>
            {tutorial.note ? <NoteCallout note={tutorial.note} /> : null}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><TriangleAlert className="size-5 text-amber-700" /><h3 className="mt-2 font-black text-amber-950">If something goes wrong</h3><ul className="mt-2 grid gap-2 text-xs leading-5 text-amber-900">{tutorial.mistakes.map((mistake) => <li className="flex gap-2" key={mistake}><span aria-hidden="true">•</span><span>{mistake}</span></li>)}</ul></div>
          </aside>
        </div>
        <div className="mt-6 flex justify-end border-t border-slate-100 pt-5"><Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 font-black text-white shadow-lg hover:bg-violet-800" href={tutorial.action.href}>{tutorial.action.label}<ArrowRight className="size-4" /></Link></div>
      </div>
    </details>
  );
}

function VisualFlow({ labels }: { labels: string[] }) {
  return <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-950 to-violet-950 p-4 text-white" aria-label={`Workflow: ${labels.join(", then ")}`}>{labels.map((label, index) => <span className="contents" key={label}><span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black ring-1 ring-white/15">{label}</span>{index < labels.length - 1 ? <ArrowRight className="size-4 text-violet-300" aria-hidden="true" /> : null}</span>)}</div>;
}

function NoteCallout({ note }: { note: NonNullable<TeacherTutorial["note"]> }) {
  const safety = note.tone === "safety";
  const publishing = note.tone === "publishing";
  const Icon = safety ? ShieldAlert : publishing ? BookOpenCheck : Lightbulb;
  return <div className={cn("rounded-2xl border p-4", safety ? "border-rose-200 bg-rose-50 text-rose-950" : publishing ? "border-blue-200 bg-blue-50 text-blue-950" : "border-violet-200 bg-violet-50 text-violet-950")}><Icon className="size-5" /><h3 className="mt-2 font-black">{safety ? "Use responsibly" : publishing ? "Publishing note" : "Helpful tip"}</h3><p className="mt-2 text-sm leading-6">{note.text}</p></div>;
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button aria-pressed={active} className={cn("min-h-10 shrink-0 rounded-xl px-4 text-sm font-black transition", active ? "bg-violet-700 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200")} onClick={onClick} type="button">{label}</button>;
}
