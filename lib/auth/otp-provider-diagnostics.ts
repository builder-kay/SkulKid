import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type OtpProvider = "clifze" | "arkesel" | "bms";

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `••••••${digits.slice(-4)}` : "••••••";
}

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Provider request failed.";
  return message
    .replace(/(?:\+?233|0)\d{9}/g, "[phone]")
    .replace(/[A-Za-z0-9_-]{24,}/g, "[redacted]")
    .slice(0, 300);
}

export async function logOtpProviderDiagnostic(input: {
  attemptId: string;
  signupSessionId?: string;
  provider: OtpProvider;
  purpose: string;
  phone: string;
  status: "accepted" | "rejected";
  latencyMs: number;
  deliveryStatus?: string;
  error?: unknown;
}) {
  try {
    const { error } = await createAdminClient().from("OtpProviderDiagnostic").insert({
      attemptId: input.attemptId,
      signupSessionId: input.signupSessionId || null,
      provider: input.provider,
      purpose: input.purpose,
      status: input.status,
      maskedPhone: maskPhone(input.phone),
      latencyMs: Math.max(0, Math.round(input.latencyMs)),
      deliveryStatus: input.deliveryStatus?.slice(0, 40) || null,
      error: input.error ? safeError(input.error) : null
    });
    if (error) console.error("OTP provider diagnostic insert failed:", error.message);
  } catch (error) {
    console.error("OTP provider diagnostic logging failed:", safeError(error));
  }
}
