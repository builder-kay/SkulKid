import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireAdmin(); const admin = createAdminClient();
    const { data, error } = await admin.from("ChildSafetyCase").select("*").order("createdAt", { ascending: false }).limit(300);
    if (error) throw new Error(error.message);
    return NextResponse.json({ cases: data ?? [] });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load safety cases." }, { status: 400 }); }
}
const schema = z.object({ caseId: z.string().uuid(), status: z.enum(["reviewing", "resolved", "dismissed"]), resolutionNote: z.string().trim().min(3).max(1000) });
export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin(); const input = schema.parse(await request.json()); const admin = createAdminClient(); const now = new Date().toISOString();
    const { error } = await admin.from("ChildSafetyCase").update({ status: input.status, ownerId: actor.id, acknowledgedAt: now, resolvedAt: ["resolved", "dismissed"].includes(input.status) ? now : null, resolutionNote: input.resolutionNote }).eq("id", input.caseId);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update safety case." }, { status: 400 }); }
}
