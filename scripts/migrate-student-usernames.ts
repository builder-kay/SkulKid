/**
 * Migrates legacy student accounts from phone-based auth emails
 * (gh-…@phone.skulkid.app) to username identity emails
 * (u-…@users.skulkid.app).
 *
 * Usage: npx tsx scripts/migrate-student-usernames.ts
 * Requires SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL in env.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function slugUsernameFromDisplayName(displayName: string) {
  const base = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 16) || "learner";
  return base;
}

function isPhoneIdentityEmail(email: string | undefined) {
  return Boolean(email?.toLowerCase().endsWith("@phone.skulkid.app"));
}

async function listUsers() {
  const users = [];
  for (let page = 1; page <= 40; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 100) break;
  }
  return users;
}

async function main() {
  const users = await listUsers();
  const taken = new Set(
    users
      .map((user) => String(user.user_metadata?.username ?? "").toLowerCase())
      .filter(Boolean)
  );

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    const role = String(user.app_metadata?.role ?? user.user_metadata?.account_type ?? "");
    if (role !== "student") {
      skipped += 1;
      continue;
    }
    if (!isPhoneIdentityEmail(user.email) && user.user_metadata?.username) {
      skipped += 1;
      continue;
    }

    const displayName = String(user.user_metadata?.display_name ?? user.user_metadata?.displayName ?? "learner");
    let base = slugUsernameFromDisplayName(displayName);
    if (base.length < 3) base = "learner";
    let username = base;
    let suffix = 1;
    while (taken.has(username)) {
      const next = `${base.slice(0, 16)}_${suffix}`;
      username = next.slice(0, 20);
      suffix += 1;
    }
    taken.add(username);

    const phone =
      typeof user.user_metadata?.phone_e164 === "string"
        ? user.user_metadata.phone_e164
        : user.email?.startsWith("gh-")
          ? `+${user.email.slice(3, user.email.indexOf("@"))}`
          : undefined;

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email: `u-${username}@users.skulkid.app`,
      email_confirm: true,
      user_metadata: {
        ...user.user_metadata,
        username,
        phone_e164: phone,
        phone_owner: "self",
        username_migrated_from_phone: true
      }
    });
    if (error) {
      console.error(`Failed ${user.id}:`, error.message);
      continue;
    }
    migrated += 1;
    console.log(`Migrated ${user.id} → @${username}`);
  }

  console.log(`Done. Migrated ${migrated}, skipped ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
