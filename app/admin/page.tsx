import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  Layers3,
  Plus,
  Settings2,
  Sparkles,
  SquarePen,
  TrendingUp
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { subjects } from "@/data/subjects";
import { sampleLessons } from "@/data/sample-lessons";
import { ghanaPrimaryCurriculum } from "@/data/ghana-primary-curriculum";
import { sampleCurriculum } from "@/domains/curriculum/fixtures/sample-curriculum";

const published = sampleCurriculum.lessonVersions.filter((version) => version.status === "published").length;
const blocks = sampleCurriculum.lessonVersions.reduce((total, version) => total + version.blocks.length, 0);
const objectives = sampleCurriculum.lessonVersions.reduce((total, version) => total + version.learningObjectives.length, 0);
const totalMinutes = sampleCurriculum.lessonVersions.reduce((total, version) => total + version.estimatedMinutes, 0);

export default function AdminDashboardPage() {
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY);

  return (
    <main className="mx-auto w-full max-w-[90rem] space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-violet-200 bg-gradient-to-br from-slate-950 via-violet-950 to-violet-800 p-6 text-white shadow-[var(--shadow-card)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-violet-100">
              <Sparkles className="size-4" aria-hidden="true" />
              Admin command centre
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              Build learning paths pupils want to finish.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Create lessons, transform official curricula, check quality and preview the complete pupil experience from one workspace.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <Link href="/admin/lessons/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-bold text-violet-950 shadow-lg hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-900">
              <Plus className="size-5" aria-hidden="true" />Create lesson
            </Link>
            <Link href="/admin/lessons/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 font-bold text-white backdrop-blur hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <Bot className="size-5" aria-hidden="true" />Extract with AI
            </Link>
          </div>
        </div>
      </header>

      <section aria-label="Platform summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={BookOpenCheck} label="Active subjects" value={sampleCurriculum.subjects.length} detail={`${subjects.length} in the catalogue`} tone="blue" />
        <Metric icon={FileCheck2} label="Published lessons" value={published} detail={`${sampleCurriculum.lessonVersions.length} lesson versions`} tone="green" />
        <Metric icon={Layers3} label="Interactive blocks" value={blocks} detail={`${objectives} learning objectives`} tone="violet" />
        <Metric icon={Clock3} label="Learning time" value={`${totalMinutes}m`} detail="Across published content" tone="amber" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]">
        <SkulKidCard className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-violet-700">Curriculum coverage</p>
              <h2 className="mt-1 text-2xl font-black">Subjects ready for pupils</h2>
            </div>
            <Link href="/admin/curriculum" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900">
              Manage curriculum <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-3 sm:p-6">
            {subjects.map((subject) => {
              const lessons = sampleLessons.filter((lesson) => lesson.subjectId === subject.id);
              const expectedMinimum = 18;
              const coverage = Math.min(100, Math.round((lessons.length / expectedMinimum) * 100));
              return (
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={subject.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-white text-lg font-black shadow-sm" style={{ color: subject.color }}>{subject.name.charAt(0)}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${lessons.length ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-950"}`}>{lessons.length ? "In progress" : "Not started"}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-black">{subject.name}</h3>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full" style={{ width: `${coverage}%`, background: subject.color }} /></div>
                  <div className="mt-2 flex justify-between text-xs font-bold text-muted"><span>{lessons.length} lessons</span><span>{coverage}% target</span></div>
                  <Link href={lessons.length ? `/courses/${subject.slug}` : "/admin/lessons/new"} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900">{lessons.length ? "Preview course" : "Create first lesson"}<ArrowRight className="size-4" /></Link>
                </article>
              );
            })}
          </div>
        </SkulKidCard>

        <SkulKidCard className="p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><TrendingUp className="size-5" /></span><div><p className="text-xs font-black uppercase tracking-wide text-muted">System readiness</p><h2 className="text-xl font-black">Authoring health</h2></div></div>
          <div className="mt-5 space-y-3">
            <StatusRow ready label="Lesson validation" detail="Strict schemas active" />
            <StatusRow ready label="Official curriculum" detail={`${ghanaPrimaryCurriculum.length} source records`} />
            <StatusRow ready={openAiConfigured} label="OpenAI generation" detail={openAiConfigured ? "API connected" : "API key required"} />
            <StatusRow ready={false} label="Admin authentication" detail="Required before production" />
            <StatusRow ready={false} label="Database publishing" detail="Approval workflow pending" />
          </div>
          <Link href="/admin/settings" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Settings2 className="size-4" />Dashboard settings</Link>
        </SkulKidCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(20rem,0.65fr)_minmax(0,1.35fr)]">
        <SkulKidCard className="p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-wider text-violet-700">Quick actions</p>
          <h2 className="mt-1 text-2xl font-black">What would you like to do?</h2>
          <div className="mt-5 grid gap-3">
            <QuickAction href="/admin/lessons/new" icon={SquarePen} title="Write a lesson" text="Add teaching material, quizzes and rewards manually." />
            <QuickAction href="/admin/lessons/new" icon={Bot} title="Extract a lesson with AI" text="Upload a lesson note and receive an editable lesson and quiz draft." />
            <QuickAction href="/admin/curriculum" icon={FileText} title="Browse official curricula" text="Filter NaCCA sources by grade and subject." />
            <QuickAction href="/preview/lessons" icon={Eye} title="Preview pupil lessons" text="Test published blocks and feedback states." />
          </div>
        </SkulKidCard>

        <SkulKidCard className="overflow-hidden">
          <div className="border-b border-slate-200 p-5 sm:p-6"><p className="text-xs font-black uppercase tracking-wider text-violet-700">Content activity</p><h2 className="mt-1 text-2xl font-black">Recently available lessons</h2></div>
          <div className="divide-y divide-slate-200">
            {sampleLessons.slice(-5).reverse().map((lesson) => {
              const subject = subjects.find((candidate) => candidate.id === lesson.subjectId);
              return <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={lesson.id}><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-black" style={{ color: subject?.color }}>{subject?.name.charAt(0) ?? "L"}</span><div className="min-w-0"><h3 className="truncate font-bold">{lesson.title}</h3><p className="mt-0.5 text-sm text-muted">{subject?.name} · {lesson.estimatedMinutes} min · {lesson.blocks.length} blocks</p></div></div><Link href={`/preview/lessons/${lesson.id}`} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"><Eye className="size-4" />Preview</Link></div>;
            })}
          </div>
        </SkulKidCard>
      </section>

      {!openAiConfigured ? <div role="note" className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950"><CircleAlert className="mt-0.5 size-5 shrink-0" /><div><p className="font-bold">AI generation needs configuration</p><p className="mt-1 text-sm leading-6">Add <code>OPENAI_API_KEY</code> to the server environment. Manual lesson creation and the official curriculum library work without OpenAI.</p></div></div> : null}
    </main>
  );
}

const toneStyles = { blue: "bg-blue-100 text-blue-800", green: "bg-green-100 text-green-800", violet: "bg-violet-100 text-violet-800", amber: "bg-amber-100 text-amber-900" } as const;

function Metric({ icon: Icon, label, value, detail, tone }: { icon: LucideIcon; label: string; value: number | string; detail: string; tone: keyof typeof toneStyles }) {
  return <SkulKidCard className="group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"><div className="flex items-center justify-between gap-3"><span className={`grid size-11 place-items-center rounded-2xl ${toneStyles[tone]}`}><Icon className="size-5" /></span><span className="text-xs font-black uppercase tracking-wide text-muted">Live</span></div><p className="mt-4 text-3xl font-black">{value}</p><p className="mt-1 font-bold text-text-secondary">{label}</p><p className="mt-1 text-sm text-muted">{detail}</p></SkulKidCard>;
}

function StatusRow({ ready, label, detail }: { ready: boolean; label: string; detail: string }) {
  return <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><span className={`grid size-8 shrink-0 place-items-center rounded-full ${ready ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>{ready ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}</span><div className="min-w-0"><p className="text-sm font-bold">{label}</p><p className="truncate text-xs text-muted">{detail}</p></div></div>;
}

function QuickAction({ href, icon: Icon, title, text }: { href: string; icon: LucideIcon; title: string; text: string }) {
  return <Link href={href} className="group flex min-h-20 items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-violet-100 group-hover:text-violet-800"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="block font-black">{title}</span><span className="mt-1 block text-sm leading-5 text-muted">{text}</span></span><ArrowRight className="size-4 shrink-0 text-slate-400 group-hover:text-violet-700" /></Link>;
}
