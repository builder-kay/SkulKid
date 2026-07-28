"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  GitCommitHorizontal,
  KeyRound,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle
} from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

type SystemData = Record<string, any>;

export default function SystemControlCenterPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/system", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load system controls.");
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load system controls.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function updateAlert(alertId: string, action: "acknowledge_alert" | "resolve_alert") {
    const reason = window.prompt(action === "resolve_alert" ? "Resolution note:" : "Acknowledgement note:");
    if (!reason) return;
    const response = await fetch("/api/admin/system/actions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId, action, reason })
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Could not update alert.");
    else await load();
  }
  async function assignRole(userId: string) {
    const adminRole = window.prompt("Scoped role (super_admin, security_admin, system_operator, support_agent, content_moderator, curriculum_manager, billing_operator, privacy_officer, read_only_auditor):");
    if (!adminRole) return;
    const reason = window.prompt("Reason for this assignment:");
    if (!reason) return;
    const response = await fetch("/api/admin/system/actions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign_admin_role", userId, adminRole, reason })
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Could not assign role.");
    else await load();
  }

  return <main className="mx-auto grid w-full max-w-[100rem] gap-6">
    <header className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950 p-6 text-white shadow-[var(--shadow-card)] sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-cyan-300">Govern · Protect · Detect · Respond · Recover</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">System control center</h1><p className="mt-3 max-w-3xl text-slate-300">Authentication security, application reliability, alerts, recovery, provider health, privacy, releases, data quality and scoped administration.</p></div><button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-black text-slate-950 disabled:opacity-60" disabled={loading} onClick={() => void load()}><RefreshCw className={`size-5 ${loading ? "animate-spin" : ""}`} />Refresh</button></div>
    </header>
    {error ? <div className="rounded-2xl bg-rose-50 p-4 font-bold text-rose-900" role="alert">{error}</div> : null}
    {loading && !data ? <div className="rounded-2xl bg-white p-10 text-center font-bold text-slate-500">Running live system checks…</div> : null}
    {data ? <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi icon={KeyRound} label="Login failures" value={data.authentication.failedLogins} detail={`${data.authentication.successfulLogins} successful`} tone={data.authentication.failedLogins >= 5 ? "danger" : "good"} />
        <Kpi icon={ShieldAlert} label="Suspended attempts" value={data.authentication.suspendedAttempts} detail={`${data.authentication.rateLimitBlocks} rate-limit blocks`} tone={data.authentication.suspendedAttempts ? "warn" : "good"} />
        <Kpi icon={Activity} label="API error rate" value={`${data.application.errorRate}%`} detail={`${data.application.timeouts} timeouts`} tone={data.application.errorRate > 5 ? "danger" : "good"} />
        <Kpi icon={Database} label="Database" value={data.database.status} detail={`${data.database.latencyMs}ms`} tone={data.database.status === "operational" ? "good" : "danger"} />
        <Kpi icon={Server} label="OTP acceptance" value={data.otp.acceptanceRate === null ? "—" : `${data.otp.acceptanceRate}%`} detail={`${data.otp.submitted} provider submissions`} tone={data.otp.acceptanceRate !== null && data.otp.acceptanceRate < 90 ? "danger" : "good"} />
        <Kpi icon={Users} label="Signup completion" value={data.signup.completionRate === null ? "—" : `${data.signup.completionRate}%`} detail={`${data.signup.completed}/${data.signup.started} completed`} tone={data.signup.completionRate !== null && data.signup.completionRate < 50 ? "warn" : "good"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Panel title="Automated alerts" subtitle="Threshold breaches open alerts and, where configured, incidents.">
          <div className="divide-y divide-slate-100">{data.alerts.length ? data.alerts.map((alert: any) => <div className="p-4" key={alert.id}><div className="flex flex-wrap items-center gap-2"><Status value={alert.severity} /><Status value={alert.status} /><span className="text-xs font-bold text-slate-500">{alert.affectedService}</span></div><h3 className="mt-2 font-black">{alert.title}</h3><p className="mt-1 text-sm text-slate-600">{alert.detail}</p><p className="mt-2 text-xs font-bold text-slate-400">Detected {new Date(alert.detectedAt).toLocaleString()}</p>{alert.status !== "resolved" ? <div className="mt-3 flex gap-2">{alert.status === "open" ? <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black" onClick={() => void updateAlert(alert.id, "acknowledge_alert")}>Acknowledge</button> : null}<button className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white" onClick={() => void updateAlert(alert.id, "resolve_alert")}>Resolve</button></div> : null}</div>) : <Empty text="No alerts are open." />}</div>
        </Panel>
        <Panel title="Performance" subtitle="Observed instrumented routes during the last 24 hours.">
          <div className="grid grid-cols-3 gap-2 p-4"><Mini label="p50" value={formatMs(data.application.latency.p50)} /><Mini label="p95" value={formatMs(data.application.latency.p95)} /><Mini label="p99" value={formatMs(data.application.latency.p99)} /></div>
          <div className="divide-y divide-slate-100">{data.application.byRoute.length ? data.application.byRoute.map((route: any) => <div className="grid grid-cols-[1fr_auto_auto] gap-3 p-4 text-sm" key={route.route}><code className="truncate font-bold">{route.route}</code><span>{route.errorRate}% errors</span><span>{formatMs(route.p95)} p95</span></div>) : <Empty text="No instrumented API requests yet." />}</div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel title="Authentication security" subtitle="Admin access and authentication outcomes.">
          <List rows={[
            ["Successful logins", data.authentication.successfulLogins],
            ["Failed logins", data.authentication.failedLogins],
            ["Password resets", data.authentication.passwordResets],
            ["Client crashes", data.application.clientCrashes],
            ["Failed scheduled jobs", data.application.failedJobs]
          ]} />
          <div className="border-t border-slate-100 p-4"><p className="text-xs font-black uppercase text-slate-500">Administrator accounts</p>{data.authentication.adminAccounts.map((admin: any) => <div className="mt-3 rounded-xl bg-slate-50 p-3" key={admin.id}><p className="font-black">{admin.display}</p><p className="mt-1 text-xs text-slate-600">MFA: {admin.mfaStatus.replace("_", " ")} · Scope: {admin.scopedRole.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-500">Last sign-in: {admin.lastSignInAt ? new Date(admin.lastSignInAt).toLocaleString() : "Never"}</p><button className="mt-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-black" onClick={() => void assignRole(admin.id)}>Assign scoped role</button></div>)}</div>
        </Panel>
        <Panel title="SMS providers" subtitle="Submission health; delivery is shown only when a provider reports it.">
          <div className="divide-y divide-slate-100">{data.otp.byProvider.map((provider: any) => <div className="p-4" key={provider.provider}><div className="flex items-center justify-between"><b className="capitalize">{provider.provider}</b><span className="text-sm">{provider.accepted}/{provider.total} accepted</span></div><p className="mt-1 text-xs text-slate-500">{provider.latestSnapshot ? `Last provider check: ${new Date(provider.latestSnapshot.checkedAt).toLocaleString()}` : "Balance, sender approval and carrier reports require a provider adapter."}</p></div>)}</div>
        </Panel>
        <Panel title="Release & configuration" subtitle="Secret values are never returned to the browser.">
          <div className="p-4"><div className="flex gap-3"><GitCommitHorizontal className="size-5 text-cyan-700" /><div><p className="font-black">Current commit</p><code className="text-xs text-slate-600">{data.release.currentCommit}</code><p className="mt-1 text-xs text-slate-500">{data.release.environment} · {data.release.deploymentUrl || "Deployment URL unavailable"}</p></div></div></div>
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-4">{data.config.map((item: any) => <div className={`rounded-xl p-3 text-xs font-bold ${item.configured ? "bg-emerald-50 text-emerald-900" : "bg-slate-100 text-slate-600"}`} key={item.key}>{item.configured ? <CheckCircle2 className="mb-1 size-4" /> : <XCircle className="mb-1 size-4" />}{item.label}</div>)}</div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Readiness title="Backup & recovery" items={[
          ["Last backup", data.recovery.find((item: any) => item.recordType === "backup")?.completedAt || "No verified backup recorded"],
          ["Last restore test", data.recovery.find((item: any) => item.recordType === "restore_test")?.verifiedAt || "No restore test recorded"],
          ["Migration", data.database.latestMigration],
          ["Drift", data.database.driftStatus]
        ]} />
        <Readiness title="Privacy & child safety" items={[
          ["Open requests", data.privacy.filter((item: any) => item.status !== "completed").length],
          ["Urgent requests", data.privacy.filter((item: any) => item.priority === "urgent" && item.status !== "completed").length],
          ["Access model", "Admin-only RLS with audited mutations"],
          ["Sensitive logs", "Masked or hashed"]
        ]} />
        <Readiness title="Data health" items={[
          ["Auth users", data.dataHealth.authUsers],
          ["Admins missing scoped role", data.dataHealth.missingScopedAdminRole],
          ["Provisioning failures", data.dataHealth.failedProvisioningEvents],
          ["Orphan protection", data.dataHealth.orphanChecks],
          ["Database growth", data.dataHealth.databaseGrowth]
        ]} />
      </section>

      <Panel title="Alert rules" subtitle="Default thresholds are stored as editable operational policy.">
        <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Rule</th><th className="p-4">Threshold</th><th className="p-4">Window</th><th className="p-4">Severity</th><th className="p-4">Incident</th><th className="p-4">State</th></tr></thead><tbody className="divide-y divide-slate-100">{data.rules.map((rule: any) => <tr key={rule.id}><td className="p-4 font-black">{rule.name}</td><td className="p-4">{rule.operator} {rule.threshold}</td><td className="p-4">{rule.windowMinutes} min</td><td className="p-4"><Status value={rule.severity} /></td><td className="p-4">{rule.autoIncident ? "Automatic" : "Manual"}</td><td className="p-4">{rule.enabled ? "Enabled" : "Disabled"}</td></tr>)}</tbody></table></div>
      </Panel>
    </> : null}
  </main>;
}

function Kpi({ icon: Icon, label, value, detail, tone }: { icon: React.ElementType; label: string; value: any; detail: string; tone: "good" | "warn" | "danger" }) { const style = tone === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-rose-200 bg-rose-50 text-rose-950"; return <div className={`rounded-2xl border p-4 ${style}`}><Icon className="size-5" /><p className="mt-3 text-xs font-black uppercase tracking-wider opacity-65">{label}</p><strong className="mt-1 block text-2xl capitalize">{value}</strong><p className="mt-1 text-xs font-bold opacity-70">{detail}</p></div>; }
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <SkulKidCard className="overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>{children}</SkulKidCard>; }
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3 text-center"><strong className="block text-lg">{value}</strong><span className="text-xs font-black uppercase text-slate-500">{label}</span></div>; }
function List({ rows }: { rows: Array<[string, any]> }) { return <div className="divide-y divide-slate-100">{rows.map(([label, value]) => <div className="flex items-center justify-between p-4 text-sm" key={label}><span className="font-bold text-slate-600">{label}</span><strong>{value}</strong></div>)}</div>; }
function Readiness({ title, items }: { title: string; items: Array<[string, any]> }) { return <SkulKidCard className="p-5"><h2 className="text-xl font-black">{title}</h2><div className="mt-4 grid gap-3">{items.map(([label, value]) => <div key={label}><p className="text-xs font-black uppercase text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-bold text-slate-700">{String(value)}</p></div>)}</div></SkulKidCard>; }
function Status({ value }: { value: string }) { const danger = ["critical","high","open","failed","down"].includes(value); const warn = ["medium","acknowledged","degraded","warning"].includes(value); return <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${danger ? "bg-rose-100 text-rose-900" : warn ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>{value.replaceAll("_", " ")}</span>; }
function Empty({ text }: { text: string }) { return <div className="p-8 text-center text-sm font-bold text-slate-500">{text}</div>; }
function formatMs(value: number | null) { return value === null ? "—" : `${value}ms`; }
