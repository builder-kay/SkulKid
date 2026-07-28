import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type Signal = {
  ruleId: string;
  title: string;
  detail: string;
  severity: "low" | "medium" | "high" | "critical";
  service: string;
  value: number;
  breached: boolean;
};

export async function evaluateOperationalAlerts() {
  const admin = createAdminClient();
  const hourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const [otp, signup, events, database] = await Promise.all([
    admin.from("OtpProviderDiagnostic").select("status,latencyMs").gte("createdAt", hourAgo),
    admin.from("SignupFunnelSession").select("status").gte("startedAt", dayAgo),
    admin.from("AdminOperationalEvent").select("outcome,eventType,createdAt").gte("createdAt", hourAgo).order("createdAt", { ascending: false }),
    admin.from("AdminOperationalEvent").select("id", { head: true, count: "exact" })
  ]);
  const otpRows = otp.data ?? [];
  const signupRows = signup.data ?? [];
  const eventRows = events.data ?? [];
  const otpAcceptance = otpRows.length
    ? (otpRows.filter((row) => row.status === "accepted").length / otpRows.length) * 100
    : 100;
  const signupCompletion = signupRows.length
    ? (signupRows.filter((row) => row.status === "completed").length / signupRows.length) * 100
    : 100;
  const apiRows = eventRows.filter((row) => row.eventType === "api.error" || row.eventType === "api.request");
  const apiErrorRate = apiRows.length
    ? (apiRows.filter((row) => row.outcome === "failure" || row.outcome === "timeout").length / apiRows.length) * 100
    : 0;
  const maxProviderLatency = otpRows.reduce((max, row) => Math.max(max, Number(row.latencyMs)), 0);
  const failedLogins = eventRows.filter((row) => row.eventType === "login.failed").length;
  const telemetryAge = eventRows[0]?.createdAt
    ? (Date.now() - Date.parse(eventRows[0].createdAt)) / 60_000
    : 9999;
  const signals: Signal[] = [
    { ruleId: "otp-acceptance-low", title: "OTP provider acceptance is below target", detail: `Acceptance during the last hour is ${otpAcceptance.toFixed(1)}%.`, severity: "high", service: "SMS verification", value: otpAcceptance, breached: otpRows.length >= 5 && otpAcceptance < 90 },
    { ruleId: "signup-completion-drop", title: "Signup completion has dropped", detail: `Completion during the last 24 hours is ${signupCompletion.toFixed(1)}%.`, severity: "medium", service: "Signup", value: signupCompletion, breached: signupRows.length >= 5 && signupCompletion < 50 },
    { ruleId: "api-error-rate-high", title: "API error rate is elevated", detail: `Observed API error rate is ${apiErrorRate.toFixed(1)}%.`, severity: "high", service: "Application API", value: apiErrorRate, breached: apiRows.length >= 10 && apiErrorRate > 5 },
    { ruleId: "database-unavailable", title: "Database health check failed", detail: database.error?.message || "The database health query failed.", severity: "critical", service: "Database", value: database.error ? 0 : 1, breached: Boolean(database.error) },
    { ruleId: "admin-login-failures", title: "Unusual login failure velocity", detail: `${failedLogins} failed logins occurred in the last hour.`, severity: "high", service: "Authentication", value: failedLogins, breached: failedLogins >= 5 },
    { ruleId: "provider-latency-high", title: "SMS provider latency is high", detail: `Maximum provider response time was ${maxProviderLatency}ms.`, severity: "medium", service: "SMS verification", value: maxProviderLatency, breached: maxProviderLatency > 5000 },
    { ruleId: "telemetry-silent", title: "Operational telemetry is silent", detail: `No operational event has been recorded for ${Math.round(telemetryAge)} minutes.`, severity: "high", service: "Observability", value: telemetryAge, breached: telemetryAge > 30 }
  ];
  for (const signal of signals.filter((item) => item.breached)) {
    const { data: rule } = await admin.from("AdminAlertRule").select("enabled,autoIncident").eq("id", signal.ruleId).maybeSingle();
    if (!rule?.enabled) continue;
    const { data: existing } = await admin.from("AdminAlert")
      .select("id")
      .eq("ruleId", signal.ruleId)
      .in("status", ["open", "acknowledged"])
      .limit(1)
      .maybeSingle();
    if (existing) continue;
    let incidentId: string | null = null;
    if (rule.autoIncident) {
      const { data: incident } = await admin.from("AdminIncident").insert({
        title: signal.title,
        summary: signal.detail,
        severity: signal.severity,
        status: "open",
        affectedService: signal.service,
        timeline: [{ at: new Date().toISOString(), event: "Automatically detected", detail: signal.detail }]
      }).select("id").single();
      incidentId = incident?.id ?? null;
    }
    const { data: alert } = await admin.from("AdminAlert").insert({
      ruleId: signal.ruleId,
      title: signal.title,
      detail: signal.detail,
      severity: signal.severity,
      affectedService: signal.service,
      metricValue: signal.value,
      incidentId
    }).select("id,title,severity,affectedService").single();
    if (alert && process.env.ADMIN_ALERT_WEBHOOK_URL) {
      await fetch(process.env.ADMIN_ALERT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alert),
        signal: AbortSignal.timeout(5_000)
      }).catch(() => undefined);
    }
  }
}
