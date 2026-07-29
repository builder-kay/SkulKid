"use client";

import { useEffect, useState } from "react";
import { Activity, BookOpen, RefreshCw, Search, Users } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type ActivityEvent = {
  id: string;
  type: string;
  title: string;
  detail: string;
  at: string;
};

export default function AdminActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/activity");
      const result = await response.json() as { events?: ActivityEvent[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load activity.");
      setEvents(result.events ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load activity.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = events.filter((event) => {
    const matchesType = typeFilter === "all" || event.type === typeFilter;
    const needle = query.trim().toLowerCase();
    return matchesType && (!needle || `${event.title} ${event.detail}`.toLowerCase().includes(needle));
  });

  return (
    <main className="mx-auto grid w-full max-w-[90rem] gap-6">
      <AdminPageHeader description="Review recent publishing, account and subject activity across the platform." eyebrow="Platform activity" icon={Activity} title="What is happening on SkulKid" />

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">{error}</div> : null}

      <SkulKidCard className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:p-5">
          <label className="relative flex-1">
            <span className="sr-only">Search activity</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setQuery(event.target.value)} placeholder="Search recent activity" value={query} />
          </label>
          <select aria-label="Filter activity type" className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold" onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}>
            <option value="all">All activity</option>
            <option value="user">Accounts</option>
            <option value="lesson">Lessons</option>
            <option value="course">Subjects</option>
          </select>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold disabled:opacity-50" disabled={loading} onClick={() => void load()} type="button">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? <div className="p-6 text-slate-500">Loading activity…</div> : null}
          {!loading && filtered.length === 0 ? <div className="p-8 text-center text-slate-500">{events.length ? "No activity matches your filters." : "No recent activity yet."}</div> : null}
          {filtered.map((event) => (
            <article className="flex items-start gap-3 p-4 sm:p-5" key={event.id}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
                {event.type === "user" ? <Users className="size-5" /> : event.type === "course" ? <BookOpen className="size-5" /> : <Activity className="size-5" />}
              </span>
              <div className="min-w-0">
                <h2 className="font-black text-slate-950">{event.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{event.detail}</p>
                <p className="mt-2 text-xs font-bold text-slate-400">{new Date(event.at).toLocaleString()}</p>
              </div>
            </article>
          ))}
        </div>
      </SkulKidCard>
    </main>
  );
}
