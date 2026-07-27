import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";

const createSubjectSchema = z.object({
  action: z.literal("create_subject"),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  classId: z.string().uuid().optional()
});
const createModuleSchema = z.object({
  action: z.literal("create_module"),
  courseId: z.string().min(1),
  name: z.string().trim().min(2).max(120)
});
const schema = z.union([createSubjectSchema, createModuleSchema]);

export async function GET() {
  try {
    const teacher = await requireTeacher();
    const admin = createAdminClient();
    const { data: classes, error: classError } = await admin.from("TeacherClass").select("id").eq("teacherId", teacher.id);
    if (classError) throw new Error(classError.message);
    const ownedClassIds = new Set((classes ?? []).map((item) => item.id as string));
    const [{ data: subjects, error: subjectError }, { data: units, error: unitError }] = await Promise.all([
      admin.from("Subject").select("id,name,slug,description,gradeLevels,status,visibility,ownerClassId,createdBy").order("name"),
      admin.from("Unit").select("id,subjectId,name,description,order").order("order")
    ]);
    if (subjectError) throw new Error(subjectError.message);
    if (unitError) throw new Error(unitError.message);
    const visible = (subjects ?? []).filter((subject) =>
      subject.createdBy === teacher.id
      && (subject.visibility !== "class" || ownedClassIds.has(subject.ownerClassId as string))
    );
    return NextResponse.json({
      courses: visible.map((subject) => ({
        id: subject.id as string,
        name: subject.name as string,
        slug: subject.slug as string,
        description: (subject.description as string) ?? "",
        gradeLevels: (subject.gradeLevels as number[]) ?? [],
        visibility: subject.visibility === "class" ? "class" : "platform",
        ownerClassId: (subject.ownerClassId as string | null) ?? null,
        units: (units ?? []).filter((unit) => unit.subjectId === subject.id).map((unit) => ({
          id: unit.id as string,
          title: unit.name as string,
          description: (unit.description as string) ?? "",
          order: Number(unit.order)
        }))
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load subjects and modules." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const teacher = await requireTeacher();
    const input = schema.parse(await request.json());
    const admin = createAdminClient();
    if (input.action === "create_subject") {
      if (input.classId) {
        const { data: classroom } = await admin.from("TeacherClass").select("id,gradeLevel").eq("id", input.classId).eq("teacherId", teacher.id).maybeSingle();
        if (!classroom) throw new Error("You can only create subjects for your own classes.");
      }
      const id = `course-${crypto.randomUUID()}`;
      const slug = `${input.classId ? "class" : "teacher"}-${crypto.randomUUID().slice(0, 8)}-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`.slice(0, 100);
      const { count } = await admin.from("Subject").select("id", { count: "exact", head: true });
      const { error } = await admin.from("Subject").insert({
        id, name: input.name, slug, description: input.description ?? "", icon: "book-open",
        colourToken: "#7C3AED", gradeLevels: [], order: count ?? 0, status: input.classId ? "ACTIVE" : "ARCHIVED",
        visibility: input.classId ? "class" : "platform", ownerClassId: input.classId ?? null,
        createdBy: teacher.id, updatedAt: new Date().toISOString()
      });
      if (error) throw new Error(error.message);
      if (input.classId) {
        const { error: assignmentError } = await admin.from("ClassCourseAssignment").insert({ classId: input.classId, courseId: id, note: "Created during lesson authoring" });
        if (assignmentError) throw new Error(assignmentError.message);
      }
      return NextResponse.json({ id }, { status: 201 });
    }

    const { data: subject } = await admin.from("Subject").select("id,visibility,ownerClassId,createdBy").eq("id", input.courseId).maybeSingle();
    if (!subject) throw new Error("Subject not found.");
    if (subject.createdBy !== teacher.id) throw new Error("You can only add modules to courses you created.");
    const { count } = await admin.from("Unit").select("id", { count: "exact", head: true }).eq("subjectId", input.courseId);
    const id = `unit-${crypto.randomUUID()}`;
    const { error } = await admin.from("Unit").insert({
      id, subjectId: input.courseId, name: input.name,
      slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "module",
      description: `Module for ${input.name}.`, order: count ?? 0, updatedAt: new Date().toISOString()
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create placement item." }, { status: 400 });
  }
}
