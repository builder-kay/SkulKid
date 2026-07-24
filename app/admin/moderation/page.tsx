"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Eye, Flag, ShieldAlert } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

type ModerationItem = {
  id: string;
  title: string;
  subject: string;
  status: string;
  grade: number | null;
  updatedAt: string;
};

export default function AdminModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/moderation");
      const result = await response.json() as { items?: ModerationItem[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load moderation queue.");
      setItems(result.items ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load moderation queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function setStatus(id: string, status: "published" | "draft" | "archived") {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not update content.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update content.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-[90rem] gap-6">
      <header className="rounded-[2rem] border border-white bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Content moderation</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Review teacher content</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Approve drafts for learners, send content back for edits, or archive material that should not stay live.</p>
      </header>

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">{error}</div> : null}

      <div className="grid gap-4">
        {loading ? <SkulKidCard className="p-6 text-slate-500">Loading moderation queue…</SkulKidCard> : null}
        {!loading && items.length === 0 ? (
          <SkulKidCard className="grid min-h-48 place-items-center p-8 text-center">
            <ShieldAlert className="size-10 text-emerald-500" />
            <h2 className="mt-3 text-xl font-black">Queue is clear</h2>
            <p className="mt-1 text-slate-600">No drafts currently waiting for admin review.</p>
          </SkulKidCard>
        ) : null}
        {items.map((item) => (
          <SkulKidCard className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" key={item.id}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-950"><Flag className="mr-1 inline size-3.5" />{item.status}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.subject}{item.grade ? ` · Basic ${item.grade}` : ""}</span>
              </div>
              <h2 className="mt-2 truncate text-xl font-black">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-500">Updated {new Date(item.updatedAt).toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold" href={`/preview/lessons/${item.id}`}>
                <Eye className="size-4" /> Preview
              </Link>
              <button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white disabled:opacity-50" disabled={busyId === item.id} onClick={() => void setStatus(item.id, "published")} type="button">
                <CheckCircle2 className="size-4" /> Approve
              </button>
              <button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white disabled:opacity-50" disabled={busyId === item.id} onClick={() => void setStatus(item.id, "draft")} type="button">
                Keep as draft
              </button>
            </div>
          </SkulKidCard>
        ))}
      </div>
    </main>
  );
}
