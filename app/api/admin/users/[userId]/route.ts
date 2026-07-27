import { NextResponse } from "next/server";
import { z } from "zod";
import { adminContext, auditAdminAction, countAdmins, safeUser } from "@/lib/admin/admin-server";
import { resolveAppRole } from "@/lib/auth/roles";

const actionSchema = z.object({
  action: z.enum(["send_recovery", "anonymize", "delete"]),
  reason: z.string().trim().min(4).max(500),
  confirmation: z.string().optional()
});

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { admin } = await adminContext();
    const { userId } = await context.params;
    const [{ data, error }, memberships, classes, audit, trust] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from("ClassMembership").select("id,classId,status,joinedAt").eq("studentId", userId),
      admin.from("TeacherClass").select("id,name,status,gradeLevel,createdAt").eq("teacherId", userId),
      admin.from("AdminAuditEvent").select("id,action,result,reason,createdAt,actorId").eq("targetId", userId).order("createdAt", { ascending: false }).limit(20),
      admin.from("TeacherTrustProfile")
        .select("status,cleanLessonCount,trustedAt,monitoringRemaining,updatedAt")
        .eq("teacherId", userId)
        .maybeSingle()
    ]);
    if (error || !data.user) throw error ?? new Error("Account not found.");
    return NextResponse.json({
      user: safeUser(data.user),
      memberships: memberships.data ?? [],
      classes: classes.data ?? [],
      audit: audit.data ?? [],
      trust: trust.data ?? null
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load account." }, { status: 404 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { actor, admin, requestId } = await adminContext();
    const { userId } = await context.params;
    const input = actionSchema.parse(await request.json());
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user) throw error ?? new Error("Account not found.");
    const user = data.user;

    if (input.action === "send_recovery") {
      if (!user.email) throw new Error("This account has no email address. Use the existing phone recovery flow.");
      const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(user.email, { data: user.user_metadata });
      if (inviteError) throw inviteError;
    } else {
      if (actor.id === userId) throw new Error("You cannot anonymize or delete your own account.");
      if (resolveAppRole(user.app_metadata?.role) === "admin" && await countAdmins() <= 1) {
        throw new Error("The final administrator cannot be removed.");
      }
      if (input.confirmation !== "DELETE") throw new Error('Type "DELETE" to confirm this action.');
      if (input.action === "anonymize") {
        const anonymous = `deleted-${user.id.slice(0, 8)}@anonymous.invalid`;
        const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
          email: anonymous, phone: "", ban_duration: "876000h",
          user_metadata: { display_name: "Deleted user", anonymized_at: new Date().toISOString() }
        });
        if (updateError) throw updateError;
      } else {
        const { error: deleteError } = await admin.auth.admin.deleteUser(userId, true);
        if (deleteError) throw deleteError;
      }
    }
    await auditAdminAction({
      actorId: actor.id, action: `user.${input.action}`, targetType: "user", targetId: userId,
      reason: input.reason, before: { role: resolveAppRole(user.app_metadata?.role) }, requestId
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Administrative action failed." }, { status: 400 });
  }
}
