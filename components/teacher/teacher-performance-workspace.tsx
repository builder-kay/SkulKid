"use client";

import { cloneElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  MessageSquareHeart,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
  X
} from "lucide-react";
import type {
  ClassAdviceView,
  ClassPerformanceData,
  PerformanceLearner,
  PerformanceMetric,
  PerformanceRange
} from "@/lib/classes/types";
import { cn } from "@/lib/utils";

const metricLabels: Record<PerformanceMetric, string> = {
  academic: "Academic score (%)",
  completion: "Lesson completion (%)",
  activity: "Activity (minutes)",
  class_xp: "Class XP earned"
};

type PointReport = { id: string; studentName: string; amount: number; reason: string; message: string; status: string; resolutionNote: string | null };

export function TeacherPerformanceWorkspace({ classId, pointReports = [] }: { classId: string; pointReports?: PointReport[] }) {
  const [data, setData] = useState<ClassPerformanceData | null>(null);
  const [range, setRange] = useState<PerformanceRange>("30d");
  const [metric, setMetric] = useState<PerformanceMetric>("academic");
  const [subjectId, setSubjectId] = useState("");
  const [strandId, setStrandId] = useState("");
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ range, metric });
      if (subjectId) params.set("subjectId", subjectId);
      if (strandId) params.set("strandId", strandId);
      const response = await fetch(`/api/teacher/classes/${classId}/performance?${params}`, { cache: "no-store" });
      const payload = await response.json() as ClassPerformanceData & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load performance.");
      setData(payload);
      setHighlighted((current) => current.filter((id) => payload.learners.some((learner) => learner.studentId === id)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load performance.");
    } finally { setLoading(false); }
  }, [classId, metric, range, strandId, subjectId]);
  useEffect(() => { void load(); }, [load]);

  const visibleLearners = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.learners ?? []).filter((learner) => !needle || `${learner.displayName} ${learner.grade}`.toLowerCase().includes(needle));
  }, [data, query]);
  const selected = data?.learners.find((learner) => learner.studentId === selectedId) ?? null;
  const strands = data?.subjects.find((subject) => subject.id === subjectId)?.strands ?? [];

  return (
    <section className="grid gap-5">
      <div className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-5 text-white shadow-xl sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Evidence-led learner support</p><h2 className="mt-2 text-3xl font-black">Class performance</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Compare progress, explore each learner’s evidence and turn insights into constructive next steps.</p></div>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 font-black text-slate-950 disabled:opacity-60" disabled={loading} onClick={() => void load()} type="button"><RefreshCw className={cn("size-4", loading && "animate-spin")} />Refresh evidence</button>
        </div>
      </div>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900" role="alert">{error}</p> : null}
      {pointReports.length ? <section className="overflow-hidden rounded-[1.5rem] border border-rose-200 bg-rose-50"><div className="border-b border-rose-200 p-5"><p className="text-xs font-black uppercase tracking-wider text-rose-700">Requires fair review</p><h3 className="mt-1 text-xl font-black text-rose-950">Student point reports</h3><p className="mt-1 text-sm text-rose-900">Administrators make the final decision on disputed deductions.</p></div><div className="grid gap-3 p-4 sm:grid-cols-2">{pointReports.map((report) => <article className="rounded-xl border border-rose-200 bg-white p-4" key={report.id}><div className="flex items-start justify-between gap-3"><b>{report.studentName}</b><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase">{report.status}</span></div><p className="mt-2 text-sm"><b>{report.amount}-point deduction:</b> {report.reason}</p><p className="mt-1 text-sm text-slate-600">Learner report: {report.message}</p>{report.resolutionNote ? <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs font-bold text-emerald-900">Admin response: {report.resolutionNote}</p> : null}</article>)}</div></section> : null}
      {loading && !data ? <div className="grid min-h-80 place-items-center rounded-[1.5rem] border border-slate-200 bg-white"><span className="text-center font-bold text-slate-500"><Loader2 className="mx-auto mb-3 size-7 animate-spin text-blue-700" />Building class performance…</span></div> : null}
      {data ? <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Kpi icon={BarChart3} label="Class average" value={formatPercent(data.summary.academicAverage)} detail="Latest assigned assessments" />
          <Kpi icon={Target} label="Completion" value={formatPercent(data.summary.completionPercent)} detail="Assigned published lessons" />
          <Kpi icon={Activity} label="Active learners" value={`${data.summary.activeLearners}/${data.learners.length}`} detail="Activity within 7 days" />
          <Kpi icon={UserRoundCheck} label="Need support" value={data.summary.needsSupport} detail="Evidence flag, not a diagnosis" warn={data.summary.needsSupport > 0} />
          <Kpi icon={ArrowUpRight} label="Improving" value={data.summary.improving} detail="Trend of +5 points or more" />
          <Kpi icon={ArrowDownRight} label="Declining" value={data.summary.declining} detail="Trend of −5 points or more" warn={data.summary.declining > 0} />
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-5">
          <Filter label="Time range"><select value={range} onChange={(event) => setRange(event.target.value as PerformanceRange)}><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="term">Current term</option></select></Filter>
          <Filter label="Timeline metric"><select value={metric} onChange={(event) => setMetric(event.target.value as PerformanceMetric)}>{Object.entries(metricLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Filter>
          <Filter label="Subject"><select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setStrandId(""); }}><option value="">All assigned learning</option>{data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></Filter>
          <Filter label="Strand"><select disabled={!subjectId} value={strandId} onChange={(event) => setStrandId(event.target.value)}><option value="">All strands</option>{strands.map((strand) => <option key={strand.id} value={strand.id}>{strand.name}</option>)}</select></Filter>
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">Find learner<span className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2" /><input className="min-h-11 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm font-semibold normal-case tracking-normal" placeholder="Search names" value={query} onChange={(event) => setQuery(event.target.value)} /></span></label>
        </div>

        <PerformanceChart data={data} highlighted={highlighted} onToggle={(id) => setHighlighted((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])} />

        <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Every active learner</p><h3 className="mt-1 text-xl font-black">Performance register</h3></div><p className="text-xs text-slate-500">{visibleLearners.length} learner{visibleLearners.length === 1 ? "" : "s"} · updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[66rem] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Learner</th><th className="px-3 py-3">Assessment</th><th className="px-3 py-3">Trend</th><th className="px-3 py-3">Lessons</th><th className="px-3 py-3">Quiz pass</th><th className="px-3 py-3">Last active</th><th className="px-3 py-3">Context</th><th className="px-3 py-3">Status</th><th className="px-3 py-3"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className="divide-y divide-slate-100">{visibleLearners.map((learner) => <tr className="hover:bg-blue-50/40" key={learner.studentId}>
                <td className="px-4 py-4"><button className="text-left" onClick={() => setSelectedId(learner.studentId)} type="button"><b className="block text-slate-950">{learner.displayName}</b><span className="text-xs text-slate-500">{learner.grade}</span></button></td>
                <td className="px-3 py-4 font-black">{formatPercent(learner.academicAverage)}</td>
                <td className={cn("px-3 py-4 font-black", learner.trend === null ? "text-slate-400" : learner.trend >= 0 ? "text-emerald-700" : "text-rose-700")}>{learner.trend === null ? "—" : `${learner.trend > 0 ? "+" : ""}${learner.trend} pts`}</td>
                <td className="px-3 py-4">{learner.completedLessons}/{learner.totalLessons}<span className="block text-xs text-slate-400">{formatPercent(learner.completionPercent)}</span></td>
                <td className="px-3 py-4">{learner.quizzesPassed}/{learner.quizzesAttempted}<span className="block text-xs text-slate-400">{formatPercent(learner.passRate)}</span></td>
                <td className="px-3 py-4">{learner.lastActiveAt ? relativeDate(learner.lastActiveAt) : "No data"}</td>
                <td className="px-3 py-4"><span className="font-bold">{learner.platformXp} XP</span><span className="block text-xs text-slate-400">{learner.platformStreak}-day streak</span></td>
                <td className="px-3 py-4"><Status learner={learner} /></td>
                <td className="px-3 py-4"><button aria-label={`Review ${learner.displayName}`} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-blue-700 px-3 text-xs font-black text-white" onClick={() => setSelectedId(learner.studentId)} type="button">Review<ChevronRight className="size-4" /></button></td>
              </tr>)}</tbody>
            </table>
          </div>
          {!visibleLearners.length ? <p className="p-8 text-center text-sm text-slate-500">No learner matches this search.</p> : null}
        </section>
      </> : null}

      {selected && data ? <LearnerPanel classId={classId} data={data} learner={selected} onClose={() => setSelectedId("")} onRefresh={load} range={range} subjectId={subjectId} /> : null}
    </section>
  );
}

function PerformanceChart({ data, highlighted, onToggle }: { data: ClassPerformanceData; highlighted: string[]; onToggle: (id: string) => void }) {
  const width = 900, height = 330, left = 48, right = 18, top = 20, bottom = 42;
  const values = data.timeline.flatMap((point) => [point.classAverage, ...Object.values(point.students)]).filter((value): value is number => value !== null);
  const max = data.metric === "academic" || data.metric === "completion" ? 100 : Math.max(1, ...values);
  const x = (index: number) => left + index / Math.max(1, data.timeline.length - 1) * (width - left - right);
  const y = (value: number) => top + (1 - value / max) * (height - top - bottom);
  const path = (studentId?: string) => {
    let drawing = false;
    return data.timeline.map((point, index) => {
      const value = studentId ? point.students[studentId] : point.classAverage;
      if (value === null || value === undefined) { drawing = false; return ""; }
      const command = drawing ? "L" : "M"; drawing = true;
      return `${command}${x(index).toFixed(1)},${y(value).toFixed(1)}`;
    }).join(" ");
  };
  return <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Performance timeline</p><h3 className="mt-1 text-xl font-black">{metricLabels[data.metric]}</h3><p className="mt-1 text-sm text-slate-500">All learners are visible. Select names to highlight individual lines.</p></div><div className="flex max-w-3xl flex-wrap gap-1.5">{data.learners.map((learner) => <button className={cn("rounded-full border px-2.5 py-1 text-[11px] font-bold transition", highlighted.includes(learner.studentId) ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 text-slate-500 hover:border-blue-300")} key={learner.studentId} onClick={() => onToggle(learner.studentId)} type="button">{learner.displayName}</button>)}</div></div>
    <div className="overflow-x-auto p-3 sm:p-5"><svg aria-label={`${metricLabels[data.metric]} for all learners over time`} className="min-w-[44rem]" role="img" viewBox={`0 0 ${width} ${height}`}><title>{metricLabels[data.metric]} timeline. Missing evidence is displayed as a gap.</title>
      {[0, .25, .5, .75, 1].map((ratio) => <g key={ratio}><line stroke="#e2e8f0" x1={left} x2={width - right} y1={top + ratio * (height - top - bottom)} y2={top + ratio * (height - top - bottom)} /><text fill="#64748b" fontSize="11" textAnchor="end" x={left - 8} y={top + ratio * (height - top - bottom) + 4}>{Math.round(max * (1 - ratio))}</text></g>)}
      {data.learners.map((learner, index) => <path d={path(learner.studentId)} fill="none" key={learner.studentId} opacity={highlighted.length && !highlighted.includes(learner.studentId) ? .12 : highlighted.includes(learner.studentId) ? 1 : .28} stroke={`hsl(${(index * 53 + 210) % 360} 70% 45%)`} strokeLinecap="round" strokeLinejoin="round" strokeWidth={highlighted.includes(learner.studentId) ? 4 : 2} />)}
      <path d={path()} fill="none" stroke="#0f172a" strokeDasharray="8 5" strokeLinecap="round" strokeWidth="4" />
      {data.timeline.map((point, index) => index % Math.max(1, Math.ceil(data.timeline.length / 6)) === 0 ? <text fill="#64748b" fontSize="11" key={point.date} textAnchor="middle" x={x(index)} y={height - 12}>{new Date(point.date).toLocaleDateString([], { month: "short", day: "numeric" })}</text> : null)}
    </svg></div>
    <div className="border-t border-slate-100 px-5 py-3 text-xs font-bold text-slate-600"><span className="mr-5 inline-flex items-center gap-2"><span className="w-8 border-t-4 border-dashed border-slate-900" />Class average</span><span>Gaps mean no recorded evidence, not a score of zero.</span></div>
    <details className="border-t border-slate-200 p-4"><summary className="cursor-pointer text-sm font-black text-blue-800">View accessible chart data</summary><div className="mt-3 max-h-72 overflow-auto"><table className="w-full min-w-[48rem] text-xs"><thead className="sticky top-0 bg-slate-100"><tr><th className="p-2 text-left">Date</th><th className="p-2 text-right">Class average</th>{data.learners.map((learner) => <th className="p-2 text-right" key={learner.studentId}>{learner.displayName}</th>)}</tr></thead><tbody>{data.timeline.map((point) => <tr className="border-t" key={point.date}><td className="p-2 font-bold">{new Date(point.date).toLocaleDateString()}</td><td className="p-2 text-right">{point.classAverage ?? "—"}</td>{data.learners.map((learner) => <td className="p-2 text-right" key={learner.studentId}>{point.students[learner.studentId] ?? "—"}</td>)}</tr>)}</tbody></table></div></details>
  </section>;
}

function LearnerPanel({ classId, data, learner, range, subjectId, onClose, onRefresh }: { classId: string; data: ClassPerformanceData; learner: PerformanceLearner; range: PerformanceRange; subjectId: string; onClose: () => void; onRefresh: () => Promise<void> }) {
  const detail = data.details[learner.studentId];
  const [title, setTitle] = useState("Your next learning step");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<"celebration" | "practice" | "intervention">("practice");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [actions, setActions] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState("");
  const [track, setTrack] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function draft() {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/performance/recommendation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: learner.studentId, range, subjectId: subjectId || undefined }) });
      const payload = await response.json() as { draft?: { title: string; message: string; category: typeof category; priority: typeof priority; actions: Array<{ label: string }> }; source?: string; error?: string };
      if (!response.ok || !payload.draft) throw new Error(payload.error || "Could not draft feedback.");
      setTitle(payload.draft.title); setMessage(payload.draft.message); setCategory(payload.draft.category); setPriority(payload.draft.priority); setActions(payload.draft.actions.map((item) => item.label));
      setNotice(payload.source === "gemini" ? "AI draft prepared. Review every word before sending." : "Rules-based draft prepared because AI is unavailable. Review before sending.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not draft feedback."); }
    finally { setBusy(false); }
  }
  async function send(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/advice`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        studentId: learner.studentId, courseId: subjectId || null, title, message, suggestionType: category === "celebration" ? "general" : "class_adventure",
        feedbackCategory: category, priority, recommendedActions: actions.filter(Boolean).map((label) => ({ label })),
        evidenceSnapshot: { academicAverage: learner.academicAverage, trend: learner.trend, completionPercent: learner.completionPercent, activityMinutes: learner.activityMinutes },
        followUpStatus: track ? "open" : "not_required", dueAt: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : null
      }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not send feedback.");
      setMessage(""); setActions([]); setNotice("Feedback sent through the supervised class conversation."); await onRefresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send feedback."); }
    finally { setBusy(false); }
  }
  async function resolve(feedback: ClassAdviceView) {
    const resolutionNote = window.prompt("Resolution note:", "The recommended follow-up has been reviewed.");
    if (!resolutionNote) return;
    setBusy(true);
    const response = await fetch(`/api/teacher/classes/${classId}/feedback/${feedback.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resolutionNote }) });
    const payload = await response.json() as { error?: string };
    if (!response.ok) setError(payload.error || "Could not resolve intervention."); else await onRefresh();
    setBusy(false);
  }

  return <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm" onClick={onClose}><aside className="ml-auto h-full w-full max-w-4xl overflow-y-auto bg-slate-50 shadow-2xl" onClick={(event) => event.stopPropagation()}>
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 p-4 backdrop-blur sm:p-5"><span className="grid size-11 place-items-center rounded-2xl bg-blue-100 text-blue-700"><Eye className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-wider text-blue-700">Learner evidence</p><h2 className="truncate text-xl font-black">{learner.displayName}</h2></div><button aria-label="Close learner profile" className="grid size-11 place-items-center rounded-xl hover:bg-slate-100" onClick={onClose} type="button"><X /></button></header>
    <div className="grid gap-5 p-4 sm:p-6">
      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-900">{error}</p> : null}{notice ? <p className="rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-900">{notice}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Mini label="Academic" value={formatPercent(learner.academicAverage)} /><Mini label="Completion" value={formatPercent(learner.completionPercent)} /><Mini label="Assigned activity" value={`${learner.activityMinutes} min`} /><Mini label="Platform context" value={`${learner.platformXp} XP · ${learner.platformStreak} day streak`} /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Evidence highlights" subtitle="Descriptive evidence only—not an ability or attendance judgement."><Insight title="Strengths" items={detail.strengths} good /><Insight title="Needs attention" items={detail.concerns} /></Panel>
        <Panel title="Subject and strand breakdown" subtitle="Latest assessment evidence from assigned lessons.">{detail.breakdown.length ? <div className="divide-y">{detail.breakdown.map((item) => <div className="grid grid-cols-[1fr_auto] gap-3 py-3" key={item.id}><div><b className="text-sm">{item.substrand}</b><p className="text-xs text-slate-500">{item.subject} · {item.strand}</p></div><div className="text-right"><b>{formatPercent(item.average)}</b><p className="text-xs text-slate-500">{item.attempts} attempts</p></div></div>)}</div> : <Empty text="No strand-level assessment evidence yet." />}</Panel>
      </div>
      <Panel title="Recent assessment attempts" subtitle="Latest and best scores remain separate so improvement is visible.">{detail.attempts.length ? <div className="overflow-x-auto"><table className="w-full min-w-[42rem] text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="p-3 text-left">Assessment</th><th>Attempt</th><th>Score</th><th>Best</th><th>Date</th></tr></thead><tbody className="divide-y">{detail.attempts.map((item) => <tr key={item.id}><td className="p-3"><b>{item.title}</b><span className="block text-xs text-slate-500">{item.subject} · {item.strand}</span></td><td className="text-center">{item.attemptNumber}</td><td className="text-center font-black">{item.score}%</td><td className="text-center">{item.bestScore}%</td><td className="text-center text-xs">{new Date(item.submittedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <Empty text="No assessment attempts recorded yet." />}</Panel>
      <form className="overflow-hidden rounded-[1.5rem] border border-blue-200 bg-white shadow-sm" onSubmit={send}><div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-blue-100">Teacher-reviewed recommendation</p><h3 className="mt-1 text-xl font-black">Prepare feedback</h3></div><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-blue-900 disabled:opacity-60" disabled={busy} onClick={() => void draft()} type="button">{busy ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}Draft with AI</button></div></div>
        <div className="grid gap-4 p-5"><p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950"><Sparkles className="mt-0.5 size-4 shrink-0" />AI never sends feedback automatically. Review the evidence, tone and next steps before sending.</p>
          <label className="grid gap-1.5 text-sm font-bold">Title<input className="min-h-11 rounded-xl border border-slate-300 px-3" maxLength={120} required value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="grid gap-1.5 text-sm font-bold">Message<textarea className="min-h-32 rounded-xl border border-slate-300 p-3" maxLength={600} required value={message} onChange={(event) => setMessage(event.target.value)} /></label>
          <div className="grid gap-3 sm:grid-cols-3"><Filter label="Category"><select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}><option value="celebration">Celebration</option><option value="practice">Practice</option><option value="intervention">Intervention</option></select></Filter><Filter label="Priority"><select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></Filter><label className="grid gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">Due date<input className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm normal-case" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label></div>
          <label className="grid gap-1.5 text-sm font-bold">Recommended actions<textarea className="min-h-24 rounded-xl border border-slate-300 p-3 font-normal" placeholder="One action per line" value={actions.join("\n")} onChange={(event) => setActions(event.target.value.split("\n").slice(0, 5))} /></label>
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm"><input className="mt-1" checked={track} onChange={(event) => setTrack(event.target.checked)} type="checkbox" /><span><b className="block">Track this follow-up</b><span className="text-slate-500">The learner can acknowledge it and you can resolve it later.</span></span></label>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 font-black text-white disabled:opacity-60" disabled={busy || !message.trim()}><MessageSquareHeart className="size-5" />Send through supervised class chat</button>
        </div>
      </form>
      <Panel title="Feedback and intervention history" subtitle="Read status and follow-up are tracked separately.">{detail.feedback.length ? <div className="grid gap-3">{detail.feedback.map((item) => <article className="rounded-xl border border-slate-200 p-4" key={item.id}><div className="flex flex-wrap items-center gap-2"><b className="mr-auto">{item.title || "Teacher advice"}</b><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase">{item.followUpStatus?.replace("_", " ")}</span><span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase", item.readAt ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-900")}>{item.readAt ? "Read" : "Unread"}</span></div><p className="mt-2 text-sm text-slate-700">{item.message}</p><p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}{item.dueAt ? ` · due ${new Date(item.dueAt).toLocaleDateString()}` : ""}</p>{item.followUpStatus === "open" || item.followUpStatus === "acknowledged" ? <button className="mt-3 rounded-xl border border-slate-300 px-3 py-2 text-xs font-black" disabled={busy} onClick={() => void resolve(item)} type="button">Resolve follow-up</button> : null}{item.resolutionNote ? <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-xs font-bold text-emerald-900">Resolved: {item.resolutionNote}</p> : null}</article>)}</div> : <Empty text="No feedback has been sent yet." />}</Panel>
    </div>
  </aside></div>;
}

function Kpi({ icon: Icon, label, value, detail, warn = false }: { icon: typeof Users; label: string; value: string | number; detail: string; warn?: boolean }) { return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className={cn("grid size-10 place-items-center rounded-xl", warn ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-700")}><Icon className="size-5" /></span><strong className="mt-3 block text-2xl font-black">{value}</strong><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></article>; }
function Mini({ label, value }: { label: string; value: string }) { return <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><strong className="mt-2 block text-xl font-black">{value}</strong></article>; }
function Filter({ label, children }: { label: string; children: React.ReactElement<{ className?: string }> }) { return <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">{label}{cloneElement(children, { className: cn("min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold normal-case tracking-normal disabled:bg-slate-100", children.props.className) })}</label>; }
function Status({ learner }: { learner: PerformanceLearner }) { const map = { no_data: ["No evidence", "bg-slate-100 text-slate-700"], needs_support: ["Needs support", "bg-rose-100 text-rose-800"], watch: ["Watch", "bg-amber-100 text-amber-900"], on_track: ["On track", "bg-emerald-100 text-emerald-800"] } as const; const [label, style] = map[learner.supportStatus]; return <><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase", style)}>{label}</span>{learner.openInterventions ? <span className="ml-1 text-xs font-bold text-violet-700">{learner.openInterventions} open</span> : null}</>; }
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><h3 className="font-black">{title}</h3><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div><div className="p-4">{children}</div></section>; }
function Insight({ title, items, good = false }: { title: string; items: string[]; good?: boolean }) { return <div className={cn("mt-3 rounded-xl p-3", good ? "bg-emerald-50" : "bg-amber-50")}><p className={cn("text-xs font-black uppercase tracking-wider", good ? "text-emerald-800" : "text-amber-900")}>{title}</p>{items.length ? <ul className="mt-2 grid gap-1 text-sm text-slate-700">{items.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Not enough evidence yet.</p>}</div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">{text}</p>; }
function formatPercent(value: number | null) { return value === null ? "—" : `${value}%`; }
function relativeDate(value: string) { const days = Math.floor((Date.now() - Date.parse(value)) / 86400000); return days <= 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`; }
