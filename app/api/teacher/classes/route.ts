import { NextResponse } from "next/server";
import { z } from "zod";
import { createTeacherClass, listTeacherClasses, requireTeacher } from "@/lib/classes/classroom-server";

export async function GET() {
  try {
    const teacher = await requireTeacher();
    const classes = await listTeacherClasses(teacher.id);
    return NextResponse.json({ classes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load classes.";
    const status = message.includes("required") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(400).optional(),
  gradeLevel: z.number().int().min(1).max(6)
});

export async function POST(request: Request) {
  try {
    const teacher = await requireTeacher();
    const input = createSchema.parse(await request.json());
    const classroom = await createTeacherClass({
      teacherId: teacher.id,
      name: input.name,
      description: input.description,
      gradeLevel: input.gradeLevel
    });
    return NextResponse.json({ classroom }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create class.";
    const status = message.includes("required") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
