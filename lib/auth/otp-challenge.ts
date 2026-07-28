import "server-only";
import { createHash, randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const expiryMinutes = 10;

function hashCode(phone: string, code: string) {
  const secret = process.env.OTP_HMAC_SECRET || process.env.PHONE_BLOCKLIST_HMAC_SECRET;
  if (!secret) throw new Error("OTP_HMAC_SECRET is not configured.");
  return createHash("sha256").update(`${secret}:${phone}:${code}`).digest("hex");
}

export async function createFallbackOtp(phone: string) {
  const code = randomInt(100_000, 1_000_000).toString();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60_000).toISOString();
  const { error } = await createAdminClient()
    .from("OtpChallenge")
    .upsert({
      phone,
      codeHash: hashCode(phone, code),
      attempts: 0,
      expiresAt,
      updatedAt: new Date().toISOString()
    }, { onConflict: "phone" });
  if (error) throw new Error(`Could not create the fallback verification code: ${error.message}`);
  return code;
}

export async function verifyFallbackOtp(phone: string, code: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("OtpChallenge")
    .select("codeHash, attempts, expiresAt")
    .eq("phone", phone)
    .maybeSingle();
  if (error || !data || data.attempts >= 5 || new Date(data.expiresAt).getTime() <= Date.now()) return false;

  await admin.from("OtpChallenge").update({
    attempts: data.attempts + 1,
    updatedAt: new Date().toISOString()
  }).eq("phone", phone);

  if (data.codeHash !== hashCode(phone, code)) return false;
  await admin.from("OtpChallenge").delete().eq("phone", phone);
  return true;
}
