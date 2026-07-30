"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Loader2, LockKeyhole, Megaphone, ShieldCheck, Trash2 } from "lucide-react";

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
  const [data, setData] = useState<Data | null>(null); const [classId, setClassId] = useState(""); const [body, setBody] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function load() { const response = await fetch("/api/teacher/class-safety", { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setData(result); setClassId((current) => current || result.classes?.[0]?.id || ""); }
  useEffect(() => { void load().catch((cause) => setError(cause.message)); }, []);
  const setting = data?.settings.find((item) => item.classId === classId);
  const messages = useMemo(() => data?.messages.filter((item) => item.classId === classId) ?? [], [classId, data]);
  const reports = useMemo(() => data?.reports.filter((item) => item.classId === classId) ?? [], [classId, data]);
  const learners = useMemo(() => (data?.memberships.filter((item) => item.classId === classId) ?? []).map((membership) => ({ ...membership, name: data?.students.find((item) => item.id === membership.studentId)?.name ?? "Learner", consent: data?.consents.find((item) => item.classId === classId && item.studentId === membership.studentId) })), [classId, data]);
  async function mutate(payload: object, method = "PATCH") { setBusy(true); setError(""); try { const response = await fetch("/api/teacher/class-safety", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save."); } finally { setBusy(false); } }
  if (!data) return <main className="grid min-h-72 place-items-center"><Loader2 className="size-8 animate-spin text-emerald-700" /></main>;
  return <main className="mx-auto grid w-full max-w-7xl gap-5">
    <header><p className="text-xs font-black uppercase tracking-widest text-emerald-700">Supervised communication</p><h1 className="mt-1 text-3xl font-black">Class chat safety</h1><p className="mt-2 text-slate-600">Pause rooms, set messaging hours, publish announcements, remove messages and review learner reports.</p></header>
    {error ? <p className="rounded-xl bg-rose-50 p-3 font-bold text-rose-800">{error}</p> : null}
    <select className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 font-black" onChange={(event) => setClassId(event.target.value)} value={classId}>{data.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    {classId ? <div className="grid gap-5 xl:grid-cols-[22rem_1fr]">
      <aside className="grid content-start gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black"><LockKeyhole className="mr-2 inline size-5 text-emerald-700" />Room controls</h2>
          <div className="mt-4 grid gap-3">
            <button className="rounded-xl border border-slate-300 px-4 py-3 text-left font-bold" disabled={busy} onClick={() => void mutate({ action: "settings", classId, enabled: setting?.enabled ?? true, locked: !setting?.locked, postingStartsAt: setting?.postingStartsAt ?? null, postingEndsAt: setting?.postingEndsAt ?? null, guardianConsentRequired: setting?.guardianConsentRequired ?? true })}>{setting?.locked ? "Resume discussion" : "Pause discussion"}</button>
            <div className="rounded-xl bg-slate-50 p-3 text-sm"><Clock3 className="mr-1 inline size-4" />Posting hours: {setting?.postingStartsAt && setting?.postingEndsAt ? `${setting.postingStartsAt}–${setting.postingEndsAt}` : "Any time"}</div>
            <button className="rounded-xl border border-slate-300 px-4 py-3 text-left text-sm font-bold" onClick={() => { const start = window.prompt("Opening time (HH:MM), blank for any time", setting?.postingStartsAt ?? "07:00"); const end = window.prompt("Closing time (HH:MM), blank for any time", setting?.postingEndsAt ?? "19:00"); if (start !== null && end !== null) void mutate({ action: "settings", classId, enabled: setting?.enabled ?? true, locked: setting?.locked ?? false, postingStartsAt: start || null, postingEndsAt: end || null, guardianConsentRequired: setting?.guardianConsentRequired ?? true }); }}>Change messaging hours</button>
          </div>
        </section>
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><h2 className="font-black text-emerald-950"><ShieldCheck className="mr-2 inline size-5" />Rules learners see</h2><ul className="mt-3 grid gap-2 pl-5 text-sm text-emerald-950">{data.rules.map((rule) => <li className="list-disc" key={rule}>{rule}</li>)}</ul></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black">Guardian consent</h2><p className="mt-1 text-xs text-slate-500">Confirm only after your school has recorded guardian permission and the learner has accepted the rules.</p><div className="mt-3 grid gap-2">{learners.map((learner) => <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3" key={learner.studentId}><span className="truncate text-sm font-bold">{learner.name}</span><button className={`rounded-lg px-2.5 py-1.5 text-xs font-black ${learner.consent?.active ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`} onClick={() => void mutate({ action: "consent", classId, studentId: learner.studentId, active: !learner.consent?.active })}>{learner.consent?.active ? "Consent recorded" : "Record consent"}</button></div>)}</div></section>
      </aside>
      <div className="grid gap-5">
        <form className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); void mutate({ classId, body, kind: "announcement" }, "POST").then(() => setBody("")); }}><h2 className="font-black"><Megaphone className="mr-2 inline size-5 text-violet-700" />Post an announcement</h2><textarea className="mt-3 min-h-24 w-full rounded-xl border border-slate-300 p-3" maxLength={1000} onChange={(event) => setBody(event.target.value)} placeholder="Write to the whole class…" value={body} /><button className="mt-3 rounded-xl bg-violet-700 px-4 py-2.5 font-black text-white disabled:opacity-50" disabled={busy || body.trim().length < 2}>Post to class</button></form>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b p-5"><h2 className="text-xl font-black">Discussion timeline</h2><p className="text-sm text-slate-500">All learner and teacher messages are visible here.</p></div><div className="max-h-[32rem] divide-y overflow-y-auto">{messages.length ? messages.map((item) => <article className="flex gap-3 p-4" key={item.id}><div className="min-w-0 flex-1"><div className="flex gap-2 text-xs font-black uppercase text-slate-500"><span>{item.senderRole}</span><span>{item.kind}</span><span>{new Date(item.createdAt).toLocaleString()}</span></div><p className="mt-1 break-words text-sm">{item.deletedAt ? "Message removed" : item.body}</p></div>{!item.deletedAt ? <button aria-label="Delete message" className="grid size-9 place-items-center rounded-lg text-rose-700 hover:bg-rose-50" onClick={() => { const reason = window.prompt("Reason for removing this message:"); if (reason) void mutate({ action: "delete", classId, messageId: item.id, reason }); }}><Trash2 className="size-4" /></button> : null}</article>) : <p className="p-8 text-center text-slate-500">No class messages yet.</p>}</div></section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="text-xl font-black text-amber-950">Learner reports ({reports.filter((item) => item.status === "open").length} open)</h2>{reports.length ? <div className="mt-3 grid gap-3">{reports.map((item) => <article className="rounded-xl bg-white p-4 text-sm" key={item.id}><b className="capitalize">{item.reason.replaceAll("_", " ")}</b><p>{item.details || "No additional details."}</p><time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</time></article>)}</div> : <p className="mt-2 text-sm">No messages have been reported in this class.</p>}</section>
      </div>
    </div> : null}
  </main>;
}
