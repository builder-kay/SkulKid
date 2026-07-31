import "server-only";
import type { User } from "@supabase/supabase-js";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { phoneIdentityEmail } from "@/lib/auth/supabase-phone-user";
import {
  MAX_STUDENTS_PER_PHONE,
  normalizeUsername,
  usernameIdentityEmail,
  type PhoneOwner
} from "@/lib/auth/username";

export {
  MAX_STUDENTS_PER_PHONE,
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
  for (let page = 1; ; page += 1) {
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

export async function findTeacherByUsernameOrName(queryInput: string) {
  const query = queryInput.trim();
  if (query.length < 3) throw new Error("Enter at least three characters.");
  const users = (await listAuthUsers()).filter((user) => userRole(user) === "teacher");
  let usernameMatch: User | undefined;
  try {
    usernameMatch = users.find((user) => sameUsername(user, query));
  } catch {
    // Names may contain spaces and punctuation, so they are not valid usernames.
  }
  if (usernameMatch) return usernameMatch;

  const normalizedName = query.toLocaleLowerCase().replace(/\s+/g, " ");
  const nameMatches = users.filter((user) => {
    const metadata = user.user_metadata ?? {};
    const candidates = [metadata.display_name, metadata.full_name, metadata.name];
    return candidates.some((value) =>
      typeof value === "string"
      && value.trim().toLocaleLowerCase().replace(/\s+/g, " ") === normalizedName
    );
  });
  if (nameMatches.length > 1) {
    throw new Error("More than one teacher uses that name. Ask the teacher for their exact username.");
  }
  return nameMatches[0] ?? null;
}

export type SchoolTeacherSearchResult = {
  id: string;
  displayName: string;
  username: string;
};

export async function searchTeachersAtSchool(input: {
  school: string;
  query: string;
  excludeUserId?: string;
  limit?: number;
}): Promise<SchoolTeacherSearchResult[]> {
  const school = input.school.trim().toLocaleLowerCase().replace(/\s+/g, " ");
  const query = input.query.trim().toLocaleLowerCase().replace(/\s+/g, " ");
  if (school.length < 2 || query.length < 2) return [];
  const limit = Math.min(Math.max(input.limit ?? 8, 1), 10);
  return (await listAuthUsers())
    .filter((user) => {
      if (user.id === input.excludeUserId || userRole(user) !== "teacher") return false;
      const metadata = user.user_metadata ?? {};
      const userSchool = typeof metadata.school === "string"
        ? metadata.school.trim().toLocaleLowerCase().replace(/\s+/g, " ")
        : "";
      if (userSchool !== school) return false;
      const displayName = typeof metadata.display_name === "string" ? metadata.display_name : "";
      const username = typeof metadata.username === "string" ? metadata.username : "";
      return displayName.toLocaleLowerCase().includes(query) || username.toLocaleLowerCase().includes(query);
    })
    .slice(0, limit)
    .map((user) => ({
      id: user.id,
      displayName: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "Teacher",
      username: typeof user.user_metadata?.username === "string" ? user.user_metadata.username : ""
    }))
    .filter((teacher) => teacher.username);
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

/**
 * Learner phones may be shared (siblings / guardian / teacher’s own number).
 * Usernames remain the login identity. Teacher accounts on the same number are allowed.
 */
export async function assertStudentPhoneAvailable(phoneInput: string, _phoneOwner: PhoneOwner) {
  const phone = normalizeGhanaPhone(phoneInput);
  const students = await listStudentsByPhone(phone);
  if (students.length >= MAX_STUDENTS_PER_PHONE) {
    throw new Error(`This phone number already has ${MAX_STUDENTS_PER_PHONE} learner accounts. Please use another number.`);
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
