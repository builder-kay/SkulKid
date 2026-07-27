"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";

type Data = {
  trust: { status: string; cleanLessonCount: number; requiredCleanLessons: number; monitoringRemaining: number };
  cases: Array<{ id: string; contentType: string; contentId: string; status: string; reasons: string[]; reviewNote: string | null; createdAt: string }>;
  appeals: Array<{ id: string; caseId: string | null; kind: string; message: string; status: string; resolutionNote: string | null; createdAt: string }>;
};

export default function TeacherTrustPage() {
  const [data, setData] = useState<Data | null>(null);
  const [appealing, setAppealing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  async function load() {
    const response = await fetch("/api/teacher/trust", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load content trust.");
    setData(result);
  }
  useEffect(() => { void load().catch((cause) => setError(cause.message)); }, []);
  async function submitAppeal() {
    if (!appealing) return;
    const response = await fetch("/api/teacher/trust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: appealing, message })
    });
    const result = await response.json();
    if (!response.ok) return setError(result.error || "Could not submit the appeal.");
    setNotice(result.message);
    setAppealing(null);
    setMessage("");
    await load();
  }
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6">
      <header className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-violet-950 to-blue-900 p-6 text-white shadow-xl sm:p-8">
        <ShieldCheck className="size-7 text-emerald-300" />
        <h1 className="mt-3 text-3xl font-black sm:text-5xl">Content trust</h1>
        <p className="mt-3 max-w-3xl leading-7 text-violet-100">See how learner-facing lessons and quizzes are checked. Content trust describes publishing history, not professional credentials.</p>
      </header>
      {error ? <p className="rounded-2xl bg-rose-50 p-4 font-bold text-rose-900" role="alert">{error}</p> : null}
      {notice ? <p className="rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-900" role="status">{notice}</p> : null}
      {!data ? <div className="grid min-h-52 place-items-center"><Loader2 className="size-7 animate-spin text-violet-700" /></div> : (
        <>
          <section className="rounded-[1.75rem] border border-violet-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-black uppercase tracking-wider text-violet-700">Your status</p>
            <h2 className="mt-1 text-2xl font-black capitalize">{data.trust.status.replaceAll("_", " ")}</h2>
            <p className="mt-2 text-slate-600">{data.trust.cleanLessonCount} of {data.trust.requiredCleanLessons} distinct clean lessons recorded.</p>
          </section>
          <section>
            <h2 className="text-2xl font-black">Safety-check history</h2>
            <div className="mt-4 grid gap-3">
              {data.cases.length ? data.cases.map((item) => {
                const rejected = item.status === "rejected";
                const hasPendingAppeal = data.appeals.some((appeal) => appeal.caseId === item.id && appeal.status === "pending");
                return (
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={item.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusIcon status={item.status} />
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black capitalize">{item.contentType.replaceAll("_", " ")}</span>
                      <span className="text-xs font-bold text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <h3 className="mt-3 font-black capitalize">{item.status.replaceAll("_", " ")}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.reviewNote || item.reasons?.join(" ") || "No additional note."}</p>
                    {rejected && !hasPendingAppeal ? <button className="mt-3 min-h-10 rounded-xl border border-violet-300 px-4 text-sm font-black text-violet-800" onClick={() => setAppealing(item.id)} type="button">Appeal this decision</button> : null}
                    {hasPendingAppeal ? <p className="mt-3 text-sm font-bold text-amber-800">Your appeal is waiting for administrator review.</p> : null}
                  </article>
                );
              }) : <p className="rounded-2xl border border-dashed p-6 text-slate-600">No safety checks have been recorded yet.</p>}
            </div>
          </section>
        </>
      )}
      {appealing ? (
        <div className="fixed inset-0 z-[100] grid place-items-end bg-slate-950/60 p-3 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="appeal-title">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-black" id="appeal-title">Explain the misunderstanding</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">An administrator will compare your explanation with the exact version that was reviewed.</p>
            <textarea className="mt-4 min-h-36 w-full rounded-xl border border-slate-300 p-3" maxLength={2000} onChange={(event) => setMessage(event.target.value)} placeholder="Write at least 20 characters…" value={message} />
            <div className="mt-4 flex justify-end gap-2"><button className="min-h-11 rounded-xl px-4 font-bold" onClick={() => setAppealing(null)}>Cancel</button><button className="min-h-11 rounded-xl bg-violet-700 px-4 font-black text-white disabled:opacity-50" disabled={message.trim().length < 20} onClick={() => void submitAppeal()}>Send appeal</button></div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "approved" || status === "overridden") return <CheckCircle2 className="size-5 text-emerald-600" />;
  if (status === "held" || status === "error") return <Clock3 className="size-5 text-amber-600" />;
  return <TriangleAlert className="size-5 text-rose-600" />;
}
