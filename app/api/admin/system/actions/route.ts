import { NextResponse } from "next/server";
import { z } from "zod";
import { adminContext, auditAdminAction } from "@/lib/admin/admin-server";

const alertSchema = z.object({
  action: z.enum(["acknowledge_alert", "resolve_alert"]),
  alertId: z.string().uuid(),
  reason: z.string().trim().min(4).max(1000)
});
const assignmentSchema = z.object({
  action: z.literal("assign_admin_role"),
  userId: z.string().uuid(),
  adminRole: z.enum([
    "super_admin", "security_admin", "system_operator", "support_agent",
    "content_moderator", "curriculum_manager", "billing_operator",
    "privacy_officer", "read_only_auditor"
  ]),
  reason: z.string().trim().min(4).max(1000)
});

export async function POST(request: Request) {
  try {
    const { actor, admin, requestId } = await adminContext();
    const raw = await request.json();
    if (raw?.action === "assign_admin_role") {
      const input = assignmentSchema.parse(raw);
      const [{ data: target }, { data: assignments }] = await Promise.all([
        admin.auth.admin.getUserById(input.userId),
        admin.from("AdminRoleAssignment").select("userId,adminRole")
      ]);
      if (!target.user || target.user.app_metadata?.role !== "admin") throw new Error("Scoped roles can only be assigned to platform administrators.");
      const actorAssignment = assignments?.find((item) => item.userId === actor.id);
      if ((assignments?.length ?? 0) > 0 && actorAssignment?.adminRole !== "super_admin") {
        throw new Error("Only a super administrator can assign scoped administrator roles.");
      }
      const { data: before } = await admin.from("AdminRoleAssignment").select("*").eq("userId", input.userId).maybeSingle();
      const { data, error } = await admin.from("AdminRoleAssignment").upsert({
        userId: input.userId,
        adminRole: input.adminRole,
        assignedBy: actor.id,
        updatedAt: new Date().toISOString()
      }, { onConflict: "userId" }).select("*").single();
      if (error) throw error;
      await auditAdminAction({
        actorId: actor.id, action: "admin_scope.assigned", targetType: "user", targetId: input.userId,
        reason: input.reason, before, after: data, requestId
      });
      return NextResponse.json({ assignment: data });
    }
    const input = alertSchema.parse(raw);
    const { data: before, error: readError } = await admin.from("AdminAlert").select("*").eq("id", input.alertId).single();
    if (readError) throw readError;
    const now = new Date().toISOString();
    const update = input.action === "acknowledge_alert"
      ? { status: "acknowledged", ownerId: actor.id, acknowledgedAt: now }
      : { status: "resolved", ownerId: actor.id, resolvedAt: now, resolutionNote: input.reason };
    const { data, error } = await admin.from("AdminAlert").update(update).eq("id", input.alertId).select("*").single();
    if (error) throw error;
    await auditAdminAction({
      actorId: actor.id,
      action: input.action.replace("_", "."),
      targetType: "alert",
      targetId: input.alertId,
      reason: input.reason,
      before,
      after: data,
      requestId
    });
    return NextResponse.json({ alert: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update alert." }, { status: 400 });
  }
}
