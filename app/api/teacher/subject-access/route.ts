import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { getCoursePublicationState, readPublicLearningSettings } from "@/lib/public-learning/publication-server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  courseId: z.string().min(1),
  mode: z.enum(["class_only", "public", "both"]),
  classIds: z.array(z.string().uuid()).max(50)
});

export async function GET() {
  try {
    const teacher = await requireTeacher();
    const admin = createAdminClient();
    const { data: classes, error: classError } = await admin
      .from("TeacherClass")
      .select("id,name")
      .eq("teacherId", teacher.id)
      .eq("status", "active")
      .order("name");
    if (classError) throw new Error(classError.message);
    const classIds = (classes ?? []).map((item) => item.id as string);
    const [{ data: assignments }, { data: subjects, error: subjectError }] = await Promise.all([
      classIds.length
        ? admin.from("ClassCourseAssignment").select("classId,courseId").in("classId", classIds)
        : Promise.resolve({ data: [] }),
      admin.from("Subject").select("id,visibility,ownerClassId,createdBy").eq("createdBy", teacher.id)
    ]);
    if (subjectError) throw new Error(subjectError.message);
    const publicationPairs = await Promise.all((subjects ?? []).map(async (subject) => [
      String(subject.id),
      subject.visibility === "class" ? null : await getCoursePublicationState(String(subject.id))
    ] as const));
    return NextResponse.json({
      classes: (classes ?? []).map((item) => ({ id: item.id, name: item.name })),
      settings: await readPublicLearningSettings(),
      subjects: (subjects ?? []).map((subject) => {
        const assignedClassIds = (assignments ?? [])
          .filter((item) => item.courseId === subject.id)
          .map((item) => item.classId as string);
        return {
          courseId: subject.id as string,
          visibility: subject.visibility === "class" ? "class" : "platform",
          ownerClassId: (subject.ownerClassId as string | null) ?? null,
          classIds: assignedClassIds,
          publication: publicationPairs.find(([courseId]) => courseId === subject.id)?.[1] ?? null
        };
      })
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load subject access." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const teacher = await requireTeacher();
    const input = schema.parse(await request.json());
    if (input.mode === "class_only" && input.classIds.length < 1) {
      throw new Error("Choose at least one class for class learning.");
    }
    if (input.mode === "both" && input.classIds.length < 1) {
      throw new Error("Choose at least one class for combined access.");
    }
    const admin = createAdminClient();
    const { data: subject, error: subjectError } = await admin
      .from("Subject")
      .select("id,createdBy")
      .eq("id", input.courseId)
      .maybeSingle();
    if (subjectError) throw new Error(subjectError.message);
    if (!subject || subject.createdBy !== teacher.id) throw new Error("You can only change access for subjects you created.");

    const { data: ownedClasses, error: classError } = await admin
      .from("TeacherClass")
      .select("id")
      .eq("teacherId", teacher.id)
      .in("id", input.classIds.length ? input.classIds : ["00000000-0000-0000-0000-000000000000"]);
    if (classError) throw new Error(classError.message);
    if ((ownedClasses ?? []).length !== input.classIds.length) throw new Error("One or more selected classes do not belong to you.");

    const { data: allOwnedClasses } = await admin.from("TeacherClass").select("id").eq("teacherId", teacher.id);
    const allOwnedClassIds = (allOwnedClasses ?? []).map((item) => item.id as string);
    if (allOwnedClassIds.length) {
      await admin.from("ClassCourseAssignment").delete().eq("courseId", input.courseId).in("classId", allOwnedClassIds);
    }
    if (input.classIds.length) {
      const { error: assignmentError } = await admin.from("ClassCourseAssignment").insert(
        input.classIds.map((classId) => ({ classId, courseId: input.courseId, note: "Subject access assignment" }))
      );
      if (assignmentError) throw new Error(assignmentError.message);
    }

    const { error: updateError } = await admin.from("Subject").update({
      visibility: input.mode === "class_only" ? "class" : "platform",
      ownerClassId: input.mode === "class_only" ? input.classIds[0] : null,
      updatedAt: new Date().toISOString()
    }).eq("id", input.courseId);
    if (updateError) throw new Error(updateError.message);
    if (input.mode === "class_only") {
      const { error: unpublishError } = await admin.rpc("unpublish_public_learning_course", {
        selected_course_id: input.courseId,
        archive_course: false
      });
      if (unpublishError) throw new Error(unpublishError.message);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update subject access." }, { status: 400 });
  }
}
