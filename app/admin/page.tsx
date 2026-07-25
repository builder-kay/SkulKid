import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  Plus,
  Scale,
  ShieldAlert,
  Users,
  Settings2,
  Sparkles
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PlatformAdminOverview } from "@/components/admin/platform-admin-overview";

export default function PlatformAdminHomePage() {
  return (
    <main className="mx-auto w-full max-w-[90rem] space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-800 p-6 text-white shadow-[var(--shadow-card)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-100">
            <Sparkles className="size-4" />
            Platform control centre
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            Run SkulKid safely, clearly and at scale.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50/90 sm:text-lg">
            Manage users, review teacher subjects, moderate content, configure system settings and monitor platform activity.
          </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-black text-slate-950 shadow-lg hover:bg-emerald-50" href="/admin/moderation"><ShieldAlert className="size-4" />Review content</Link>
            <Link className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 font-black text-white hover:bg-white/15" href="/teacher/lessons/new"><Plus className="size-4" />Create lesson</Link>
          </div>
        </div>
      </header>

      <PlatformAdminOverview />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Common tasks</p><h2 className="mt-1 text-2xl font-black">Manage the platform</h2></div>
        <Link className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700" href="/admin/activity">See all activity <ArrowRight className="size-4" /></Link>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminCard href="/admin/users" icon={Users} title="Manage users" text="View learners, teachers and admins. Update roles and account status." />
        <AdminCard href="/admin/courses" icon={BookOpenCheck} title="Teacher subjects" text="Review subjects and learning paths published by teachers." />
        <AdminCard href="/admin/moderation" icon={ShieldAlert} title="Moderate content" text="Approve, flag or take down lessons and drafts that need review." />
        <AdminCard href="/admin/point-disputes" icon={Scale} title="Resolve point disputes" text="Review learner reports and restore points when a deduction should be reversed." />
        <AdminCard href="/admin/activity" icon={Activity} title="Platform activity" text="Monitor recent publishing, enrolments and system health signals." />
        <AdminCard href="/admin/settings" icon={Settings2} title="System settings" text="Configure platform defaults, feature flags and operational controls." />
      </section>
    </main>
  );
}

function AdminCard({ href, icon: Icon, title, text }: { href: string; icon: LucideIcon; title: string; text: string }) {
  return (
    <Link
      className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[var(--shadow-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
      href={href}
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-600 group-hover:text-white">
        <Icon className="size-5" />
      </span>
      <h2 className="mt-4 text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
        Open <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
