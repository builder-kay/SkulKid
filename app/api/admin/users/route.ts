import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAppRole, type AppRole } from "@/lib/auth/roles";
import {
  adminContext,
  assertSafeRoleChange,
  auditAdminAction,
  listAllAuthUsers,
  safeUser
} from "@/lib/admin/admin-server";
import { unbanTeacherAfterAppeal } from "@/lib/moderation/admin-moderation-actions";

const roleSchema = z.enum(["student", "teacher", "admin"]);
const createSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  role: roleSchema,
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().min(7).max(24).optional().or(z.literal("")),
  grade: z.number().int().min(1).max(12).optional(),
  school: z.string().trim().max(120).optional(),
  reason: z.string().trim().min(4).max(500)
}).refine((value) => Boolean(value.email || value.phone), "An email address or phone number is required.");

const updateSchema = z.object({
  userId: z.string().uuid(),
  role: roleSchema.optional(),
  displayName: z.string().trim().min(2).max(100).optional(),
  grade: z.number().int().min(1).max(12).nullable().optional(),
  school: z.string().trim().max(120).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  trustStatus: z.enum(["probation", "content_trusted", "legacy_trusted", "monitored"]).optional(),
  reason: z.string().trim().min(4).max(500)
});

export async function GET(request: Request) {
  try {
    await adminContext();
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const perPage = Math.min(100, Math.max(10, Number(url.searchParams.get("perPage") || 25)));
    const query = (url.searchParams.get("q") || "").trim().toLowerCase();
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    const sort = url.searchParams.get("sort") || "created_desc";

    let users = (await listAllAuthUsers()).map(safeUser).filter((user) => {
      const matchesQuery = !query || `${user.displayName} ${user.phone ?? ""} ${user.email ?? ""} ${user.id}`.toLowerCase().includes(query);
      return matchesQuery
        && (!role || role === "all" || user.role === role)
        && (!status || status === "all" || user.status === status);
    });
    users = users.sort((a, b) => {
      if (sort === "name_asc") return a.displayName.localeCompare(b.displayName);
      if (sort === "last_sign_in_desc") return Date.parse(b.lastSignInAt ?? "0") - Date.parse(a.lastSignInAt ?? "0");
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });

    const allUsers = (await listAllAuthUsers()).map(safeUser);
    const counts = {
      all: allUsers.length,
      student: allUsers.filter((user) => user.role === "student").length,
      teacher: allUsers.filter((user) => user.role === "teacher").length,
      admin: allUsers.filter((user) => user.role === "admin").length,
      suspended: allUsers.filter((user) => user.status === "suspended").length
    };
    const start = (page - 1) * perPage;
    return NextResponse.json({
      users: users.slice(start, start + perPage),
      counts,
      pagination: { page, perPage, total: users.length, pages: Math.max(1, Math.ceil(users.length / perPage)) }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, admin, requestId } = await adminContext();
    const input = createSchema.parse(await request.json());
    const metadata = { display_name: input.displayName, grade: input.grade, school: input.school ?? "" };
    const attributes = {
      email: input.email || undefined,
      phone: input.phone || undefined,
      email_confirm: false,
      phone_confirm: false,
      app_metadata: { role: input.role },
      user_metadata: metadata
    };
    const { data, error } = input.email
      ? await admin.auth.admin.inviteUserByEmail(input.email, { data: metadata })
      : await admin.auth.admin.createUser(attributes);
    if (error || !data.user) throw error ?? new Error("Account could not be created.");
    if (input.email && input.role !== "student") {
      const { error: roleError } = await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { role: input.role } });
      if (roleError) throw roleError;
    }
    await auditAdminAction({
      actorId: actor.id, action: "user.created", targetType: "user", targetId: data.user.id,
      reason: input.reason, after: { role: input.role, displayName: input.displayName }, requestId
    });
    return NextResponse.json({ user: safeUser(data.user) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 400 : 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { actor, admin, requestId } = await adminContext();
    const input = updateSchema.parse(await request.json());
    const { user, currentRole } = input.role
      ? await assertSafeRoleChange(actor.id, input.userId, input.role)
      : await admin.auth.admin.getUserById(input.userId).then(({ data, error }) => {
        if (error || !data.user) throw error ?? new Error("Account not found.");
        return { user: data.user, currentRole: resolveAppRole(data.user.app_metadata?.role) };
      });
    if (actor.id === input.userId && input.status === "suspended") throw new Error("You cannot suspend your own account.");
    if (input.trustStatus && currentRole !== "teacher") throw new Error("Content trust controls apply only to teacher accounts.");

    const { data: currentTrust, error: trustReadError } = currentRole === "teacher"
      ? await admin.from("TeacherTrustProfile").select("status").eq("teacherId", input.userId).maybeSingle()
      : { data: null, error: null };
    if (trustReadError) throw new Error(trustReadError.message);
    if (input.status === "active" && currentTrust?.status === "banned") {
      await unbanTeacherAfterAppeal({ teacherId: input.userId, actorId: actor.id });
    }

    const userMetadata = {
      ...(user.user_metadata ?? {}),
      ...(input.displayName ? { display_name: input.displayName } : {}),
      ...(input.grade !== undefined ? { grade: input.grade } : {}),
      ...(input.school !== undefined ? { school: input.school } : {})
    };
    const { data, error } = await admin.auth.admin.updateUserById(input.userId, {
      ...(input.role ? { app_metadata: { ...(user.app_metadata ?? {}), role: input.role as AppRole } } : {}),
      ...(input.displayName || input.grade !== undefined || input.school !== undefined ? { user_metadata: userMetadata } : {}),
      ...(input.status ? { ban_duration: input.status === "suspended" ? "876000h" : "none" } : {})
    });
    if (error || !data.user) throw error ?? new Error("Account update failed.");
    if (input.trustStatus) {
      const now = new Date().toISOString();
      const { error: trustError } = await admin.from("TeacherTrustProfile").upsert({
        teacherId: input.userId,
        status: input.trustStatus,
        monitoringRemaining: input.trustStatus === "monitored" ? 10 : 0,
        ...(input.trustStatus === "content_trusted" || input.trustStatus === "legacy_trusted"
          ? { trustedAt: now }
          : {}),
        updatedAt: now
      }, { onConflict: "teacherId" });
      if (trustError) throw new Error(trustError.message);
    }
    await auditAdminAction({
      actorId: actor.id,
      action: input.trustStatus ? "teacher_trust.updated" : input.status ? `user.${input.status}` : "user.updated",
      targetType: "user", targetId: input.userId, reason: input.reason,
      before: { role: currentRole, status: safeUser(user).status, trustStatus: currentTrust?.status ?? null },
      after: {
        role: input.role ?? currentRole,
        status: safeUser(data.user).status,
        trustStatus: input.trustStatus ?? currentTrust?.status ?? null
      },
      requestId
    });
    return NextResponse.json({ user: safeUser(data.user) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
