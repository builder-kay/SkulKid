import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/classes/classroom-server";
import { resolveAppRole, type AppRole } from "@/lib/auth/roles";

export type AdminAccountStatus = "active" | "suspended";

export function safeUser(user: {
  id: string;
  phone?: string | null;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
}) {
  const metadata = user.user_metadata ?? {};
  const role = resolveAppRole(user.app_metadata?.role);
  return {
    id: user.id,
    phone: user.phone ?? null,
    email: user.email ?? null,
    displayName: typeof metadata.display_name === "string" && metadata.display_name.trim()
      ? metadata.display_name.trim()
      : user.phone || user.email || "SkulKid user",
    role,
    status: user.banned_until && Date.parse(user.banned_until) > Date.now() ? "suspended" as const : "active" as const,
    createdAt: user.created_at,
    updatedAt: user.updated_at ?? user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    grade: typeof metadata.grade === "number" ? metadata.grade : null,
    school: typeof metadata.school === "string" ? metadata.school : ""
  };
}

export async function listAllAuthUsers() {
  const admin = createAdminClient();
  const users = [];
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    users.push(...(data.users ?? []));
    if ((data.users?.length ?? 0) < 200) break;
  }
  return users;
}

export async function countAdmins() {
  return (await listAllAuthUsers()).filter((user) => resolveAppRole(user.app_metadata?.role) === "admin").length;
}

export async function assertSafeRoleChange(actorId: string, targetId: string, nextRole: AppRole) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(targetId);
  if (error || !data.user) throw error ?? new Error("Account not found.");
  const currentRole = resolveAppRole(data.user.app_metadata?.role);
  if (actorId === targetId && nextRole !== "admin") throw new Error("You cannot remove your own administrator access.");
  if (currentRole === "admin" && nextRole !== "admin" && await countAdmins() <= 1) {
    throw new Error("The final administrator cannot be demoted.");
  }
  return { user: data.user, currentRole };
}

function redact(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(Object.entries(source).filter(([key]) =>
    !["password", "token", "access_token", "refresh_token"].includes(key.toLowerCase())
  ));
}

export async function auditAdminAction(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  reason?: string;
  before?: unknown;
  after?: unknown;
  result?: "success" | "failure";
  requestId?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("AdminAuditEvent").insert({
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    reason: input.reason?.trim() || null,
    before: redact(input.before),
    after: redact(input.after),
    result: input.result ?? "success",
    requestId: input.requestId ?? randomUUID()
  });
  if (error) throw new Error(`Administrative action succeeded but audit logging failed: ${error.message}`);
}

export async function adminContext() {
  const actor = await requireAdmin();
  return { actor, admin: createAdminClient(), requestId: randomUUID() };
}
