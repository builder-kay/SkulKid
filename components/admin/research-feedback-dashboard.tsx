"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Copy,
  Download,
  Loader2,
  Printer,
  Search
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AccessibleBars, AccessibleLineChart } from "@/components/admin/admin-charts";
import { AdminTableScroll, adminTable, adminTableBody, adminTableCell, adminTableHead, adminTableHeadCell, adminTableRow } from "@/components/admin/admin-table";
import { cn } from "@/lib/utils";

type Analytics = {
  totals: {
    all: number;
    filtered: number;
    last7Days: number;
    byForm: { student: number; teacher: number; system: number };
  };
  trend: Array<{ date: string; student: number; teacher: number; system: number }>;
  demographics: {
    student: {
      class: Array<{ label: string; value: number }>;
      gender: Array<{ label: string; value: number }>;
      deviceUse: Array<{ label: string; value: number }>;
      priorPlatform: Array<{ label: string; value: number }>;
    };
    teacher: {
      level: Array<{ label: string; value: number }>;
      experience: Array<{ label: string; value: number }>;
      techComfort: Array<{ label: string; value: number }>;
    };
  };
  studentLikert: LikertBundle;
  teacherLikert: LikertBundle;
  openEnded: Array<{
    id: string;
    responseId: string;
    formType: "student" | "teacher";
    questionId: string;
    number: number | string;
    prompt: string;
    text: string;
    createdAt: string;
  }>;
  system: {
    features: Array<{ id: string; number: number | string; prompt: string; works: number; issue: number; worksRate: number | null }>;
    metricPass: { met: number; total: number; rate: number | null };
    responseCount: number;
  };
  crossBreaks: null | {
    studentOverallByClass: Array<{ label: string; n: number; mean: number | null }>;
  };
};

type LikertBundle = {
  items: Array<{
    id: string;
    number: number | string;
    prompt: string;
    sectionId: string;
    n: number;
    mean: number | null;
    sd: number | null;
    distribution: Array<{ score: number; label: string; count: number }>;
  }>;
  sections: Array<{ id: string; title: string; n: number; mean: number | null; sd: number | null }>;
  top: Array<{ id: string; number: number | string; prompt: string; mean: number | null; n: number }>;
  bottom: Array<{ id: string; number: number | string; prompt: string; mean: number | null; n: number }>;
};

function fmt(n: number | null | undefined, digits = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

export function ResearchFeedbackDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [formType, setFormType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const [activeLikert, setActiveLikert] = useState<"student" | "teacher">("student");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (formType !== "all") params.set("formType", formType);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const response = await fetch(`/api/admin/research-feedback?${params}`, { cache: "no-store" });
      const payload = await response.json() as { analytics?: Analytics; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load analytics.");
      setAnalytics(payload.analytics ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [formType, from, to]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareLinks = useMemo(() => ({
    hub: `${origin}/feedback`,
    student: `${origin}/feedback/student`,
    teacher: `${origin}/feedback/teacher`,
    system: `${origin}/feedback/system`
  }), [origin]);

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1500);
  }

  const exportQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (formType !== "all") params.set("formType", formType);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [formType, from, to]);

  const openEnded = useMemo(() => {
    const items = analytics?.openEnded ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      item.text.toLowerCase().includes(q)
      || item.prompt.toLowerCase().includes(q)
      || String(item.number).includes(q)
    );
  }, [analytics?.openEnded, query]);

  const likert = activeLikert === "student" ? analytics?.studentLikert : analytics?.teacherLikert;

  return (
    <div className="grid gap-5 print:gap-3">
      <AdminPageHeader
        className="print:shadow-none"
        description="Statistician view of Forms A–C. Confidential research responses — use aggregates and exports for reporting."
        eyebrow="Monitor"
        icon={BarChart3}
        title="Research feedback"
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <a
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white"
              href={`/api/admin/research-feedback/export?format=xlsx&${exportQuery}`}
            >
              <Download className="size-4" /> Excel
            </a>
            <a
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800"
              href={`/api/admin/research-feedback/export?format=csv&${exportQuery}`}
            >
              CSV
            </a>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800"
              onClick={() => window.print()}
              type="button"
            >
              <Printer className="size-4" /> Save PDF
            </button>
          </div>
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 print:hidden sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-xs font-black text-slate-600">
            Form
            <select className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold" value={formType} onChange={(e) => setFormType(e.target.value)}>
              <option value="all">All forms</option>
              <option value="student">Student (A)</option>
              <option value="teacher">Teacher (B)</option>
              <option value="system">System (C)</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-black text-slate-600">
            From
            <input className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="grid gap-1 text-xs font-black text-slate-600">
            To
            <input className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["Hub", shareLinks.hub],
            ["Student", shareLinks.student],
            ["Teacher", shareLinks.teacher],
            ["System", shareLinks.system]
          ] as const).map(([label, href]) => (
            <button
              className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-xs font-bold text-slate-700 hover:bg-emerald-50"
              key={label}
              onClick={() => void copy(label, href)}
              type="button"
            >
              <span className="truncate"><b className="text-emerald-800">{label}</b> · {href.replace(origin, "")}</span>
              <Copy className="size-3.5 shrink-0" />
            </button>
          ))}
        </div>
        {copied ? <p className="mt-2 text-xs font-bold text-emerald-700">Copied {copied} link</p> : null}
      </section>

      {error ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">{error}</p> : null}
      {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="size-8 animate-spin text-emerald-700" /></div> : null}

      {analytics && !loading ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi label="All responses" value={analytics.totals.all} />
            <Kpi label="In filter" value={analytics.totals.filtered} />
            <Kpi label="Last 7 days" value={analytics.totals.last7Days} />
            <Kpi label="Students (A)" value={analytics.totals.byForm.student} />
            <Kpi label="Teachers (B)" value={analytics.totals.byForm.teacher} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel title="Response trend" subtitle="Daily submissions in the current filter.">
              {analytics.trend.length ? (
                <AccessibleLineChart
                  title="Feedback responses over time"
                  data={analytics.trend}
                  series={[
                    { key: "student", label: "Student", color: "#2563eb" },
                    { key: "teacher", label: "Teacher", color: "#7c3aed" },
                    { key: "system", label: "System", color: "#0f766e" }
                  ]}
                />
              ) : <Empty text="No responses in this date range yet." />}
            </Panel>
            <Panel title="Form mix" subtitle="Share of instruments collected.">
              <AccessibleBars
                title="Responses by form"
                data={[
                  { label: "Student", value: analytics.totals.byForm.student },
                  { label: "Teacher", value: analytics.totals.byForm.teacher },
                  { label: "System", value: analytics.totals.byForm.system }
                ]}
              />
            </Panel>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel title="Student demographics" subtitle="Background items from Form A.">
              <div className="grid gap-5 sm:grid-cols-2">
                <MiniBars title="Class" data={analytics.demographics.student.class} />
                <MiniBars title="Gender" data={analytics.demographics.student.gender} />
                <MiniBars title="Device use" data={analytics.demographics.student.deviceUse} />
                <MiniBars title="Prior platforms" data={analytics.demographics.student.priorPlatform} />
              </div>
            </Panel>
            <Panel title="Teacher demographics" subtitle="Background items from Form B.">
              <div className="grid gap-5 sm:grid-cols-2">
                <MiniBars title="Teaching level" data={analytics.demographics.teacher.level} />
                <MiniBars title="Experience" data={analytics.demographics.teacher.experience} />
                <MiniBars title="Tech comfort" data={analytics.demographics.teacher.techComfort} />
              </div>
            </Panel>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Likert analysis</h2>
                <p className="text-sm text-slate-600">Item means (1–5), section composites, and strongest / weakest statements.</p>
              </div>
              <div className="flex gap-2 print:hidden">
                {(["student", "teacher"] as const).map((key) => (
                  <button
                    className={cn(
                      "min-h-10 rounded-xl px-4 text-sm font-black",
                      activeLikert === key ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"
                    )}
                    key={key}
                    onClick={() => setActiveLikert(key)}
                    type="button"
                  >
                    {key === "student" ? "Form A" : "Form B"}
                  </button>
                ))}
              </div>
            </div>

            {likert ? (
              <div className="mt-5 grid gap-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {likert.sections.map((section) => (
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200" key={section.id}>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500">{section.title}</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">{fmt(section.mean)}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">SD {fmt(section.sd)} · n={section.n}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <RankList title="Highest rated items" items={likert.top} tone="good" />
                  <RankList title="Lowest rated items" items={likert.bottom} tone="watch" />
                </div>

                <AdminTableScroll className="max-h-[28rem] rounded-xl border border-slate-200">
                  <table className={`${adminTable} min-w-[48rem]`}>
                    <thead className={adminTableHead}>
                      <tr>
                        <th className={adminTableHeadCell}>#</th>
                        <th className={adminTableHeadCell}>Statement</th>
                        <th className={`${adminTableHeadCell} text-right`}>n</th>
                        <th className={`${adminTableHeadCell} text-right`}>Mean</th>
                        <th className={`${adminTableHeadCell} text-right`}>SD</th>
                        <th className={adminTableHeadCell}>Distribution</th>
                      </tr>
                    </thead>
                    <tbody className={adminTableBody}>
                      {likert.items.map((item) => (
                        <tr className={adminTableRow} key={item.id}>
                          <td className={`${adminTableCell} font-black`}>{item.number}</td>
                          <td className={`${adminTableCell} max-w-md text-sm`}>{item.prompt}</td>
                          <td className={`${adminTableCell} text-right`}>{item.n}</td>
                          <td className={`${adminTableCell} text-right font-black`}>{fmt(item.mean)}</td>
                          <td className={`${adminTableCell} text-right`}>{fmt(item.sd)}</td>
                          <td className={adminTableCell}>
                            <div className="flex h-2.5 min-w-28 overflow-hidden rounded-full bg-slate-100">
                              {item.distribution.map((bucket, index) => {
                                const width = item.n ? (bucket.count / item.n) * 100 : 0;
                                const colors = ["#94a3b8", "#f59e0b", "#eab308", "#34d399", "#059669"];
                                return <span key={bucket.score} style={{ width: `${width}%`, background: colors[index] }} title={`${bucket.label}: ${bucket.count}`} />;
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </AdminTableScroll>
              </div>
            ) : null}
          </section>

          {analytics.crossBreaks ? (
            <Panel title="Cross-break: overall Likert by class" subtitle="Shown when at least 5 student responses are available.">
              <AccessibleBars
                title="Mean overall Likert by class"
                data={analytics.crossBreaks.studentOverallByClass.map((item) => ({
                  label: `${item.label} (n=${item.n})`,
                  value: Number((item.mean ?? 0).toFixed(2))
                }))}
              />
            </Panel>
          ) : (
            <Panel title="Cross-breaks" subtitle="Need at least 5 student responses before class splits are shown.">
              <Empty text="Collect a few more Form A responses to unlock class comparisons." />
            </Panel>
          )}

          <Panel title="System checklist (Form C)" subtitle="Functional pass rates and benchmark hits.">
            <div className="grid gap-3 sm:grid-cols-3">
              <Kpi label="System responses" value={analytics.system.responseCount} />
              <Kpi label="Metrics met" value={`${analytics.system.metricPass.met}/${analytics.system.metricPass.total}`} />
              <Kpi label="Metric pass rate" value={analytics.system.metricPass.rate == null ? "—" : `${Math.round(analytics.system.metricPass.rate * 100)}%`} />
            </div>
            <AdminTableScroll className="mt-4 max-h-80 rounded-xl border border-slate-200">
              <table className={`${adminTable} min-w-[36rem]`}>
                <thead className={adminTableHead}>
                  <tr>
                    <th className={adminTableHeadCell}>#</th>
                    <th className={adminTableHeadCell}>Feature</th>
                    <th className={`${adminTableHeadCell} text-right`}>Works</th>
                    <th className={`${adminTableHeadCell} text-right`}>Issue</th>
                    <th className={`${adminTableHeadCell} text-right`}>Works %</th>
                  </tr>
                </thead>
                <tbody className={adminTableBody}>
                  {analytics.system.features.map((feature) => (
                    <tr className={adminTableRow} key={feature.id}>
                      <td className={adminTableCell}>{feature.number}</td>
                      <td className={adminTableCell}>{feature.prompt}</td>
                      <td className={`${adminTableCell} text-right`}>{feature.works}</td>
                      <td className={`${adminTableCell} text-right`}>{feature.issue}</td>
                      <td className={`${adminTableCell} text-right font-black`}>
                        {feature.worksRate == null ? "—" : `${Math.round(feature.worksRate * 100)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableScroll>
          </Panel>

          <Panel title="Open-ended responses" subtitle="Qualitative answers from Forms A and B.">
            <div className="relative print:hidden">
              <Search className="absolute left-3 top-3.5 size-4 text-slate-400" />
              <input
                className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search comments…"
                value={query}
              />
            </div>
            {openEnded.length ? (
              <div className="mt-4 grid gap-3">
                {openEnded.slice(0, 80).map((item) => (
                  <article className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={item.id}>
                    <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                      {item.formType} · Q{item.number} · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{item.prompt}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-800">{item.text}</p>
                  </article>
                ))}
              </div>
            ) : (
              <Empty text="No open-ended comments match this filter." />
            )}
          </Panel>
        </>
      ) : null}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><ClipboardList className="size-5" /></span>
        <div>
          <h2 className="text-lg font-black">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function MiniBars({ title, data }: { title: string; data: Array<{ label: string; value: number }> }) {
  if (!data.length) return <Empty text={`No ${title.toLowerCase()} data yet.`} />;
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</p>
      <div className="mt-2">
        <AccessibleBars title={title} data={data} />
      </div>
    </div>
  );
}

function RankList({
  title,
  items,
  tone
}: {
  title: string;
  items: Array<{ id: string; number: number | string; prompt: string; mean: number | null; n: number }>;
  tone: "good" | "watch";
}) {
  return (
    <div className={cn("rounded-2xl p-4 ring-1", tone === "good" ? "bg-emerald-50 ring-emerald-100" : "bg-amber-50 ring-amber-100")}>
      <p className="text-sm font-black text-slate-900">{title}</p>
      <ol className="mt-3 grid gap-2">
        {items.map((item) => (
          <li className="text-sm" key={item.id}>
            <b className="text-slate-950">Q{item.number}</b>
            <span className="ml-2 font-black text-emerald-800">{fmt(item.mean)}</span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-600">{item.prompt}</span>
          </li>
        ))}
        {!items.length ? <li className="text-xs font-bold text-slate-500">Not enough ratings yet.</li> : null}
      </ol>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm font-bold text-slate-500">{text}</p>;
}
