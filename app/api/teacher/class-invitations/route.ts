import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { listTeacherInvitations, respondToClassInvitation } from "@/lib/classes/class-team-server";

const responseSchema = z.object({
  assignmentId: z.string().uuid(),
  response: z.enum(["accepted", "declined"])
});

export async function GET() {
  try {
    const teacher = await requireTeacher();
    return NextResponse.json({ invitations: await listTeacherInvitations(teacher.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load invitations." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const teacher = await requireTeacher();
    const input = responseSchema.parse(await request.json());
    await respondToClassInvitation({ teacherId: teacher.id, ...input });
    return NextResponse.json({
      ok: true,
      invitations: await listTeacherInvitations(teacher.id)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to respond to this invitation." }, { status: 400 });
  }
}
