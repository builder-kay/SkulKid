"use client";

import { useEffect, useState } from "react";
import { KeyRound, LockKeyhole, RefreshCw, Search, ShieldCheck, UserX } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type AuditEvent = { id: string; actorId: string | null; action: string; targetType: string; targetId: string | null; result: string; reason: string | null; createdAt: string };

export default function AdminSecurityPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/audit?${new URLSearchParams({ q: query })}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setEvents(data.events ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load audit history."); }
    finally { setLoading(false); }
  }
  useEffect(() => { const timer = setTimeout(() => void load(), 300); return () => clearTimeout(timer); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return <main className="mx-auto grid w-full max-w-[96rem] gap-6">
    <AdminPageHeader description="Review privileged changes, enforce least privilege, and investigate account actions." eyebrow="Security administration" icon={ShieldCheck} title="Security & audit" tone="dark" />
    <section className="grid gap-4 md:grid-cols-3">
      <SecurityCard icon={LockKeyhole} title="Guarded role changes" text="Self-demotion and removal of the final administrator are blocked by the server." />
      <SecurityCard icon={UserX} title="Account containment" text="Suspension and privacy actions require a recorded administrative reason." />
      <SecurityCard icon={KeyRound} title="Secret-safe logging" text="Passwords, access tokens and recovery tokens are excluded from audit details." />
    </section>
    {error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900">{error}</div> : null}
    <SkulKidCard className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search audit events" className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" placeholder="Search actions and targets" value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 font-bold" onClick={() => void load()}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh</button></div>
      <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4">Action</th><th className="p-4">Target</th><th className="p-4">Reason</th><th className="p-4">Actor</th><th className="p-4">Time</th><th className="p-4">Result</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td className="p-8 text-slate-500" colSpan={6}>Loading audit history…</td></tr> : events.length ? events.map((event) => <tr key={event.id}><td className="p-4 font-black capitalize">{event.action.replaceAll(".", " ")}</td><td className="p-4 text-slate-600">{event.targetType}{event.targetId ? ` · ${event.targetId.slice(0, 8)}…` : ""}</td><td className="max-w-sm p-4 text-slate-600">{event.reason || "No reason recorded"}</td><td className="p-4 font-mono text-xs text-slate-500">{event.actorId?.slice(0, 8) ?? "system"}</td><td className="whitespace-nowrap p-4 text-slate-600">{new Date(event.createdAt).toLocaleString()}</td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-black capitalize ${event.result === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{event.result}</span></td></tr>) : <tr><td className="p-8 text-slate-500" colSpan={6}>No audit events match this search.</td></tr>}</tbody></table></div>
    </SkulKidCard>
  </main>;
}
function SecurityCard({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) { return <SkulKidCard className="p-5"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Icon className="size-5" /></span><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></SkulKidCard>; }
