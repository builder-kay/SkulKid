import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleHelp,
  CircleAlert,
  FileText,
  Plus,
  Settings2,
  Sparkles,
  SquarePen,
  TrendingUp,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LiveAdminMetrics, LiveCurriculumCoverage, LiveRecentLessons } from "@/components/admin/live-admin-overview";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { TeacherTrustCard } from "@/components/teacher/teacher-trust-card";
import { ghanaPrimaryCurriculum } from "@/data/ghana-primary-curriculum";

export default function AdminDashboardPage() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);

  return (
    <main className="mx-auto w-full max-w-[90rem] space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-violet-200 bg-gradient-to-br from-slate-950 via-violet-950 to-violet-800 p-6 text-white shadow-[var(--shadow-card)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-violet-100">
              <Sparkles className="size-4" aria-hidden="true" />
              Teacher command centre
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              Build learning paths pupils want to finish.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Create lessons, transform official curricula and guide pupil learning from one workspace.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <Link href="/teacher/lessons/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-bold text-violet-950 shadow-lg hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-900">
              <Plus className="size-5" aria-hidden="true" />Create lesson
            </Link>
            <Link href="/teacher/lessons/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 font-bold text-white backdrop-blur hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <Bot className="size-5" aria-hidden="true" />Extract with AI
            </Link>
          </div>
        </div>
      </header>

      <LiveAdminMetrics />
      <TeacherTrustCard />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]">
        <LiveCurriculumCoverage />

        <SkulKidCard className="overflow-hidden p-0">
          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-5 text-white sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20"><TrendingUp className="size-5" /></span>
              <div><p className="text-xs font-black uppercase tracking-[.14em] text-blue-100">Teaching tools</p><h2 className="mt-1 text-2xl font-black">Ready when you are</h2><p className="mt-2 text-sm leading-5 text-blue-100/85">A quick look at the tools available for preparing and sharing learning.</p></div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid gap-2">
              <StatusRow ready label="Lesson quality checks" detail="Your lesson is checked for missing information before publishing." />
              <StatusRow ready label="NaCCA curriculum library" detail={`${ghanaPrimaryCurriculum.length} official curriculum documents are ready to browse.`} />
              <StatusRow ready={geminiConfigured} label="AI lesson assistant" detail={geminiConfigured ? "Ready to turn lesson notes into editable drafts." : "Temporarily unavailable. You can still create lessons manually."} />
              <StatusRow ready label="Secure teacher account" detail="You are signed in and your workspace is protected." />
              <StatusRow ready label="Save and publish" detail="Keep work private as a draft, then publish when it is ready." />
            </div>
            <Link href="/teacher/settings" className="mt-4 flex min-h-11 items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-black text-blue-900 transition hover:border-blue-400 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><span className="inline-flex items-center gap-2"><Settings2 className="size-4" />Teaching preferences</span><ArrowRight className="size-4" /></Link>
          </div>
        </SkulKidCard>
      </section>

      <section className="grid gap-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5 shadow-[var(--shadow-card)] sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-blue-300/20 blur-3xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-blue-700"><Sparkles className="size-4" />Quick actions</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Where would you like to begin?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Jump straight into your most common teaching tasks. Each tool keeps your work saved in the teacher workspace.</p>
            </div>
            <span className="hidden rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-black text-blue-800 sm:inline-flex">5 teaching tools</span>
          </div>
          <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <QuickAction eyebrow="Learn the platform" href="/teacher/tutorial" icon={CircleHelp} title="Teacher Guide" text="Watch clear tutorials for classes, subjects, lessons, quizzes and learner support." tone="violet" />
            <QuickAction eyebrow="Organise learners" href="/teacher/classes?create=1" icon={Users} title="Create a class" text="Invite learners, assign subjects and quizzes, and begin coaching." tone="blue" />
            <QuickAction eyebrow="Build manually" href="/teacher/lessons/new" icon={SquarePen} title="Write a lesson" text="Create teaching material, assessments and rewards step by step." tone="amber" />
            <QuickAction eyebrow="Save preparation time" href="/teacher/lessons/new#ai-extraction" icon={Bot} title="Extract with AI" text="Turn an uploaded lesson note into an editable lesson and quiz draft." tone="indigo" />
            <QuickAction eyebrow="Plan with standards" href="/teacher/nacca-curriculum" icon={FileText} title="NaCCA curricula" text="Find official curriculum sources by primary level and subject." tone="emerald" />
          </div>
        </section>
        <LiveRecentLessons />
      </section>

      {!geminiConfigured ? <div role="note" className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950"><CircleAlert className="mt-0.5 size-5 shrink-0" /><div><p className="font-bold">AI generation needs configuration</p><p className="mt-1 text-sm leading-6">Add <code>GEMINI_API_KEY</code> to the server environment. Manual lesson creation works without Gemini.</p></div></div> : null}
    </main>
  );
}

function StatusRow({ ready, label, detail }: { ready: boolean; label: string; detail: string }) {
  return <div className={`flex items-start gap-3 rounded-xl border p-3 ${ready ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50"}`}><span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{ready ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-black text-slate-900">{label}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{ready ? "Ready" : "Unavailable"}</span></div><p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p></div></div>;
}

function QuickAction({ eyebrow, href, icon: Icon, title, text, tone }: { eyebrow: string; href: string; icon: LucideIcon; title: string; text: string; tone: "violet" | "blue" | "amber" | "indigo" | "emerald" }) {
  const tones = {
    violet: "bg-violet-100 text-violet-700 group-hover:bg-violet-700",
    blue: "bg-blue-100 text-blue-700 group-hover:bg-blue-700",
    amber: "bg-amber-100 text-amber-700 group-hover:bg-amber-600",
    indigo: "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-700"
  };
  return <Link href={href} className="group flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><span className={`grid size-11 place-items-center rounded-xl transition group-hover:text-white ${tones[tone]}`}><Icon className="size-5" /></span><span className="mt-5 block text-[10px] font-black uppercase tracking-[.13em] text-slate-500">{eyebrow}</span><span className="mt-1 block text-lg font-black text-slate-950">{title}</span><span className="mt-2 block text-sm leading-5 text-slate-600">{text}</span><span className="mt-auto flex items-center justify-between pt-5 text-xs font-black text-blue-700"><span>Open tool</span><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></Link>;
}
