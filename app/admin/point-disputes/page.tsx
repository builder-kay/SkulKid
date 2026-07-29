"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, Scale } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type Dispute = {
  id: string;
  status: string;
  message: string;
  createdAt: string;
  resolutionNote: string | null;
  amount: number;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  className: string;
  studentName: string;
  teacherName: string;
};

export default function PointDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/admin/point-disputes", { cache: "no-store" });
    const payload = await response.json() as { disputes?: Dispute[]; error?: string };
    if (!response.ok) throw new Error(payload.error || "Unable to load point disputes.");
    setDisputes(payload.disputes ?? []);
  }

  useEffect(() => { void load().catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load point disputes.")); }, []);

  async function resolve(disputeId: string, resolution: "upheld" | "reversed") {
    setBusyId(disputeId);
    setError("");
    try {
      const response = await fetch("/api/admin/point-disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId, resolution, note: notes[disputeId] ?? "" })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to resolve dispute.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to resolve dispute.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-[90rem] gap-6">
      <AdminPageHeader description="Every report and its original deduction are preserved here. Reversing a deduction safely restores the points." eyebrow="Student safety" icon={Scale} title="Point deduction disputes" tone="dark" />
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900">{error}</p> : null}
      {disputes.length === 0 ? <SkulKidCard className="p-8 text-center"><Scale className="mx-auto size-10 text-emerald-600" /><h2 className="mt-3 text-xl font-black">No deduction reports</h2></SkulKidCard> : null}
      {disputes.map((item) => (
        <SkulKidCard className="p-5 sm:p-6" key={item.id}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${item.status === "open" ? "bg-amber-100 text-amber-900" : item.status === "reversed" ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-700"}`}>{item.status}</span><h2 className="mt-3 text-xl font-black">{item.studentName} · {item.className}</h2><p className="mt-1 text-sm text-slate-500">Teacher {item.teacherName} · {new Date(item.createdAt).toLocaleString()}</p></div><p className="rounded-xl bg-rose-50 px-4 py-2 text-lg font-black text-rose-800">-{item.amount} points</p></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Teacher reason</p><p className="mt-2 text-sm leading-6">{item.reason}</p><p className="mt-2 text-xs font-bold text-slate-500">Balance {item.balanceBefore} → {item.balanceAfter}</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-black uppercase text-amber-800">Student report</p><p className="mt-2 text-sm leading-6">{item.message}</p></div></div>
          {item.status === "open" ? <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"><input className="min-h-11 rounded-xl border border-slate-300 px-3" minLength={4} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Required review note for teacher and student" value={notes[item.id] ?? ""} /><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 font-black text-white disabled:opacity-50" disabled={busyId === item.id || (notes[item.id]?.trim().length ?? 0) < 4} onClick={() => void resolve(item.id, "upheld")} type="button"><CheckCircle2 className="size-4" /> Uphold</button><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-black text-white disabled:opacity-50" disabled={busyId === item.id || (notes[item.id]?.trim().length ?? 0) < 4} onClick={() => void resolve(item.id, "reversed")} type="button"><RotateCcw className="size-4" /> Restore points</button></div> : item.resolutionNote ? <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm"><b>Admin resolution:</b> {item.resolutionNote}</p> : null}
        </SkulKidCard>
      ))}
    </main>
  );
}
