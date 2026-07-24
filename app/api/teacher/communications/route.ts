import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createTeacherNotification,
  getTeacherMessagingData,
  requireTeacher
} from "@/lib/classes/classroom-server";

const schema = z.object({
  audience: z.enum(["all", "class", "selected", "student"]),
  classId: z.string().uuid().optional(),
  studentIds: z.array(z.string().uuid()).max(500).optional(),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(1000)
});

export async function GET() {
  try {
    const teacher = await requireTeacher();
    return NextResponse.json(await getTeacherMessagingData(teacher.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load communications." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const teacher = await requireTeacher();
    const input = schema.parse(await request.json());
    const recipientCount = await createTeacherNotification({ teacherId: teacher.id, ...input });
    return NextResponse.json({ ok: true, recipientCount }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send notification." }, { status: 400 });
  }
}
