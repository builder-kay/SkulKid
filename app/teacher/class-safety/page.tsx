"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, LockKeyhole, Megaphone, MessageCircle, Send, ShieldCheck, Trash2, UserCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Data = {
  classes: Array<{ id: string; name: string }>;
  settings: Array<{ classId: string; enabled: boolean; locked: boolean; postingStartsAt: string | null; postingEndsAt: string | null; guardianConsentRequired: boolean }>;
  reports: Array<{ id: string; classId: string; messageId: string; reason: string; details: string; status: string; createdAt: string }>;
  messages: Array<{ id: string; classId: string; body: string; senderRole: string; kind: string; moderationStatus: string; createdAt: string; deletedAt: string | null }>;
  consents: Array<{ classId: string; studentId: string; active: boolean; guardianConfirmedAt: string | null }>;
  memberships: Array<{ classId: string; studentId: string }>;
  students: Array<{ id: string; name: string }>;
  rules: string[];
};

export default function TeacherClassSafetyPage() {
  const [data, setData] = useState<Data | null>(null);
  const [classId, setClassId] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/teacher/class-safety", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setData(result);
    setClassId((current) => current || result.classes?.[0]?.id || "");
  }
  useEffect(() => { void load().catch((cause) => setError(cause.message)); }, []);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void load().catch(() => {
        // Preserve the current room while a background refresh is unavailable.
      });
    };
    const interval = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  useEffect(() => {
    if (!classId) return;
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`teacher-class-chat:${classId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ClassMessage", filter: `classId=eq.${classId}` }, () => {
        void load().catch(() => {
          // The 30-second fallback will retry if this refresh is interrupted.
        });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [classId]);
  const setting = data?.settings.find((item) => item.classId === classId);
  const messages = useMemo(() => data?.messages.filter((item) => item.classId === classId) ?? [], [classId, data]);
  const reports = useMemo(() => data?.reports.filter((item) => item.classId === classId) ?? [], [classId, data]);
  const learners = useMemo(() => (data?.memberships.filter((item) => item.classId === classId) ?? []).map((membership) => ({ ...membership, name: data?.students.find((item) => item.id === membership.studentId)?.name ?? "Learner", consent: data?.consents.find((item) => item.classId === classId && item.studentId === membership.studentId) })), [classId, data]);
  const openReports = reports.filter((item) => item.status === "open");
  const consented = learners.filter((learner) => learner.consent?.active).length;
  const selectedClass = data?.classes.find((item) => item.id === classId);

  async function mutate(payload: object, method = "PATCH") {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/teacher/class-safety", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save."); }
    finally { setBusy(false); }
  }
  function changeHours() {
    const start = window.prompt("Opening time (HH:MM), blank for any time", setting?.postingStartsAt ?? "07:00");
    const end = window.prompt("Closing time (HH:MM), blank for any time", setting?.postingEndsAt ?? "19:00");
    if (start !== null && end !== null) void mutate({ action: "settings", classId, enabled: setting?.enabled ?? true, locked: setting?.locked ?? false, postingStartsAt: start || null, postingEndsAt: end || null, guardianConsentRequired: setting?.guardianConsentRequired ?? true });
  }
  if (!data) return <main className="grid min-h-72 place-items-center"><Loader2 className="size-8 animate-spin text-emerald-700" /></main>;

  return <main className="mx-auto grid w-full max-w-[88rem] gap-5">
    <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-800 p-6 text-white shadow-xl sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full bg-emerald-300/15 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-100"><ShieldCheck className="size-4" />Supervised communication</span><h1 className="mt-4 text-3xl font-black sm:text-4xl">Class chat safety</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 sm:text-base">Keep class discussion visible, respectful and within school-approved boundaries.</p></div><label className="grid min-w-64 gap-2 text-xs font-black uppercase tracking-wider text-emerald-100">Active class<select className="min-h-12 rounded-xl border border-white/20 bg-white px-4 text-sm font-black normal-case tracking-normal text-slate-950 outline-none focus:ring-2 focus:ring-emerald-300" onChange={(event) => setClassId(event.target.value)} value={classId}>{data.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
    </header>
    {error ? <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 font-bold text-rose-800"><AlertTriangle className="size-5" />{error}</p> : null}
    {classId ? <>
      <section aria-label="Class safety summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SafetyStat icon={setting?.locked ? LockKeyhole : MessageCircle} label="Room status" tone={setting?.locked ? "amber" : "emerald"} value={setting?.locked ? "Paused" : "Open"} />
        <SafetyStat icon={AlertTriangle} label="Open reports" tone={openReports.length ? "rose" : "emerald"} value={String(openReports.length)} />
        <SafetyStat icon={Users} label="Learners" tone="violet" value={String(learners.length)} />
        <SafetyStat icon={UserCheck} label="Consent recorded" tone={consented === learners.length ? "emerald" : "amber"} value={`${consented}/${learners.length}`} />
      </section>
      <div className="grid gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
        <aside className="grid content-start gap-4 xl:sticky xl:top-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Live controls</p><h2 className="mt-1 font-black"><LockKeyhole className="mr-2 inline size-5 text-emerald-700" />Discussion room</h2></div><div className="grid gap-3 p-4">
            <div className={`rounded-xl border p-3 ${setting?.locked ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}><div className="flex items-center gap-2"><span className={`size-2.5 rounded-full ${setting?.locked ? "bg-amber-500" : "bg-emerald-500"}`} /><b className="text-sm">{selectedClass?.name}</b></div><p className="mt-1 pl-4 text-xs text-slate-600">{setting?.locked ? "Learners can read but cannot post." : "Learners can participate within the rules."}</p></div>
            <button className={`min-h-11 rounded-xl px-4 text-sm font-black ${setting?.locked ? "bg-emerald-700 text-white" : "bg-amber-100 text-amber-950"}`} disabled={busy} onClick={() => void mutate({ action: "settings", classId, enabled: setting?.enabled ?? true, locked: !setting?.locked, postingStartsAt: setting?.postingStartsAt ?? null, postingEndsAt: setting?.postingEndsAt ?? null, guardianConsentRequired: setting?.guardianConsentRequired ?? true })}>{setting?.locked ? "Resume discussion" : "Pause discussion"}</button>
            <div className="rounded-xl bg-slate-50 p-3 text-sm"><p className="flex items-center gap-2 font-black"><Clock3 className="size-4 text-slate-500" />Messaging hours</p><p className="mt-1 text-xs text-slate-600">{setting?.postingStartsAt && setting?.postingEndsAt ? `${setting.postingStartsAt}–${setting.postingEndsAt}` : "Open at any time"}</p></div>
            <button className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-bold hover:bg-slate-50" onClick={changeHours}>Change messaging hours</button>
          </div></section>
          <details className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" open><summary className="cursor-pointer list-none font-black text-emerald-950"><ShieldCheck className="mr-2 inline size-5" />Rules learners see</summary><ul className="mt-3 grid gap-2 pl-5 text-xs leading-5 text-emerald-950">{data.rules.map((rule) => <li className="list-disc" key={rule}>{rule}</li>)}</ul></details>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b p-4"><h2 className="font-black">Guardian consent</h2><p className="mt-1 text-xs leading-5 text-slate-500">Record consent only after school confirmation.</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${learners.length ? consented / learners.length * 100 : 0}%` }} /></div></div><div className="max-h-72 overflow-y-auto p-2">{learners.map((learner) => <div className="flex items-center justify-between gap-2 rounded-xl p-2.5 hover:bg-slate-50" key={learner.studentId}><span className="truncate text-sm font-bold">{learner.name}</span><button className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-black ${learner.consent?.active ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`} onClick={() => void mutate({ action: "consent", classId, studentId: learner.studentId, active: !learner.consent?.active })}>{learner.consent?.active ? "Recorded" : "Record"}</button></div>)}{!learners.length ? <p className="p-4 text-center text-xs text-slate-500">No learners in this class.</p> : null}</div></section>
        </aside>
        <div className="grid min-w-0 content-start gap-5">
          {openReports.length ? <section className="overflow-hidden rounded-2xl border border-rose-200 bg-rose-50"><div className="flex items-center gap-3 border-b border-rose-200 p-4"><span className="grid size-10 place-items-center rounded-xl bg-rose-600 text-white"><AlertTriangle className="size-5" /></span><div><h2 className="font-black text-rose-950">Reports needing attention</h2><p className="text-xs text-rose-800">{openReports.length} open report{openReports.length === 1 ? "" : "s"} in this class</p></div></div><div className="grid gap-2 p-3 sm:grid-cols-2">{openReports.map((item) => <article className="rounded-xl border border-rose-100 bg-white p-4 text-sm shadow-sm" key={item.id}><div className="flex items-start justify-between gap-3"><b className="capitalize text-rose-900">{item.reason.replaceAll("_", " ")}</b><span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-black uppercase text-rose-800">{item.status}</span></div><p className="mt-2 text-slate-700">{item.details || "No additional details."}</p><time className="mt-3 block text-[11px] font-semibold text-slate-400">{new Date(item.createdAt).toLocaleString()}</time></article>)}</div></section> : <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><CheckCircle2 className="size-5" /><div><p className="font-black">No open learner reports</p><p className="text-xs">Continue monitoring the class discussion.</p></div></div>}
          <form className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm" onSubmit={(event) => { event.preventDefault(); void mutate({ classId, body, kind: "announcement" }, "POST").then(() => setBody("")); }}><div className="flex items-center gap-3 border-b border-violet-100 bg-violet-50 p-4"><Megaphone className="size-5 text-violet-700" /><div><h2 className="font-black">Teacher announcement</h2><p className="text-xs text-slate-600">Posts visibly to everyone in {selectedClass?.name}.</p></div></div><div className="p-4"><textarea className="min-h-24 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" maxLength={1000} onChange={(event) => setBody(event.target.value)} placeholder="Write a clear announcement to the whole class…" value={body} /><div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-400">{body.length}/1000</span><button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-black text-white disabled:opacity-50" disabled={busy || body.trim().length < 2}><Send className="size-4" />Post announcement</button></div></div></form>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between gap-3 border-b p-5"><div><h2 className="text-xl font-black">Supervised timeline</h2><p className="text-sm text-slate-500">Every teacher and learner message remains visible here.</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{messages.length} messages</span></div><div className="max-h-[42rem] overflow-y-auto bg-slate-50 p-4 sm:p-5">{messages.length ? <div className="grid gap-3">{messages.map((item) => <article className={`flex ${item.senderRole === "teacher" ? "justify-end" : "justify-start"}`} key={item.id}><div className={`group flex max-w-[88%] gap-2 rounded-2xl border p-3 shadow-sm sm:max-w-[75%] ${item.deletedAt ? "border-slate-200 bg-slate-100 text-slate-500" : item.senderRole === "teacher" ? "border-violet-200 bg-violet-50" : "border-white bg-white"}`}><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wide text-slate-500"><span>{item.senderRole}</span><span className="rounded-full bg-white/70 px-1.5 py-0.5">{item.kind}</span>{item.moderationStatus !== "approved" ? <span className="text-amber-700">{item.moderationStatus}</span> : null}</div><p className={`mt-1 break-words text-sm leading-6 ${item.deletedAt ? "italic" : "text-slate-800"}`}>{item.deletedAt ? "Message removed by moderation" : item.body}</p><time className="mt-1 block text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</time></div>{!item.deletedAt ? <button aria-label="Delete message" className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 opacity-100 hover:bg-rose-50 hover:text-rose-700 sm:opacity-0 sm:group-hover:opacity-100" onClick={() => { const reason = window.prompt("Reason for removing this message:"); if (reason) void mutate({ action: "delete", classId, messageId: item.id, reason }); }} type="button"><Trash2 className="size-4" /></button> : null}</div></article>)}</div> : <div className="grid min-h-52 place-items-center text-center"><div><MessageCircle className="mx-auto size-9 text-slate-300" /><p className="mt-3 font-black text-slate-600">No class messages yet</p><p className="mt-1 text-sm text-slate-400">The supervised discussion will appear here.</p></div></div>}</div></section>
          {reports.length > openReports.length ? <details className="rounded-2xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-black text-slate-700">Report history ({reports.length - openReports.length} closed)</summary><div className="mt-3 grid gap-2">{reports.filter((item) => item.status !== "open").map((item) => <div className="rounded-xl bg-slate-50 p-3 text-xs" key={item.id}><b className="capitalize">{item.reason.replaceAll("_", " ")}</b><span className="ml-2 text-slate-500">{item.status} · {new Date(item.createdAt).toLocaleString()}</span></div>)}</div></details> : null}
        </div>
      </div>
    </> : null}
  </main>;
}

function SafetyStat({ icon: Icon, label, tone, value }: { icon: LucideIcon; label: string; tone: "emerald" | "amber" | "rose" | "violet"; value: string }) {
  const colours = { emerald: "bg-emerald-100 text-emerald-800", amber: "bg-amber-100 text-amber-800", rose: "bg-rose-100 text-rose-800", violet: "bg-violet-100 text-violet-800" };
  return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`grid size-11 place-items-center rounded-xl ${colours[tone]}`}><Icon className="size-5" /></span><div><p className="text-2xl font-black leading-none text-slate-950">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div></div>;
}
