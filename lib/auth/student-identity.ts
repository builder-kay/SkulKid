import "server-only";
import type { User } from "@supabase/supabase-js";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { phoneIdentityEmail } from "@/lib/auth/supabase-phone-user";
import {
  MAX_STUDENTS_PER_GUARDIAN_PHONE,
  normalizeUsername,
  usernameIdentityEmail,
  type PhoneOwner
} from "@/lib/auth/username";

export {
  MAX_STUDENTS_PER_GUARDIAN_PHONE,
  normalizeUsername,
  usernameIdentityEmail,
  type PhoneOwner
} from "@/lib/auth/username";
export { slugUsernameFromDisplayName } from "@/lib/auth/username";

function userRole(user: User) {
  return String(user.app_metadata?.role ?? user.user_metadata?.account_type ?? "");
}

function userPhoneE164(user: User) {
  const candidates = [user.user_metadata?.phone_e164, user.user_metadata?.phone, user.phone];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    try {
      return normalizeGhanaPhone(candidate);
    } catch {
      /* ignore */
    }
  }
  if (user.email?.toLowerCase().endsWith("@phone.skulkid.app")) {
    const digits = user.email.slice(3, user.email.indexOf("@"));
    if (/^233\d{9}$/.test(digits)) return `+${digits}`;
  }
  return null;
}

export function sameUsername(user: User, username: string) {
  const normalized = normalizeUsername(username);
  const meta = typeof user.user_metadata?.username === "string" ? user.user_metadata.username.toLowerCase() : "";
  return meta === normalized || user.email?.toLowerCase() === usernameIdentityEmail(normalized);
}

async function listAuthUsers() {
  const admin = createAdminClient();
  const users: User[] = [];
  for (let page = 1; page <= 40; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 100) break;
  }
  return users;
}

export async function findSupabaseUserByUsername(usernameInput: string) {
  const username = normalizeUsername(usernameInput);
  const users = await listAuthUsers();
  return users.find((user) => sameUsername(user, username)) ?? null;
}

export async function listStudentsByPhone(phoneInput: string) {
  const phone = normalizeGhanaPhone(phoneInput);
  const users = await listAuthUsers();
  return users.filter((user) => userRole(user) === "student" && userPhoneE164(user) === phone);
}

export async function countStudentsByPhone(phoneInput: string) {
  return (await listStudentsByPhone(phoneInput)).length;
}

export async function findTeacherByPhone(phoneInput: string) {
  const phone = normalizeGhanaPhone(phoneInput);
  const users = await listAuthUsers();
  return users.find((user) => userRole(user) === "teacher" && (
    userPhoneE164(user) === phone || user.email?.toLowerCase() === phoneIdentityEmail(phone)
  )) ?? null;
}

/** Personal phones must be free of any student/teacher account. */
export async function assertStudentPhoneAvailable(phoneInput: string, phoneOwner: PhoneOwner) {
  const phone = normalizeGhanaPhone(phoneInput);
  const teacher = await findTeacherByPhone(phone);
  if (teacher) {
    throw new Error("This phone number is already used by a teacher account. Please use a different number.");
  }

  const students = await listStudentsByPhone(phone);
  if (phoneOwner === "self") {
    if (students.length > 0) {
      throw new Error("This phone number already has a learner account. Sign in with your username, or use a guardian number.");
    }
    return;
  }

  const personalLock = students.some((user) => user.user_metadata?.phone_owner !== "guardian");
  if (personalLock) {
    throw new Error("This number is already registered as someone's personal phone. Ask them to use a different guardian number.");
  }
  if (students.length >= MAX_STUDENTS_PER_GUARDIAN_PHONE) {
    throw new Error(`This guardian phone already has ${MAX_STUDENTS_PER_GUARDIAN_PHONE} learner accounts. Use another number.`);
  }
}

export async function ensureUsernameLoginIdentity(user: User, usernameInput: string) {
  const username = normalizeUsername(usernameInput);
  const email = usernameIdentityEmail(username);
  if (user.email?.toLowerCase() === email && sameUsername(user, username)) return user;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    email,
    email_confirm: true,
    user_metadata: {
      ...user.user_metadata,
      username,
      phone_owner: user.user_metadata?.phone_owner === "guardian" ? "guardian" : "self"
    }
  });
  if (error) throw error;
  return data.user;
}
