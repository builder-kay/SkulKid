"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, BookOpenCheck, CircleAlert, Server, ShieldCheck, UserPlus, Users, Wrench } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { AccessibleBars, AccessibleLineChart } from "@/components/admin/admin-charts";

type Analytics = {
  totals: { users: number; students: number; teachers: number; admins: number; suspended: number; pendingModeration: number; openDisputes: number; openIncidents: number };
  alerts: Array<{ tone: string; title: string; href: string }>;
  accountTrend: Array<{ date: string; students: number; teachers: number }>;
  activeTrend: Array<{ date: string; students: number; teachers: number }>;
  roles: Array<{ label: string; value: number }>;
  workload: Array<{ label: string; value: number }>;
  activity: Array<{ id: string; action: string; targetType: string; result: string; reason: string | null; createdAt: string }>;
};

export function AdminCommandCenter() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void fetch("/api/admin/analytics", { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load command center.");
      setData(result);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load command center."));
  }, []);

  if (error) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 font-bold text-rose-900">{error}</div>;
  if (!data) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard">{Array.from({ length: 4 }, (_, index) => <div className="h-32 animate-pulse rounded-2xl bg-slate-200" key={index} />)}</div>;

  return (
    <div className="grid gap-6">
      <section aria-labelledby="attention-title">
        <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-rose-700">Needs attention</p><h2 className="mt-1 text-2xl font-black" id="attention-title">Operational queue</h2></div><Link className="text-sm font-bold text-emerald-700" href="/admin/operations">Open operations →</Link></div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {data.alerts.length ? data.alerts.map((alert) => <Link className="flex min-h-20 items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-950 transition hover:border-amber-400" href={alert.href} key={`${alert.href}-${alert.title}`}><AlertTriangle className="size-5 shrink-0" />{alert.title}<ArrowRight className="ml-auto size-4" /></Link>) : <div className="col-span-full flex min-h-20 items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-900"><ShieldCheck className="size-5" />No urgent platform work is waiting.</div>}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform metrics">
        <Metric icon={Users} label="People" value={data.totals.users} detail={`${data.totals.students} students · ${data.totals.teachers} teachers`} />
        <Metric icon={BookOpenCheck} label="Moderation queue" value={data.totals.pendingModeration} detail="Draft lessons awaiting review" />
        <Metric icon={CircleAlert} label="Open disputes" value={data.totals.openDisputes} detail="Point decisions awaiting admin" />
        <Metric icon={Server} label="Active incidents" value={data.totals.openIncidents} detail={`${data.totals.suspended} suspended accounts`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SkulKidCard className="p-5 sm:p-6"><h2 className="text-xl font-black">30-day account growth</h2><p className="mt-1 text-sm text-slate-500">New students and teachers by day</p><div className="mt-5"><AccessibleLineChart title="New accounts over the last 30 days" data={data.accountTrend} series={[{ key: "students", label: "Students", color: "#059669" }, { key: "teachers", label: "Teachers", color: "#7c3aed", dash: true }]} /></div></SkulKidCard>
        <SkulKidCard className="p-5 sm:p-6"><h2 className="text-xl font-black">30-day active people</h2><p className="mt-1 text-sm text-slate-500">Accounts grouped by their latest sign-in day</p><div className="mt-5"><AccessibleLineChart title="Active accounts over the last 30 days" data={data.activeTrend} series={[{ key: "students", label: "Students", color: "#2563eb" }, { key: "teachers", label: "Teachers", color: "#d97706", dash: true }]} /></div></SkulKidCard>
        <SkulKidCard className="p-5 sm:p-6"><h2 className="text-xl font-black">Accounts by role</h2><div className="mt-6"><AccessibleBars title="Account distribution" data={data.roles} /></div></SkulKidCard>
        <SkulKidCard className="p-5 sm:p-6"><h2 className="text-xl font-black">Open workload</h2><div className="mt-6"><AccessibleBars title="Open administrative workload" data={data.workload} /></div></SkulKidCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <SkulKidCard className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="text-xl font-black">Recent audited activity</h2><p className="mt-1 text-sm text-slate-500">Sensitive administrative changes</p></div><Link className="text-sm font-bold text-emerald-700" href="/admin/security">View audit log</Link></div><div className="divide-y divide-slate-100">{data.activity.length ? data.activity.map((event) => <div className="flex items-start gap-3 p-4" key={event.id}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100"><Activity className="size-4" /></span><div><p className="font-bold">{event.action.replaceAll(".", " ")}</p><p className="mt-1 text-xs text-slate-500">{event.targetType} · {new Date(event.createdAt).toLocaleString()}</p></div><span className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-800">{event.result}</span></div>) : <p className="p-6 text-sm text-slate-500">No audited changes yet.</p>}</div></SkulKidCard>
        <SkulKidCard className="p-5"><h2 className="text-xl font-black">Quick actions</h2><div className="mt-4 grid gap-2"><Quick href="/admin/users?create=1" icon={UserPlus} label="Add a person" /><Quick href="/admin/moderation" icon={BookOpenCheck} label="Review content" /><Quick href="/admin/security" icon={ShieldCheck} label="Review security" /><Quick href="/admin/operations" icon={Wrench} label="Run diagnostics" /></div></SkulKidCard>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: React.ElementType; label: string; value: number; detail: string }) {
  return <SkulKidCard className="p-5"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Icon className="size-5" /></span><p className="mt-4 text-3xl font-black">{value}</p><p className="font-bold">{label}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></SkulKidCard>;
}
function Quick({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return <Link className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-3 font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900" href={href}><Icon className="size-4" />{label}<ArrowRight className="ml-auto size-4" /></Link>;
}
