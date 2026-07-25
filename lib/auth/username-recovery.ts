import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type RecoveryStage = "identity" | "name" | "otp" | "completed";

export type UsernameRecoveryAttempt = {
  id: string;
  phone: string;
  stage: RecoveryStage;
  selectedUserId: string | null;
  age: number | null;
  grade: number | null;
  learnerName: string | null;
  identityAttempts: number;
  otpAttempts: number;
  expiresAt: string;
  completedAt: string | null;
};

export async function createRecoveryAttempt(input: {
  phone: string;
  stage: RecoveryStage;
  selectedUserId?: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("UsernameRecoveryAttempt").insert({
    phone: input.phone,
    stage: input.stage,
    selectedUserId: input.selectedUserId ?? null
  }).select("*").single();
  if (error) throw error;
  return data as UsernameRecoveryAttempt;
}

export async function getRecoveryAttempt(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("UsernameRecoveryAttempt")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("This recovery request is no longer available. Please start again.");
  const attempt = data as UsernameRecoveryAttempt;
  if (attempt.completedAt || attempt.stage === "completed") {
    throw new Error("This recovery request has already been used. Please start again.");
  }
  if (new Date(attempt.expiresAt).getTime() <= Date.now()) {
    throw new Error("This recovery request has expired. Please start again.");
  }
  return attempt;
}

export async function updateRecoveryAttempt(
  id: string,
  values: Partial<Omit<UsernameRecoveryAttempt, "id" | "phone" | "expiresAt">>
) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("UsernameRecoveryAttempt")
    .update({ ...values, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as UsernameRecoveryAttempt;
}
