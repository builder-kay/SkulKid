export const MAX_STUDENTS_PER_GUARDIAN_PHONE = 5;
export type PhoneOwner = "self" | "guardian";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "skulkid",
  "teacher",
  "student",
  "support",
  "help",
  "root",
  "system",
  "null",
  "undefined"
]);

export function normalizeUsername(input: string) {
  const username = input.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) {
    throw new Error("Username must be 3–20 characters using letters, numbers or underscores.");
  }
  if (RESERVED_USERNAMES.has(username)) {
    throw new Error("That username is reserved. Please choose another.");
  }
  return username;
}

export function usernameIdentityEmail(username: string) {
  return `u-${normalizeUsername(username)}@users.skulkid.app`;
}

export function slugUsernameFromDisplayName(displayName: string) {
  const base = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 16) || "learner";
  return base;
}
