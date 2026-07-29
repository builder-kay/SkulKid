import { NextResponse } from "next/server";
import { adminContext } from "@/lib/admin/admin-server";

const providers = new Set(["all", "clifze", "arkesel", "bms"]);
const statuses = new Set(["all", "accepted", "rejected"]);

export async function GET(request: Request) {
  try {
    const { admin } = await adminContext();
    const url = new URL(request.url);
    const provider = providers.has(url.searchParams.get("provider") || "")
      ? url.searchParams.get("provider")!
      : "all";
    const status = statuses.has(url.searchParams.get("status") || "")
      ? url.searchParams.get("status")!
      : "all";

    let query = admin
      .from("OtpProviderDiagnostic")
      .select("id,attemptId,signupSessionId,provider,purpose,status,maskedPhone,latencyMs,deliveryStatus,error,createdAt")
      .order("createdAt", { ascending: false })
      .limit(200);
    if (provider !== "all") query = query.eq("provider", provider);
    if (status !== "all") query = query.eq("status", status);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
    const [
      { data, error },
      { data: signupSessions, error: funnelError },
      { data: funnelProviderEvents, error: funnelProviderError }
    ] = await Promise.all([
      query,
      admin.from("SignupFunnelSession")
        .select("id,role,status,highestStep,usernamePrefix,otpRequestedAt,completedAt,abandonedAt,startedAt,lastSeenAt")
        .gte("startedAt", thirtyDaysAgo)
        .order("startedAt", { ascending: false })
        .limit(5000),
      admin.from("OtpProviderDiagnostic")
        .select("id,attemptId,signupSessionId,provider,purpose,status,maskedPhone,latencyMs,deliveryStatus,error,createdAt")
        .not("signupSessionId", "is", null)
        .gte("createdAt", thirtyDaysAgo)
        .limit(15000)
    ]);
    if (error) throw new Error(error.message);
    if (funnelError) throw new Error(funnelError.message);
    if (funnelProviderError) throw new Error(funnelProviderError.message);

    const events = data ?? [];
    const summary = ["clifze", "arkesel", "bms"].map((name) => {
      const matching = events.filter((event) => event.provider === name);
      const accepted = matching.filter((event) => event.status === "accepted").length;
      return {
        provider: name,
        total: matching.length,
        accepted,
        rejected: matching.length - accepted,
        acceptanceRate: matching.length ? Math.round((accepted / matching.length) * 100) : null,
        averageLatencyMs: matching.length
          ? Math.round(matching.reduce((sum, event) => sum + Number(event.latencyMs), 0) / matching.length)
          : null
      };
    });
    const now = Date.now();
    const sessions = signupSessions ?? [];
    const isStale = (session: { lastSeenAt: string }) => now - Date.parse(session.lastSeenAt) > 30 * 60_000;
    const abandoned = sessions.filter((session) =>
      session.status === "abandoned" || (session.status === "active" && isStale(session))
    ).length;
    const completed = sessions.filter((session) => session.status === "completed").length;
    const otpStalled = sessions.filter((session) =>
      session.otpRequestedAt && session.status !== "completed" && now - Date.parse(session.otpRequestedAt) > 15 * 60_000
    ).length;
    const funnelDiagnostics = funnelProviderEvents ?? [];
    const failedAttemptIds = new Set(
      [...new Set(funnelDiagnostics.map((event) => event.attemptId))]
        .filter((attemptId) => {
          const attemptEvents = funnelDiagnostics.filter((event) => event.attemptId === attemptId);
          return attemptEvents.length > 0 && attemptEvents.every((event) => event.status === "rejected");
        })
    );
    const providerFailedSessions = new Set(
      funnelDiagnostics
        .filter((event) => failedAttemptIds.has(event.attemptId) && event.signupSessionId)
        .map((event) => event.signupSessionId)
    ).size;
    const problemReports = sessions
      .filter((session) => session.status !== "completed")
      .map((session) => {
        const providerEvents = funnelDiagnostics
          .filter((event) => event.signupSessionId === session.id)
          .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
        const accepted = providerEvents.filter((event) => event.status === "accepted");
        const rejected = providerEvents.filter((event) => event.status === "rejected");
        const deliveryFailed = providerEvents.some((event) =>
          /failed|undeliver|expired|rejected/i.test(String(event.deliveryStatus ?? ""))
        );
        const stale = isStale(session);
        let problem = `Signup stopped at step ${session.highestStep} before an OTP was requested.`;
        let category = "signup_stopped";
        if (session.otpRequestedAt && providerEvents.length === 0) {
          problem = "OTP was requested, but no provider diagnostic events were recorded. Check production logging and provider invocation.";
          category = "logging_gap";
        } else if (providerEvents.length && rejected.length === providerEvents.length) {
          problem = "Every SMS provider rejected the OTP request. Review each provider error below.";
          category = "all_providers_rejected";
        } else if (deliveryFailed) {
          problem = "At least one provider accepted the request, but a delivery report indicates handset delivery failed.";
          category = "delivery_failed";
        } else if (accepted.length && stale) {
          problem = "A provider accepted the SMS, but signup did not finish. Handset delivery is unconfirmed or the user did not enter a valid code.";
          category = "accepted_not_completed";
        } else if (accepted.length) {
          problem = "The OTP was accepted by a provider and this signup is still awaiting completion.";
          category = "awaiting_completion";
        } else if (session.status === "abandoned") {
          problem = `The user left signup at step ${session.highestStep} before completing the flow.`;
          category = "abandoned";
        }
        return {
          sessionId: session.id,
          role: session.role,
          status: session.status,
          usernamePrefix: session.usernamePrefix ? `${session.usernamePrefix}…` : null,
          highestStep: Number(session.highestStep),
          category,
          problem,
          startedAt: session.startedAt,
          otpRequestedAt: session.otpRequestedAt,
          lastSeenAt: session.lastSeenAt,
          abandonedAt: session.abandonedAt,
          elapsedSeconds: Math.max(0, Math.round((Date.parse(session.lastSeenAt) - Date.parse(session.startedAt)) / 1000)),
          providerEvents
        };
      })
      .sort((a, b) => Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt))
      .slice(0, 250);
    const funnel = {
      periodDays: 30,
      started: sessions.length,
      steps: [1, 2, 3, 4, 5].map((step) => ({
        step,
        count: sessions.filter((session) => Number(session.highestStep) >= step).length
      })),
      otpRequested: sessions.filter((session) => Boolean(session.otpRequestedAt)).length,
      completed,
      abandoned,
      active: sessions.length - completed - abandoned,
      otpStalled,
      providerFailedSessions,
      completionRate: sessions.length ? Math.round((completed / sessions.length) * 100) : 0,
      roles: ["student", "teacher"].map((role) => {
        const roleSessions = sessions.filter((session) => session.role === role);
        const roleCompleted = roleSessions.filter((session) => session.status === "completed").length;
        return {
          role,
          started: roleSessions.length,
          completed: roleCompleted,
          completionRate: roleSessions.length ? Math.round((roleCompleted / roleSessions.length) * 100) : 0
        };
      }),
      trend: Array.from({ length: 14 }, (_, offset) => {
        const date = new Date(now - (13 - offset) * 24 * 60 * 60_000).toISOString().slice(0, 10);
        const daySessions = sessions.filter((session) => session.startedAt.slice(0, 10) === date);
        return {
          date,
          started: daySessions.length,
          completed: daySessions.filter((session) => session.status === "completed").length,
          abandoned: daySessions.filter((session) =>
            session.status === "abandoned" || (session.status === "active" && isStale(session))
          ).length
        };
      })
    };
    return NextResponse.json({ events, summary, funnel, problemReports, generatedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load OTP diagnostics.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 500 });
  }
}
