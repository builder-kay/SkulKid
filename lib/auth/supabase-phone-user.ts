import "server-only";
import type { User } from "@supabase/supabase-js";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { createAdminClient } from "@/lib/supabase/admin";

export function phoneIdentityEmail(phone: string) {
  const canonical = normalizeGhanaPhone(phone);
  return `gh-${canonical.slice(1)}@phone.skulkid.app`;
}

function samePhone(user: User, phone: string) {
  const candidates = [user.phone, user.user_metadata?.phone_e164, user.user_metadata?.phone];
  return candidates.some((candidate) => {
    if (typeof candidate !== "string") return false;
    try { return normalizeGhanaPhone(candidate) === phone; } catch { return false; }
  }) || user.email?.toLowerCase() === phoneIdentityEmail(phone);
}

export async function findSupabaseUserByPhone(phoneInput: string) {
  const phone = normalizeGhanaPhone(phoneInput);
  const admin = createAdminClient();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const user = data.users.find((candidate) => samePhone(candidate, phone));
    if (user) return user;
    if (data.users.length < 100) break;
  }
  return null;
}

export async function ensurePhoneLoginIdentity(user: User, phoneInput: string) {
  const phone = normalizeGhanaPhone(phoneInput);
  const email = phoneIdentityEmail(phone);
  if (user.email?.toLowerCase() === email && user.user_metadata?.phone_e164 === phone) return user;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    email,
    email_confirm: true,
    user_metadata: { ...user.user_metadata, phone_e164: phone }
  });
  if (error) throw error;
  return data.user;
}
