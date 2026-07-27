"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Eye, Flag, Layers3, ShieldCheck, X } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

type ModerationItem = {
  id: string;
  courseId: string;
  version: number;
  title: string;
  description: string;
  gradeLevels: number[];
  teacherName: string;
  moduleCount: number;
  lessonCount: number;
  submittedAt: string;
  snapshot: {
    course: { name: string; description: string; gradeLevels?: number[] };
    units: Array<{ id: string; title: string; description: string }>;
    lessons: Array<{ id: string; title: string; description: string; unitId?: string | null; grade: number; estimatedMinutes: number }>;
  };
};

export default function AdminModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [preview, setPreview] = useState<ModerationItem | null>(null);
  const [returning, setReturning] = useState<ModerationItem | null>(null);
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/moderation", { cache: "no-store" });
      const result = await response.json() as { items?: ModerationItem[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load the Public Learning review queue.");
      setItems(result.items ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the Public Learning review queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function review(item: ModerationItem, action: "approve" | "changes_requested") {
    if (action === "changes_requested" && note.trim().length < 4) {
      setError("Add a clear note so the teacher knows what to change.");
      return;
    }
    setBusyId(item.id);
    setError("");
    try {
      const response = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId: item.id, action, note: action === "changes_requested" ? note : undefined })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not complete the review.");
      setPreview(null);
      setReturning(null);
      setNote("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not complete the review.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-[90rem] gap-6">
      <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">Public Learning moderation</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Review submitted courses</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Only versions teachers explicitly submit appear here. Learners keep the last approved version until you approve a replacement.</p>
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950" role="alert">{error}</div> : null}

      <div className="grid gap-4">
        {loading ? <SkulKidCard className="p-6 text-slate-500">Loading Public Learning reviews…</SkulKidCard> : null}
        {!loading && items.length === 0 ? (
          <SkulKidCard className="grid min-h-52 place-items-center p-8 text-center">
            <div><ShieldCheck className="mx-auto size-11 text-emerald-500" /><h2 className="mt-3 text-xl font-black">Review queue is clear</h2><p className="mt-1 text-slate-600">No course versions are waiting for approval.</p></div>
          </SkulKidCard>
        ) : null}
        {items.map((item) => (
          <SkulKidCard className="p-5 sm:p-6" key={item.id}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-950"><Flag className="mr-1 inline size-3.5" />Awaiting review</span>
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-900">Version {item.version}</span>
                  <span className="text-xs font-bold text-slate-500">{item.teacherName}</span>
                </div>
                <h2 className="mt-2 truncate text-xl font-black">{item.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.description}</p>
                <p className="mt-2 text-xs font-bold text-slate-500">{item.moduleCount} modules · {item.lessonCount} lessons · Basic {item.gradeLevels.join(", Basic ")} · submitted {new Date(item.submittedAt).toLocaleString()}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black" onClick={() => setPreview(item)} type="button"><Eye className="size-4" />Preview version</button>
                <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white disabled:opacity-50" disabled={busyId === item.id} onClick={() => void review(item, "approve")} type="button"><CheckCircle2 className="size-4" />Approve</button>
                <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white" onClick={() => { setReturning(item); setNote(""); }} type="button">Return with note</button>
              </div>
            </div>
          </SkulKidCard>
        ))}
      </div>

      {preview ? <PreviewDialog item={preview} onClose={() => setPreview(null)} /> : null}
      {returning ? (
        <div className="fixed inset-0 z-[100] grid place-items-end bg-slate-950/60 p-3 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="return-title">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-black" id="return-title">Help the teacher improve it</h2>
            <p className="mt-2 text-sm text-slate-600">Explain exactly what needs attention in “{returning.title}”. The approved public version will remain live.</p>
            <label className="mt-5 grid gap-2 text-sm font-black">Review note<textarea className="min-h-32 rounded-xl border border-slate-300 p-3 font-normal" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <div className="mt-5 flex justify-end gap-2"><button className="min-h-11 rounded-xl px-4 font-bold" onClick={() => setReturning(null)} type="button">Cancel</button><button className="min-h-11 rounded-xl bg-amber-500 px-4 font-black text-slate-950 disabled:opacity-50" disabled={busyId === returning.id || note.trim().length < 4} onClick={() => void review(returning, "changes_requested")} type="button">Return to teacher</button></div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function PreviewDialog({ item, onClose }: { item: ModerationItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-end bg-slate-950/60 p-3 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="preview-title">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b bg-white p-5 sm:p-6">
          <div><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Learner-facing version {item.version}</p><h2 className="mt-1 text-2xl font-black" id="preview-title">{item.title}</h2></div>
          <button aria-label="Close preview" className="grid size-10 place-items-center rounded-xl bg-slate-100" onClick={onClose} type="button"><X className="size-5" /></button>
        </header>
        <div className="grid gap-5 p-5 sm:p-6">
          <p className="leading-7 text-slate-600">{item.description}</p>
          {item.snapshot.units.map((unit, index) => {
            const lessons = item.snapshot.lessons.filter((lesson) => lesson.unitId === unit.id);
            return <section className="rounded-2xl border border-slate-200 p-4" key={unit.id}><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-800"><Layers3 className="size-5" /></span><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Module {index + 1}</p><h3 className="text-lg font-black">{unit.title}</h3><p className="text-sm text-slate-600">{unit.description}</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{lessons.map((lesson) => <article className="rounded-xl bg-slate-50 p-4" key={lesson.id}><b>{lesson.title}</b><p className="mt-1 line-clamp-2 text-sm text-slate-600">{lesson.description}</p><p className="mt-2 text-xs font-bold text-violet-700">Basic {lesson.grade} · {lesson.estimatedMinutes} min</p></article>)}</div></section>;
          })}
        </div>
      </div>
    </div>
  );
}
