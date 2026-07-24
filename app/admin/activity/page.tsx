"use client";

import { useEffect, useState } from "react";
import { Activity, BookOpen, Users } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

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

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/admin/activity");
        const result = await response.json() as { events?: ActivityEvent[]; error?: string };
        if (!response.ok) throw new Error(result.error || "Could not load activity.");
        if (active) setEvents(result.events ?? []);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load activity.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <main className="mx-auto grid w-full max-w-[90rem] gap-6">
      <header className="rounded-[2rem] border border-white bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Platform activity</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">What is happening on SkulKid</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Recent publishing, account and subject signals across the platform.</p>
      </header>

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">{error}</div> : null}

      <SkulKidCard className="divide-y divide-slate-100 overflow-hidden">
        {loading ? <div className="p-6 text-slate-500">Loading activity…</div> : null}
        {!loading && events.length === 0 ? <div className="p-6 text-slate-500">No recent activity yet.</div> : null}
        {events.map((event) => (
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
      </SkulKidCard>
    </main>
  );
}
