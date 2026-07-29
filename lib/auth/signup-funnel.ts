import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateSignupFunnel(input: {
  sessionId: string;
  role: "student" | "teacher";
  step?: number;
  usernamePrefix?: string;
  event: "started" | "progressed" | "otp_requested" | "completed" | "abandoned";
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data } = await admin
    .from("SignupFunnelSession")
    .select("highestStep,status")
    .eq("id", input.sessionId)
    .maybeSingle();
  const step = Math.max(1, Math.min(5, input.step ?? 1));
  const values: Record<string, unknown> = {
    id: input.sessionId,
    role: input.role,
    highestStep: Math.max(Number(data?.highestStep ?? 1), step),
    lastSeenAt: now
  };
  const usernamePrefix = input.usernamePrefix?.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 6);
  if (usernamePrefix) values.usernamePrefix = usernamePrefix;
  if (input.event === "completed") {
    values.status = "completed";
    values.completedAt = now;
    values.abandonedAt = null;
  } else if (input.event === "abandoned" && data?.status !== "completed") {
    values.status = "abandoned";
    values.abandonedAt = now;
  } else {
    values.status = "active";
    values.abandonedAt = null;
  }
  if (input.event === "otp_requested") values.otpRequestedAt = now;
  const { error } = await admin.from("SignupFunnelSession").upsert(values, { onConflict: "id" });
  if (error) throw new Error(`Could not record signup funnel progress: ${error.message}`);
}
