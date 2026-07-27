import { NextResponse } from "next/server";
import { z } from "zod";
import { adminContext, auditAdminAction } from "@/lib/admin/admin-server";
import { adminResponsibilities } from "@/lib/admin/operations";

const incidentSchema = z.object({
  title: z.string().trim().min(4).max(160),
  summary: z.string().trim().max(2000).default(""),
  severity: z.enum(["low", "medium", "high", "critical"]),
  affectedService: z.string().trim().min(2).max(120),
  reason: z.string().trim().min(4).max(500)
});

export async function GET() {
  const started = performance.now();
  try {
    const { admin } = await adminContext();
    const [databaseCheck, incidents, services, maintenance] = await Promise.all([
      admin.from("AdminDashboardSetting").select("key", { count: "exact", head: true }),
      admin.from("AdminIncident").select("*").order("updatedAt", { ascending: false }).limit(50),
      admin.from("AdminServiceInventory").select("*").order("category").order("name"),
      admin.from("AdminMaintenanceWindow").select("*").order("startsAt", { ascending: false }).limit(20)
    ]);
    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      health: [
        { name: "Application API", status: "operational", detail: "Admin API responded", latencyMs: Math.round(performance.now() - started) },
        { name: "Database", status: databaseCheck.error ? "degraded" : "operational", detail: databaseCheck.error?.message ?? "Query completed", latencyMs: Math.round(performance.now() - started) },
        { name: "Authentication", status: "operational", detail: "Authenticated admin session verified" },
        { name: "Backups", status: process.env.ADMIN_BACKUP_STATUS_URL ? "configured" : "not_configured", detail: process.env.ADMIN_BACKUP_STATUS_URL ? "Provider adapter configured" : "No provider adapter configured" },
        { name: "Hosting monitoring", status: process.env.ADMIN_HOSTING_STATUS_URL ? "configured" : "not_configured", detail: process.env.ADMIN_HOSTING_STATUS_URL ? "Provider adapter configured" : "No provider adapter configured" }
      ],
      incidents: incidents.data ?? [],
      services: services.data ?? [],
      maintenance: maintenance.data ?? [],
      responsibilities: adminResponsibilities
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load operations." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, admin, requestId } = await adminContext();
    const body = await request.json();
    if (body?.action === "run_backup") {
      const reason = z.string().trim().min(4).max(500).parse(body.reason);
      const endpoint = process.env.ADMIN_BACKUP_TRIGGER_URL;
      if (!endpoint) throw new Error("Backup provider integration is not configured.");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.ADMIN_BACKUP_PROVIDER_TOKEN ? { Authorization: `Bearer ${process.env.ADMIN_BACKUP_PROVIDER_TOKEN}` } : {})
        },
        body: JSON.stringify({ requestedBy: actor.id, requestId }),
        signal: AbortSignal.timeout(15_000)
      });
      if (!response.ok) throw new Error(`Backup provider returned ${response.status}.`);
      await auditAdminAction({
        actorId: actor.id, action: "backup.triggered", targetType: "backup",
        reason, after: { providerAccepted: true }, requestId
      });
      return NextResponse.json({ ok: true, message: "Backup request accepted by the configured provider." });
    }
    const input = incidentSchema.parse(body);
    const { data, error } = await admin.from("AdminIncident").insert({
      title: input.title, summary: input.summary, severity: input.severity,
      affectedService: input.affectedService, openedBy: actor.id
    }).select("*").single();
    if (error) throw error;
    await auditAdminAction({
      actorId: actor.id, action: "incident.created", targetType: "incident", targetId: data.id,
      reason: input.reason, after: data, requestId
    });
    return NextResponse.json({ incident: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create incident." }, { status: 400 });
  }
}

const incidentUpdateSchema = z.object({
  incidentId: z.string().uuid(),
  status: z.enum(["open", "monitoring", "resolved"]),
  summary: z.string().trim().max(2000).optional(),
  reason: z.string().trim().min(4).max(500)
});

export async function PATCH(request: Request) {
  try {
    const { actor, admin, requestId } = await adminContext();
    const input = incidentUpdateSchema.parse(await request.json());
    const { data: before, error: readError } = await admin.from("AdminIncident").select("*").eq("id", input.incidentId).single();
    if (readError) throw readError;
    const update = {
      status: input.status,
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      updatedAt: new Date().toISOString(),
      ...(input.status === "resolved" ? { resolvedAt: new Date().toISOString(), resolvedBy: actor.id } : { resolvedAt: null, resolvedBy: null })
    };
    const { data, error } = await admin.from("AdminIncident").update(update).eq("id", input.incidentId).select("*").single();
    if (error) throw error;
    await auditAdminAction({
      actorId: actor.id, action: `incident.${input.status}`, targetType: "incident", targetId: input.incidentId,
      reason: input.reason, before, after: data, requestId
    });
    return NextResponse.json({ incident: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update incident." }, { status: 400 });
  }
}
