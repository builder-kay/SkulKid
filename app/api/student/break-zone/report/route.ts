import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/), reason: z.enum(["sexual","violence","bullying","hate","self_harm","dangerous","frightening","misinformation","personal_information","other"]), details: z.string().trim().max(500).default("") });
export async function POST(request: Request) {
  try {
    const student = await requireStudent(); const input = schema.parse(await request.json()); const admin = createAdminClient();
    const { error } = await admin.from("BreakZoneReport").insert({ ...input, studentId: student.id });
    if (error) throw new Error(error.message);
    await Promise.all([
      admin.from("BreakZoneVideo").update({ moderationStatus: "suspended", updatedAt: new Date().toISOString() }).eq("id", input.videoId),
      admin.from("BreakZoneAudit").insert({ videoId: input.videoId, actorId: student.id, action: "student_report_global_suspension", metadata: { reason: input.reason } })
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not report video." }, { status: 400 }); }
}
