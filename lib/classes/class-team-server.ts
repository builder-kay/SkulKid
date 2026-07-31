import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAppRole } from "@/lib/auth/roles";
import { findSupabaseUserByUsername } from "@/lib/auth/student-identity";
import { requireClassTeacher } from "@/lib/classes/classroom-server";
import type { ClassTeacherInvitation, ClassTeachingTeamMember } from "@/lib/classes/types";

function teacherName(user: { user_metadata?: Record<string, unknown>; email?: string | null } | null | undefined) {
  const display = user?.user_metadata?.display_name;
  return typeof display === "string" && display.trim() ? display.trim() : user?.email ?? "Teacher";
}

function usernameOf(user: { user_metadata?: Record<string, unknown> } | null | undefined) {
  const username = user?.user_metadata?.username;
  return typeof username === "string" ? username : "";
}

export async function listClassTeachingTeam(teacherId: string, classId: string): Promise<ClassTeachingTeamMember[]> {
  await requireClassTeacher(teacherId, classId);
  const admin = createAdminClient();
  const [{ data: assignments, error }, { data: courses }] = await Promise.all([
    admin.from("ClassTeacherAssignment").select("*").eq("classId", classId).order("invitedAt"),
    admin.from("ClassCourseAssignment").select("courseId").eq("classId", classId)
  ]);
  if (error) throw new Error(error.message);
  const assignmentIds = (assignments ?? []).map((item) => String(item.id));
  const courseIds = (courses ?? []).map((item) => String(item.courseId));
  const [{ data: scopes }, { data: subjects }] = await Promise.all([
    assignmentIds.length
      ? admin.from("ClassTeacherSubject").select("assignmentId,courseId").in("assignmentId", assignmentIds)
      : Promise.resolve({ data: [] }),
    courseIds.length
      ? admin.from("Subject").select("id,name").in("id", courseIds)
      : Promise.resolve({ data: [] })
  ]);
  const names = new Map((subjects ?? []).map((item) => [String(item.id), String(item.name)]));
  return Promise.all((assignments ?? []).map(async (assignment) => {
    const { data } = await admin.auth.admin.getUserById(String(assignment.teacherId));
    return {
      assignmentId: String(assignment.id),
      teacherId: String(assignment.teacherId),
      teacherName: teacherName(data.user),
      username: usernameOf(data.user),
      role: assignment.role,
      status: assignment.status,
      subjects: (scopes ?? []).filter((item) => item.assignmentId === assignment.id).map((item) => ({
        id: String(item.courseId),
        name: names.get(String(item.courseId)) ?? "Subject"
      })),
      invitedAt: String(assignment.invitedAt)
    } as ClassTeachingTeamMember;
  }));
}

export async function inviteSubjectTeacher(input: {
  classTeacherId: string;
  classId: string;
  username: string;
  courseIds: string[];
}) {
  await requireClassTeacher(input.classTeacherId, input.classId);
  const user = await findSupabaseUserByUsername(input.username);
  if (!user || resolveAppRole(user.app_metadata?.role) !== "teacher") {
    throw new Error("No teacher account matches that exact username.");
  }
  if (user.id === input.classTeacherId) throw new Error("You are already the class teacher.");
  const admin = createAdminClient();
  const { data: assignedCourses, error: courseError } = await admin.from("ClassCourseAssignment")
    .select("courseId")
    .eq("classId", input.classId)
    .in("courseId", input.courseIds);
  if (courseError) throw new Error(courseError.message);
  if ((assignedCourses ?? []).length !== new Set(input.courseIds).size) {
    throw new Error("Choose only subjects currently assigned to this class.");
  }
  const now = new Date().toISOString();
  const { data: assignment, error } = await admin.from("ClassTeacherAssignment").upsert({
    classId: input.classId,
    teacherId: user.id,
    role: "subject_teacher",
    status: "pending",
    invitedBy: input.classTeacherId,
    invitedAt: now,
    respondedAt: null,
    revokedAt: null,
    updatedAt: now
  }, { onConflict: "classId,teacherId" }).select("id").single();
  if (error || !assignment) throw new Error(error?.message ?? "Could not invite this teacher.");
  await admin.from("ClassTeacherSubject").delete().eq("assignmentId", assignment.id);
  if (input.courseIds.length) {
    const { error: scopeError } = await admin.from("ClassTeacherSubject").insert(input.courseIds.map((courseId) => ({
      assignmentId: assignment.id,
      courseId,
      assignedBy: input.classTeacherId
    })));
    if (scopeError) throw new Error(scopeError.message);
  }
  await admin.from("ClassTeacherAudit").insert({
    classId: input.classId,
    assignmentId: assignment.id,
    actorId: input.classTeacherId,
    action: "teacher_invited",
    metadata: { courseIds: input.courseIds }
  });
  return assignment.id as string;
}

export async function updateClassTeacherSubjects(input: {
  classTeacherId: string;
  classId: string;
  assignmentId: string;
  courseIds: string[];
}) {
  await requireClassTeacher(input.classTeacherId, input.classId);
  const admin = createAdminClient();
  const { data: assignment } = await admin.from("ClassTeacherAssignment").select("id,role").eq("id", input.assignmentId).eq("classId", input.classId).maybeSingle();
  if (!assignment || assignment.role !== "subject_teacher") throw new Error("Subject-teacher assignment not found.");
  const { data: courses } = await admin.from("ClassCourseAssignment").select("courseId").eq("classId", input.classId).in("courseId", input.courseIds);
  if ((courses ?? []).length !== new Set(input.courseIds).size) throw new Error("Choose only assigned class subjects.");
  await admin.from("ClassTeacherSubject").delete().eq("assignmentId", input.assignmentId);
  if (input.courseIds.length) {
    const { error } = await admin.from("ClassTeacherSubject").insert(input.courseIds.map((courseId) => ({
      assignmentId: input.assignmentId, courseId, assignedBy: input.classTeacherId
    })));
    if (error) throw new Error(error.message);
  }
  await admin.from("ClassTeacherAudit").insert({
    classId: input.classId, assignmentId: input.assignmentId, actorId: input.classTeacherId,
    action: "subjects_updated", metadata: { courseIds: input.courseIds }
  });
}

export async function revokeClassTeacher(input: { classTeacherId: string; classId: string; assignmentId: string }) {
  await requireClassTeacher(input.classTeacherId, input.classId);
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin.from("ClassTeacherAssignment").update({
    status: "revoked", revokedAt: now, updatedAt: now
  }).eq("id", input.assignmentId).eq("classId", input.classId).eq("role", "subject_teacher");
  if (error) throw new Error(error.message);
  await admin.from("ClassTeacherAudit").insert({
    classId: input.classId, assignmentId: input.assignmentId, actorId: input.classTeacherId,
    action: "teacher_revoked"
  });
}

export async function listTeacherInvitations(teacherId: string): Promise<ClassTeacherInvitation[]> {
  const admin = createAdminClient();
  const { data: assignments, error } = await admin.from("ClassTeacherAssignment")
    .select("id,classId,invitedAt")
    .eq("teacherId", teacherId)
    .eq("role", "subject_teacher")
    .eq("status", "pending")
    .order("invitedAt", { ascending: false });
  if (error) throw new Error(error.message);
  if (!assignments?.length) return [];
  const ids = assignments.map((item) => String(item.id));
  const classIds = assignments.map((item) => String(item.classId));
  const [{ data: classes }, { data: scopes }] = await Promise.all([
    admin.from("TeacherClass").select("id,name,teacherId").in("id", classIds),
    admin.from("ClassTeacherSubject").select("assignmentId,courseId").in("assignmentId", ids)
  ]);
  const courseIds = [...new Set((scopes ?? []).map((item) => String(item.courseId)))];
  const { data: subjects } = courseIds.length ? await admin.from("Subject").select("id,name").in("id", courseIds) : { data: [] };
  const names = new Map((subjects ?? []).map((item) => [String(item.id), String(item.name)]));
  const classTeacherNames = new Map<string, string>();
  await Promise.all((classes ?? []).map(async (item) => {
    const { data } = await admin.auth.admin.getUserById(String(item.teacherId));
    classTeacherNames.set(String(item.id), teacherName(data.user));
  }));
  return assignments.map((assignment) => {
    const classroom = (classes ?? []).find((item) => item.id === assignment.classId);
    return {
      assignmentId: String(assignment.id),
      classId: String(assignment.classId),
      className: String(classroom?.name ?? "Class"),
      classTeacherName: classTeacherNames.get(String(assignment.classId)) ?? "Class teacher",
      subjects: (scopes ?? []).filter((item) => item.assignmentId === assignment.id).map((item) => ({
        id: String(item.courseId), name: names.get(String(item.courseId)) ?? "Subject"
      })),
      invitedAt: String(assignment.invitedAt)
    };
  });
}

export async function respondToClassInvitation(input: { teacherId: string; assignmentId: string; response: "accepted" | "declined" }) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const status = input.response === "accepted" ? "active" : "declined";
  const { data, error } = await admin.from("ClassTeacherAssignment").update({
    status, respondedAt: now, updatedAt: now
  }).eq("id", input.assignmentId).eq("teacherId", input.teacherId).eq("status", "pending").select("classId").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This invitation is no longer available.");
  await admin.from("ClassTeacherAudit").insert({
    classId: data.classId, assignmentId: input.assignmentId, actorId: input.teacherId,
    action: input.response === "accepted" ? "invitation_accepted" : "invitation_declined"
  });
}
