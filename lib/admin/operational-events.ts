import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type OperationalOutcome = "success" | "failure" | "blocked" | "timeout" | "warning";
type OperationalCategory = "authentication" | "application" | "database" | "provider" | "abuse" | "data_health" | "privacy" | "release" | "job";

function fingerprint(value?: string | null) {
  if (!value) return null;
  const secret = process.env.OPERATIONAL_LOG_HMAC_SECRET || process.env.OTP_HMAC_SECRET || process.env.PHONE_BLOCKLIST_HMAC_SECRET;
  if (!secret) return null;
  return createHash("sha256").update(`${secret}:${value.toLowerCase()}`).digest("hex").slice(0, 24);
}

function sanitizedMetadata(value: Record<string, unknown> = {}) {
  const forbidden = /password|otp|token|secret|cookie|authorization|phone|email|username|session/i;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !forbidden.test(key))
      .slice(0, 20)
      .map(([key, item]) => [key, typeof item === "string" ? item.slice(0, 200) : item])
  );
}

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || null;
}

export async function recordOperationalEvent(input: {
  category: OperationalCategory;
  eventType: string;
  outcome: OperationalOutcome;
  severity?: "info" | "low" | "medium" | "high" | "critical";
  route?: string;
  subject?: string | null;
  ip?: string | null;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("AdminOperationalEvent").insert({
      category: input.category,
      eventType: input.eventType,
      outcome: input.outcome,
      severity: input.severity ?? "info",
      route: input.route ?? null,
      subjectHash: fingerprint(input.subject),
      ipHash: fingerprint(input.ip),
      durationMs: input.durationMs === undefined ? null : Math.max(0, Math.round(input.durationMs)),
      metadata: sanitizedMetadata(input.metadata)
    });
    if (error) console.error("Operational event logging failed:", error.message);
  } catch (error) {
    console.error("Operational event logging failed:", error instanceof Error ? error.message : "Unknown error");
  }
}

export async function evaluateFailedLoginAlert() {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 15 * 60_000).toISOString();
    const { count, error } = await admin.from("AdminOperationalEvent")
      .select("id", { count: "exact", head: true })
      .eq("eventType", "login.failed")
      .gte("createdAt", since);
    if (error || (count ?? 0) < 5) return;
    const dedupeSince = new Date(Date.now() - 15 * 60_000).toISOString();
    const { count: existing } = await admin.from("AdminAlert")
      .select("id", { count: "exact", head: true })
      .eq("ruleId", "admin-login-failures")
      .in("status", ["open", "acknowledged"])
      .gte("detectedAt", dedupeSince);
    if (existing) return;
    await admin.from("AdminAlert").insert({
      ruleId: "admin-login-failures",
      title: "Unusual login failure velocity",
      detail: `${count} failed login attempts were recorded in 15 minutes.`,
      severity: "high",
      affectedService: "Authentication",
      metricValue: count
    });
  } catch {
    // Authentication must not fail because monitoring is unavailable.
  }
}
