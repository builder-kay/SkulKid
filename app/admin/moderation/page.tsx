"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Eye, Flag, Loader2, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type PublicItem = {
  id: string; courseId: string; version: number; title: string; description: string;
  gradeLevels: number[]; teacherName: string; moduleCount: number; lessonCount: number;
  submittedAt: string; snapshot: Record<string, unknown>;
};
type ContentItem = {
  id: string; teacherId: string; teacherName: string; contentType: string; contentId: string;
  snapshot: Record<string, unknown>; status: string; academicRelevance: string; severity: string;
  confidence: number; categories: string[]; reasons: string[]; mediaWarnings: string[];
  model: string | null; createdAt: string; publishedAt: string | null;
  trust: { status: string; cleanLessonCount: number; requiredCleanLessons: number } | null;
};
type Appeal = {
  id: string; teacherId: string; teacherName: string; caseId: string | null; kind: string;
  message: string; createdAt: string; moderationCase: ContentItem | null;
  trust: { status: string } | null;
};
type Result = { publicItems: PublicItem[]; contentItems: ContentItem[]; appeals: Appeal[] };
type Tab = "content" | "appeals" | "public";

export default function AdminModerationPage() {
  const [result, setResult] = useState<Result>({ publicItems: [], contentItems: [], appeals: [] });
  const [tab, setTab] = useState<Tab>("content");
  const [preview, setPreview] = useState<{ title: string; snapshot: Record<string, unknown> } | null>(null);
  const [action, setAction] = useState<{ kind: string; id: string; title: string } | null>(null);
  const [note, setNote] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/moderation", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load moderation.");
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load moderation.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  const tabs = useMemo(() => [
    { id: "content" as const, label: "AI-held content", count: result.contentItems.length },
    { id: "appeals" as const, label: "Appeals", count: result.appeals.length },
    { id: "public" as const, label: "Public Learning", count: result.publicItems.length }
  ], [result]);

  async function submit() {
    if (!action) return;
    setBusy(true); setError("");
    const body = action.kind.startsWith("public_")
      ? {
          revisionId: action.id,
          action: action.kind === "public_approve" ? "approve" : "changes_requested",
          note: action.kind === "public_return" ? note : undefined
        }
      : action.kind.endsWith("_appeal")
        ? { appealId: action.id, action: action.kind, note }
        : { caseId: action.id, action: action.kind, note, confirmation };
    try {
      const response = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The review could not be completed.");
      setAction(null); setNote(""); setConfirmation("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The review could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-[96rem] gap-6">
      <AdminPageHeader description="Review exact frozen versions, correct AI mistakes, resolve appeals and protect learners with audited decisions." eyebrow="Safety and publishing" icon={ShieldCheck} title="Moderation centre" tone="dark" />
      <nav className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-2 sm:grid-cols-3" aria-label="Moderation queues">
        {tabs.map((item) => <button className={`min-h-12 rounded-xl px-4 text-sm font-black ${tab === item.id ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-100"}`} key={item.id} onClick={() => setTab(item.id)}>{item.label} <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5">{item.count}</span></button>)}
      </nav>
      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900" role="alert">{error}</p> : null}
      {loading ? <div className="grid min-h-56 place-items-center"><Loader2 className="size-7 animate-spin text-emerald-700" /></div> : null}
      {!loading && tab === "content" ? (
        <Queue empty="No AI-held lessons or quizzes need review.">
          {result.contentItems.map((item) => (
            <SkulKidCard className="p-5 sm:p-6" key={item.id}>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2"><Badge tone={item.status === "error" ? "amber" : "rose"}>{item.contentType === "lesson" && item.publishedAt ? item.status === "error" ? "Live · scan failed" : "Live · flagged" : item.status === "error" ? "Scan unavailable" : "Held for review"}</Badge><Badge>{item.contentType.replaceAll("_", " ")}</Badge><Badge>{item.teacherName}</Badge></div>
                  <h2 className="mt-3 text-xl font-black">{contentTitle(item.snapshot)}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.reasons?.join(" ")}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">Academic: {item.academicRelevance || "unclear"} · Severity: {item.severity || "unknown"} · Confidence: {Math.round(Number(item.confidence || 0) * 100)}% · Trust: {item.trust?.status?.replaceAll("_", " ") ?? "unknown"}</p>
                  {item.categories?.length ? <p className="mt-2 text-xs font-black text-rose-700">Flags: {item.categories.join(", ").replaceAll("_", " ")}</p> : null}
                  {item.mediaWarnings?.length ? <p className="mt-2 text-xs font-bold text-amber-800">{item.mediaWarnings.join(" ")}</p> : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button className={actionButton("secondary")} onClick={() => setPreview({ title: contentTitle(item.snapshot), snapshot: item.snapshot })}><Eye className="size-4" />Preview</button>
                  <button className={actionButton("approve")} onClick={() => setAction({ kind: "approve_content", id: item.id, title: item.contentType === "lesson" && item.publishedAt ? "Keep content live" : "Approve and publish" })}><CheckCircle2 className="size-4" />{item.contentType === "lesson" && item.publishedAt ? "Keep live" : "Approve"}</button>
                  <button className={actionButton("reject")} onClick={() => setAction({ kind: "reject_content", id: item.id, title: item.contentType === "lesson" && item.publishedAt ? "Block content and notify teacher" : "Reject content" })}>{item.contentType === "lesson" && item.publishedAt ? "Block" : "Reject"}</button>
                  <button className={actionButton("danger")} onClick={() => setAction({ kind: "ban_teacher", id: item.id, title: "Ban teacher and phone" })}><ShieldAlert className="size-4" />Ban</button>
                </div>
              </div>
            </SkulKidCard>
          ))}
        </Queue>
      ) : null}
      {!loading && tab === "appeals" ? (
        <Queue empty="No teacher appeals are waiting.">
          {result.appeals.map((item) => (
            <SkulKidCard className="p-5 sm:p-6" key={item.id}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div><div className="flex gap-2"><Badge tone="amber">Appeal</Badge><Badge>{item.kind.replaceAll("_", " ")}</Badge></div><h2 className="mt-3 text-xl font-black">{item.teacherName}</h2><p className="mt-2 max-w-3xl leading-7 text-slate-700">{item.message}</p><p className="mt-2 text-xs font-bold text-slate-500">{new Date(item.createdAt).toLocaleString()}</p></div>
                <div className="flex gap-2"><button className={actionButton("reject")} onClick={() => setAction({ kind: "uphold_appeal", id: item.id, title: "Uphold original decision" })}>Uphold</button><button className={actionButton("approve")} onClick={() => setAction({ kind: "overturn_appeal", id: item.id, title: "Overturn decision" })}>Overturn</button></div>
              </div>
            </SkulKidCard>
          ))}
        </Queue>
      ) : null}
      {!loading && tab === "public" ? (
        <Queue empty="No Public Learning versions are waiting.">
          {result.publicItems.map((item) => (
            <SkulKidCard className="p-5 sm:p-6" key={item.id}><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex gap-2"><Badge tone="amber">Awaiting review</Badge><Badge>Version {item.version}</Badge></div><h2 className="mt-3 text-xl font-black">{item.title}</h2><p className="mt-1 text-sm text-slate-600">{item.description}</p><p className="mt-2 text-xs font-bold text-slate-500">{item.teacherName} · {item.moduleCount} modules · {item.lessonCount} lessons</p></div><div className="flex gap-2"><button className={actionButton("secondary")} onClick={() => setPreview({ title: item.title, snapshot: item.snapshot })}><Eye className="size-4" />Preview</button><button className={actionButton("approve")} onClick={() => setAction({ kind: "public_approve", id: item.id, title: "Approve Public Learning version" })}>Approve</button><button className={actionButton("reject")} onClick={() => setAction({ kind: "public_return", id: item.id, title: "Return with note" })}>Return</button></div></div></SkulKidCard>
          ))}
        </Queue>
      ) : null}

      {preview ? <Preview title={preview.title} snapshot={preview.snapshot} onClose={() => setPreview(null)} /> : null}
      {action ? (
        <div className="fixed inset-0 z-[110] grid place-items-end bg-slate-950/65 p-3 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="review-action-title">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-black" id="review-action-title">{action.title}</h2>
            <p className="mt-2 text-sm text-slate-600">Add a clear reason. It will be stored in the audit trail and shown to the teacher when appropriate.</p>
            <textarea className="mt-4 min-h-32 w-full rounded-xl border border-slate-300 p-3" maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="Decision note…" value={note} />
            {action.kind === "ban_teacher" ? <label className="mt-3 grid gap-2 text-sm font-black">Type BAN to confirm<input className="min-h-11 rounded-xl border border-rose-300 px-3" onChange={(event) => setConfirmation(event.target.value)} value={confirmation} /></label> : null}
            <div className="mt-5 flex justify-end gap-2"><button className="min-h-11 rounded-xl px-4 font-bold" onClick={() => setAction(null)}>Cancel</button><button className={`min-h-11 rounded-xl px-4 font-black text-white ${action.kind === "ban_teacher" ? "bg-rose-700" : "bg-emerald-700"} disabled:opacity-50`} disabled={busy || note.trim().length < 4 || (action.kind === "ban_teacher" && confirmation !== "BAN")} onClick={() => void submit()}>{busy ? "Saving…" : "Confirm decision"}</button></div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Queue({ children, empty }: { children: React.ReactNode; empty: string }) {
  const count = Array.isArray(children) ? children.length : children ? 1 : 0;
  return <section className="grid gap-4">{count ? children : <SkulKidCard className="grid min-h-52 place-items-center p-8 text-center"><div><ShieldCheck className="mx-auto size-11 text-emerald-500" /><h2 className="mt-3 text-xl font-black">{empty}</h2></div></SkulKidCard>}</section>;
}
function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "amber" | "rose" }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-black capitalize ${tone === "amber" ? "bg-amber-100 text-amber-900" : tone === "rose" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"}`}>{children}</span>;
}
function actionButton(tone: "secondary" | "approve" | "reject" | "danger") {
  const colour = tone === "approve"
    ? "bg-emerald-600 text-white hover:bg-emerald-700"
    : tone === "danger"
      ? "bg-rose-700 text-white hover:bg-rose-800"
      : tone === "reject"
        ? "bg-amber-100 text-amber-950 hover:bg-amber-200"
        : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50";
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black ${colour}`;
}
function contentTitle(snapshot: Record<string, unknown>) {
  return typeof snapshot.title === "string" && snapshot.title.trim() ? snapshot.title : "Untitled content";
}
function Preview({ title, snapshot, onClose }: { title: string; snapshot: Record<string, unknown>; onClose: () => void }) {
  return <div className="fixed inset-0 z-[120] grid place-items-end bg-slate-950/65 p-3 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="moderation-preview-title"><div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"><header className="sticky top-0 flex items-center justify-between border-b bg-white p-5"><div><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Exact frozen version</p><h2 className="text-2xl font-black" id="moderation-preview-title">{title}</h2></div><button aria-label="Close preview" className="grid size-10 place-items-center rounded-xl bg-slate-100" onClick={onClose}><X className="size-5" /></button></header><div className="grid gap-4 p-5 sm:p-6"><SnapshotView value={snapshot} /></div></div></div>;
}
function SnapshotView({ value }: { value: Record<string, unknown> }) {
  const rows = Object.entries(value).filter(([key]) => !["fixture", "builderState"].includes(key));
  return <>{rows.map(([key, item]) => <section className="rounded-2xl border border-slate-200 p-4" key={key}><p className="text-xs font-black uppercase tracking-wider text-slate-500">{key.replaceAll(/([A-Z])/g, " $1")}</p><div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{typeof item === "string" || typeof item === "number" || typeof item === "boolean" ? String(item) : <pre className="overflow-x-auto whitespace-pre-wrap text-xs">{JSON.stringify(item, null, 2)}</pre>}</div></section>)}</>;
}
