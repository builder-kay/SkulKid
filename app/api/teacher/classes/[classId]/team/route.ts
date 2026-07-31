import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import {
  inviteSubjectTeacher,
  listClassTeachingTeam,
  revokeClassTeacher,
  updateClassTeacherSubjects
} from "@/lib/classes/class-team-server";
import { allowUsernameAvailabilityCheck } from "@/lib/auth/rate-limit";

const inviteSchema = z.object({
  username: z.string().trim().min(3).max(32),
  courseIds: z.array(z.string().min(1)).min(1).max(20)
});
const updateSchema = z.object({
  assignmentId: z.string().uuid(),
  courseIds: z.array(z.string().min(1)).min(1).max(20)
});
const revokeSchema = z.object({ assignmentId: z.string().uuid() });

export async function GET(_: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    return NextResponse.json({ team: await listClassTeachingTeam(teacher.id, classId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load the teaching team." }, { status: 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    if (!allowUsernameAvailabilityCheck(`teacher-invite:${teacher.id}`)) throw new Error("Too many teacher lookups. Try again later.");
    const { classId } = await context.params;
    const input = inviteSchema.parse(await request.json());
    await inviteSubjectTeacher({ classTeacherId: teacher.id, classId, ...input });
    return NextResponse.json({ team: await listClassTeachingTeam(teacher.id, classId) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to invite this teacher." }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const input = updateSchema.parse(await request.json());
    await updateClassTeacherSubjects({ classTeacherId: teacher.id, classId, ...input });
    return NextResponse.json({ team: await listClassTeachingTeam(teacher.id, classId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update subject access." }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const input = revokeSchema.parse(await request.json());
    await revokeClassTeacher({ classTeacherId: teacher.id, classId, ...input });
    return NextResponse.json({ team: await listClassTeachingTeam(teacher.id, classId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to revoke teacher access." }, { status: 400 });
  }
}
