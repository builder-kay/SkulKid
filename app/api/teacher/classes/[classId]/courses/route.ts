import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assignCourseToClass,
  createClassOnlyCourse,
  listClassCourses,
  removeCourseFromClass,
  requireTeacher
} from "@/lib/classes/classroom-server";

export async function GET(_: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const courseAssignments = await listClassCourses(teacher.id, classId);
    return NextResponse.json({ courseAssignments });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load courses." }, { status: 400 });
  }
}

const assignSchema = z.object({
  courseId: z.string().min(1),
  note: z.string().trim().max(240).optional()
});

const createClassOnlySchema = z.object({
  createClassOnly: z.literal(true),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  note: z.string().trim().max(240).optional()
});

const postSchema = z.union([createClassOnlySchema, assignSchema]);

export async function POST(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const input = postSchema.parse(await request.json());
    if ("createClassOnly" in input) {
      const courseAssignments = await createClassOnlyCourse(teacher.id, classId, {
        name: input.name,
        description: input.description,
        note: input.note
      });
      return NextResponse.json({ courseAssignments }, { status: 201 });
    }
    await assignCourseToClass(teacher.id, classId, input.courseId, input.note);
    const courseAssignments = await listClassCourses(teacher.id, classId);
    return NextResponse.json({ courseAssignments }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to assign course." }, { status: 400 });
  }
}

const removeSchema = z.object({ assignmentId: z.string().uuid() });

export async function DELETE(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const input = removeSchema.parse(await request.json());
    await removeCourseFromClass(teacher.id, classId, input.assignmentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to remove course." }, { status: 400 });
  }
}
