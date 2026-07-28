import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { StudentClassCourse } from "@/lib/classes/types";
import { publishedLessonsFromRecords } from "@/lib/lessons/published-lesson-records";
import { buildPublicLearningSnapshot } from "@/lib/public-learning/publication-server";

export async function getStudentClassCourse(
  studentId: string,
  classId: string,
  courseSlug: string
): Promise<StudentClassCourse> {
  const admin = createAdminClient();
  const [{ data: membership, error: membershipError }, { data: classroom, error: classError }] = await Promise.all([
    admin
      .from("ClassMembership")
      .select("id")
      .eq("classId", classId)
      .eq("studentId", studentId)
      .eq("status", "active")
      .maybeSingle(),
    admin
      .from("TeacherClass")
      .select("id,name")
      .eq("id", classId)
      .eq("status", "active")
      .maybeSingle()
  ]);
  const accessError = membershipError ?? classError;
  if (accessError) throw new Error(accessError.message);
  if (!membership) throw new Error("Join this class first.");
  if (!classroom) throw new Error("Class not found.");

  const { data: subject, error: subjectError } = await admin
    .from("Subject")
    .select("id,slug,status,visibility,ownerClassId")
    .eq("slug", courseSlug)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (subjectError) throw new Error(subjectError.message);
  if (!subject) throw new Error("Subject not found.");

  const { data: assignment, error: assignmentError } = await admin
    .from("ClassCourseAssignment")
    .select("id")
    .eq("classId", classId)
    .eq("courseId", subject.id)
    .maybeSingle();
  if (assignmentError) throw new Error(assignmentError.message);
  const isOwnedClassCourse = subject.visibility === "class" && subject.ownerClassId === classId;
  if (!assignment && !isOwnedClassCourse) throw new Error("This subject is not assigned to your class.");

  const snapshot = await buildPublicLearningSnapshot(String(subject.id));
  return {
    classroom: { id: String(classroom.id), name: String(classroom.name) },
    course: { ...snapshot.course, units: snapshot.units },
    lessons: publishedLessonsFromRecords(snapshot.lessons)
  };
}
