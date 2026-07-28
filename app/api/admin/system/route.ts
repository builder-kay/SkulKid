import { NextResponse } from "next/server";
import { adminContext, listAllAuthUsers } from "@/lib/admin/admin-server";
import { resolveAppRole } from "@/lib/auth/roles";
import { evaluateOperationalAlerts } from "@/lib/admin/alert-evaluator";

function percentile(values: number[], percentileValue: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1)];
}

export async function GET() {
  const checkedAt = new Date();
  try {
    const { admin } = await adminContext();
    await evaluateOperationalAlerts();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString();
    const databaseStarted = performance.now();
    const databaseCheck = await admin.from("AdminOperationalEvent").select("id", { head: true, count: "exact" });
    const databaseLatencyMs = Math.round(performance.now() - databaseStarted);
    const [
      operationalEvents,
      alerts,
      rules,
      recovery,
      privacy,
      releases,
      providers,
      adminRoles,
      otpEvents,
      signupSessions,
      incidents,
      users
    ] = await Promise.all([
      admin.from("AdminOperationalEvent").select("*").gte("createdAt", dayAgo).order("createdAt", { ascending: false }).limit(3000),
      admin.from("AdminAlert").select("*").order("detectedAt", { ascending: false }).limit(100),
      admin.from("AdminAlertRule").select("*").order("severity").order("name"),
      admin.from("AdminRecoveryRecord").select("*").order("startedAt", { ascending: false }).limit(50),
      admin.from("AdminPrivacyRequest").select("*").order("createdAt", { ascending: false }).limit(100),
      admin.from("AdminReleaseRecord").select("*").order("deployedAt", { ascending: false }).limit(50),
      admin.from("AdminProviderSnapshot").select("*").order("checkedAt", { ascending: false }).limit(100),
      admin.from("AdminRoleAssignment").select("*").order("assignedAt", { ascending: false }),
      admin.from("OtpProviderDiagnostic").select("provider,status,latencyMs,deliveryStatus,createdAt").gte("createdAt", dayAgo).limit(10000),
      admin.from("SignupFunnelSession").select("status,startedAt,lastSeenAt,completedAt").gte("startedAt", weekAgo).limit(10000),
      admin.from("AdminIncident").select("*").order("createdAt", { ascending: false }).limit(100),
      listAllAuthUsers()
    ]);
    const queryErrors = [operationalEvents, alerts, rules, recovery, privacy, releases, providers, adminRoles, otpEvents, signupSessions, incidents]
      .flatMap((result) => result.error ? [result.error.message] : []);
    const events = operationalEvents.data ?? [];
    const apiEvents = events.filter((event) => event.route);
    const apiFailures = apiEvents.filter((event) => ["failure", "timeout"].includes(event.outcome));
    const durations = apiEvents.map((event) => Number(event.durationMs)).filter(Number.isFinite);
    const authEvents = events.filter((event) => event.category === "authentication");
    const loginFailures = authEvents.filter((event) => event.eventType === "login.failed");
    const loginSuccesses = authEvents.filter((event) => event.eventType === "login.succeeded");
    const suspendedAttempts = authEvents.filter((event) => event.eventType === "login.suspended_attempt");
    const resetEvents = authEvents.filter((event) => event.eventType.startsWith("password_reset."));
    const otp = otpEvents.data ?? [];
    const acceptedOtp = otp.filter((event) => event.status === "accepted");
    const signup = signupSessions.data ?? [];
    const completedSignups = signup.filter((session) => session.status === "completed");
    const staleSignups = signup.filter((session) =>
      session.status !== "completed" && Date.now() - Date.parse(session.lastSeenAt) > 30 * 60_000
    );
    const adminUsers = users.filter((user) => resolveAppRole(user.app_metadata?.role) === "admin");
    const assigned = new Map((adminRoles.data ?? []).map((role) => [role.userId, role.adminRole]));
    const providerLatest = new Map<string, Record<string, unknown>>();
    for (const snapshot of providers.data ?? []) {
      if (!providerLatest.has(snapshot.provider)) providerLatest.set(snapshot.provider, snapshot);
    }
    const config = [
      ["Supabase URL", "NEXT_PUBLIC_SUPABASE_URL"],
      ["Supabase publishable key", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
      ["Supabase service role", "SUPABASE_SERVICE_ROLE_KEY"],
      ["Clifze", "CLIFZE_API_KEY"],
      ["Arkesel", "ARKESEL_API_KEY"],
      ["BMS", "BMS_API_KEY"],
      ["OTP hashing", "OTP_HMAC_SECRET"],
      ["Operational hashing", "OPERATIONAL_LOG_HMAC_SECRET"],
      ["Backup status adapter", "ADMIN_BACKUP_STATUS_URL"],
      ["Backup trigger adapter", "ADMIN_BACKUP_TRIGGER_URL"],
      ["Hosting status adapter", "ADMIN_HOSTING_STATUS_URL"],
      ["Alert notification webhook", "ADMIN_ALERT_WEBHOOK_URL"]
    ].map(([label, key]) => ({ label, key, configured: Boolean(process.env[key]) }));

    return NextResponse.json({
      checkedAt: checkedAt.toISOString(),
      authentication: {
        successfulLogins: loginSuccesses.length,
        failedLogins: loginFailures.length,
        suspendedAttempts: suspendedAttempts.length,
        passwordResets: resetEvents.length,
        rateLimitBlocks: events.filter((event) => event.eventType.startsWith("rate_limit.")).length,
        adminAccounts: adminUsers.map((user) => ({
          id: user.id,
          display: String(user.user_metadata?.display_name || user.email || user.id).slice(0, 80),
          lastSignInAt: user.last_sign_in_at ?? null,
          mfaStatus: (user.factors?.length ?? 0) > 0 ? "enrolled" : "not_enrolled",
          scopedRole: assigned.get(user.id) || "unassigned"
        })),
        activeSessionCapability: "Supabase does not expose all active user sessions through the configured Admin API."
      },
      application: {
        observedRequests: apiEvents.length,
        errors: apiFailures.length,
        errorRate: apiEvents.length ? Math.round((apiFailures.length / apiEvents.length) * 1000) / 10 : 0,
        timeouts: events.filter((event) => event.outcome === "timeout").length,
        clientCrashes: events.filter((event) => event.eventType === "client.crash").length,
        latency: { p50: percentile(durations, 50), p95: percentile(durations, 95), p99: percentile(durations, 99) },
        byRoute: Object.values(apiEvents.reduce<Record<string, { route: string; total: number; errors: number; durations: number[] }>>((map, event) => {
          const route = event.route || "unknown";
          const item = map[route] ?? { route, total: 0, errors: 0, durations: [] };
          item.total += 1;
          if (["failure", "timeout"].includes(event.outcome)) item.errors += 1;
          if (event.durationMs !== null) item.durations.push(Number(event.durationMs));
          map[route] = item;
          return map;
        }, {})).map((item) => ({
          route: item.route,
          total: item.total,
          errors: item.errors,
          errorRate: item.total ? Math.round((item.errors / item.total) * 1000) / 10 : 0,
          p95: percentile(item.durations, 95)
        })),
        failedJobs: events.filter((event) => event.category === "job" && event.outcome !== "success").length
      },
      database: {
        status: databaseCheck.error || queryErrors.length ? "degraded" : "operational",
        latencyMs: databaseLatencyMs,
        errors: queryErrors,
        latestMigration: "20260728230000_admin_observability_governance.sql",
        driftStatus: "requires_cli_or_provider_adapter"
      },
      release: {
        currentCommit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || "unavailable",
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
        deploymentUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
        history: releases.data ?? []
      },
      otp: {
        submitted: otp.length,
        accepted: acceptedOtp.length,
        acceptanceRate: otp.length ? Math.round((acceptedOtp.length / otp.length) * 100) : null,
        averageLatencyMs: otp.length ? Math.round(otp.reduce((sum, event) => sum + Number(event.latencyMs), 0) / otp.length) : null,
        delivered: otp.filter((event) => String(event.deliveryStatus).toUpperCase() === "DELIVERED").length,
        byProvider: ["clifze", "arkesel", "bms"].map((provider) => {
          const matching = otp.filter((event) => event.provider === provider);
          return {
            provider,
            total: matching.length,
            accepted: matching.filter((event) => event.status === "accepted").length,
            latestSnapshot: providerLatest.get(provider) ?? null
          };
        })
      },
      signup: {
        started: signup.length,
        completed: completedSignups.length,
        abandonedOrStale: staleSignups.length,
        completionRate: signup.length ? Math.round((completedSignups.length / signup.length) * 100) : null
      },
      alerts: alerts.data ?? [],
      rules: rules.data ?? [],
      incidents: incidents.data ?? [],
      recovery: recovery.data ?? [],
      privacy: privacy.data ?? [],
      roles: adminRoles.data ?? [],
      providers: [...providerLatest.values()],
      config,
      dataHealth: {
        authUsers: users.length,
        missingScopedAdminRole: adminUsers.filter((user) => !assigned.has(user.id)).length,
        failedProvisioningEvents: events.filter((event) => event.eventType === "account.provisioning_failed").length,
        databaseGrowth: "requires_database_metrics_adapter",
        orphanChecks: "foreign_keys_enforced"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load system control center." }, { status: 500 });
  }
}
