import "server-only";

import { createHmac } from "node:crypto";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { withTimeout } from "@/lib/server/with-timeout";
import { createAdminClient } from "@/lib/supabase/admin";

function secret() {
  const value = process.env.PHONE_BLOCKLIST_HMAC_SECRET;
  if (!value) throw new Error("PHONE_BLOCKLIST_HMAC_SECRET is not configured.");
  return value;
}

export function teacherPhoneHash(phoneInput: string) {
  const phone = normalizeGhanaPhone(phoneInput);
  return createHmac("sha256", secret()).update(phone).digest("hex");
}

export async function isTeacherPhoneBanned(phoneInput: string) {
  const admin = createAdminClient();
  const { data, error } = await withTimeout(
    admin
      .from("TeacherPhoneBan")
      .select("id")
      .eq("phoneHash", teacherPhoneHash(phoneInput))
      .eq("active", true)
      .maybeSingle(),
    6_000,
    "The teacher safety check took too long. Please try again."
  );
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function assertTeacherPhoneNotBanned(phoneInput: string) {
  if (await isTeacherPhoneBanned(phoneInput)) {
    throw new Error("This phone number cannot be used to create a teacher account. You may submit an appeal if you believe this is a mistake.");
  }
}
