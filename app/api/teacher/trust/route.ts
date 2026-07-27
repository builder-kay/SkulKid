import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTeacherTrustSummary } from "@/lib/moderation/teacher-content-server";

const appealSchema = z.object({
  caseId: z.string().uuid(),
  message: z.string().trim().min(20).max(2000)
});

export async function GET() {
  try {
    const teacher = await requireTeacher();
    return NextResponse.json(await getTeacherTrustSummary(teacher.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load content trust." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const teacher = await requireTeacher();
    const input = appealSchema.parse(await request.json());
    const admin = createAdminClient();
    const { data: moderationCase, error } = await admin.from("ContentModerationCase")
      .select("id,status")
      .eq("id", input.caseId)
      .eq("teacherId", teacher.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!moderationCase || moderationCase.status !== "rejected") {
      throw new Error("Only a rejected content decision can be appealed.");
    }
    const { error: insertError } = await admin.from("ModerationAppeal").insert({
      teacherId: teacher.id,
      caseId: input.caseId,
      kind: "content",
      message: input.message,
      authMethod: "session"
    });
    if (insertError) {
      if (insertError.code === "23505") throw new Error("An appeal for this decision is already waiting for review.");
      throw new Error(insertError.message);
    }
    return NextResponse.json({ ok: true, message: "Your appeal was sent to the administrator." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not submit the appeal." }, { status: 400 });
  }
}
