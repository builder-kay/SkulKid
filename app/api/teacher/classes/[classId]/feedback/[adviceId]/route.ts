import { NextResponse } from "next/server";
import { z } from "zod";
import { getTeacherClassAccess, requireTeacher } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ resolutionNote: z.string().trim().min(3).max(600) });

export async function PATCH(request: Request, context: { params: Promise<{ classId: string; adviceId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId, adviceId } = await context.params;
    const input = schema.parse(await request.json());
    await getTeacherClassAccess(teacher.id, classId);
    const admin = createAdminClient();
    const { data, error } = await admin.from("ClassAdvice").update({
      followUpStatus: "resolved", resolvedAt: new Date().toISOString(), resolutionNote: input.resolutionNote
    }).eq("id", adviceId).eq("classId", classId).eq("teacherId", teacher.id).in("followUpStatus", ["open", "acknowledged"]).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ error: "This intervention cannot be resolved." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to resolve feedback." }, { status: 400 });
  }
}
