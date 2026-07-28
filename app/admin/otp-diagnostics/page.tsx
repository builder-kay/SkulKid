"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  RadioTower,
  RefreshCw,
  Search,
  XCircle
} from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

type DiagnosticEvent = {
  id: string;
  attemptId: string;
  provider: "clifze" | "arkesel" | "bms";
  purpose: string;
  status: "accepted" | "rejected";
  maskedPhone: string;
  latencyMs: number;
  deliveryStatus: string | null;
  error: string | null;
  createdAt: string;
};

type ProviderSummary = {
  provider: string;
  total: number;
  accepted: number;
  rejected: number;
  acceptanceRate: number | null;
  averageLatencyMs: number | null;
};

export default function OtpDiagnosticsPage() {
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [summary, setSummary] = useState<ProviderSummary[]>([]);
  const [provider, setProvider] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ provider, status });
      const response = await fetch(`/api/admin/otp-diagnostics?${params}`, { cache: "no-store" });
      const result = await response.json() as {
        events?: DiagnosticEvent[];
        summary?: ProviderSummary[];
        generatedAt?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error || "Could not load OTP diagnostics.");
      setEvents(result.events ?? []);
      setSummary(result.summary ?? []);
      setGeneratedAt(result.generatedAt ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load OTP diagnostics.");
    } finally {
      setLoading(false);
    }
  }, [provider, status]);

  useEffect(() => { void load(); }, [load]);

  const filteredEvents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return events;
    return events.filter((event) =>
      `${event.provider} ${event.purpose} ${event.maskedPhone} ${event.status} ${event.deliveryStatus || ""} ${event.error || ""}`
        .toLowerCase()
        .includes(needle)
    );
  }, [events, query]);

  const attempts = useMemo(() => {
    const grouped = new Map<string, DiagnosticEvent[]>();
    for (const event of filteredEvents) {
      const group = grouped.get(event.attemptId) ?? [];
      group.push(event);
      grouped.set(event.attemptId, group);
    }
    return [...grouped.entries()];
  }, [filteredEvents]);

  return (
    <main className="mx-auto grid w-full max-w-[96rem] gap-6">
      <header className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-cyan-300">OTP observability</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Provider diagnostics</h1>
            <p className="mt-3 max-w-3xl text-slate-300">Confirm which SMS providers were called, whether they accepted each request, and how long they took. Phone numbers are masked and OTP values are never recorded.</p>
          </div>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-black text-slate-950 disabled:opacity-60" disabled={loading} onClick={() => void load()} type="button">
            <RefreshCw className={`size-5 ${loading ? "animate-spin" : ""}`} />Refresh
          </button>
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-900" role="alert">{error}</div> : null}

      <section className="grid gap-3 md:grid-cols-3">
        {summary.map((item) => (
          <SkulKidCard className="p-5" key={item.provider}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Provider</p>
                <h2 className="mt-1 text-xl font-black capitalize">{item.provider}</h2>
              </div>
              <span className={`grid size-11 place-items-center rounded-2xl ${item.rejected ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                <RadioTower className="size-5" />
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <Metric label="Accepted" value={item.accepted} />
              <Metric label="Rejected" value={item.rejected} />
              <Metric label="Rate" value={item.acceptanceRate === null ? "—" : `${item.acceptanceRate}%`} />
            </div>
            <p className="mt-4 text-xs font-bold text-slate-500">{item.averageLatencyMs === null ? "No requests in this view" : `Average response: ${item.averageLatencyMs}ms`}</p>
          </SkulKidCard>
        ))}
      </section>

      <SkulKidCard className="overflow-hidden">
        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-[1fr_auto_auto] sm:p-5">
          <label className="relative">
            <span className="sr-only">Search diagnostics</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100" onChange={(event) => setQuery(event.target.value)} placeholder="Search provider, purpose or masked phone" value={query} />
          </label>
          <select aria-label="Filter provider" className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold" onChange={(event) => setProvider(event.target.value)} value={provider}>
            <option value="all">All providers</option>
            <option value="clifze">Clifze</option>
            <option value="arkesel">Arkesel</option>
            <option value="bms">BMS</option>
          </select>
          <select aria-label="Filter status" className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="all">All results</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold text-slate-500">
          Showing the latest {events.length} provider events{generatedAt ? ` · Updated ${new Date(generatedAt).toLocaleString()}` : ""}
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? <div className="p-8 text-center font-bold text-slate-500">Loading provider diagnostics…</div> : null}
          {!loading && attempts.length === 0 ? <div className="p-10 text-center text-slate-500">No OTP provider attempts match this view.</div> : null}
          {!loading && attempts.map(([attemptId, items]) => (
            <article className="p-4 sm:p-5" key={attemptId}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Attempt {attemptId.slice(0, 8)}</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">{items[0]?.maskedPhone} · {formatPurpose(items[0]?.purpose || "")}</p>
                </div>
                <time className="text-xs font-bold text-slate-500">{new Date(items[0]?.createdAt || "").toLocaleString()}</time>
              </div>
              <div className="mt-3 grid gap-2 lg:grid-cols-3">
                {items.map((item) => <ProviderEvent event={item} key={item.id} />)}
              </div>
            </article>
          ))}
        </div>
      </SkulKidCard>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-slate-50 px-2 py-3"><strong className="block text-lg text-slate-950">{value}</strong><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span></div>;
}

function ProviderEvent({ event }: { event: DiagnosticEvent }) {
  const accepted = event.status === "accepted";
  return (
    <div className={`rounded-2xl border p-4 ${accepted ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
      <div className="flex items-center gap-2">
        {accepted ? <CheckCircle2 className="size-5 text-emerald-700" /> : <XCircle className="size-5 text-rose-700" />}
        <strong className="capitalize text-slate-950">{event.provider}</strong>
        <span className={`ml-auto rounded-full px-2 py-1 text-[10px] font-black uppercase ${accepted ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"}`}>{event.status}</span>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-600"><Clock3 className="size-3.5" />{event.latencyMs}ms</div>
      {event.deliveryStatus ? <p className="mt-2 text-xs font-bold text-slate-700">Delivery report: {event.deliveryStatus}</p> : null}
      {event.error ? <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-rose-900"><CircleAlert className="mt-0.5 size-3.5 shrink-0" />{event.error}</p> : null}
    </div>
  );
}

function formatPurpose(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

