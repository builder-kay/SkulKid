import "server-only";

import { createHash } from "node:crypto";
import type { AdminLessonRecord } from "@/lib/admin/lesson-library";
import { readAdminSettingServer } from "@/lib/admin/settings-server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Subject, Topic, Unit } from "@/types/subject";

export type PublicLearningAudience = "class_only" | "public" | "both";
export type PublicLearningRevisionStatus =
  | "pending_review"
  | "changes_requested"
  | "approved"
  | "superseded"
  | "archived";

export type PublicLearningSnapshot = {
  course: Omit<Subject, "units"> & { order: number };
  units: Unit[];
  lessons: AdminLessonRecord[];
};

export type PublicLearningSettings = {
  allowTeacherPublishing: boolean;
  requireLessonApproval: boolean;
};

const settingsDefaults: PublicLearningSettings = {
  allowTeacherPublishing: true,
  requireLessonApproval: true
};

export async function readPublicLearningSettings() {
  const settings = await readAdminSettingServer<Partial<PublicLearningSettings>>("platform-system-settings");
  return { ...settingsDefaults, ...(settings ?? {}) };
}

export function snapshotHash(snapshot: PublicLearningSnapshot) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

export async function buildPublicLearningSnapshot(courseId: string): Promise<PublicLearningSnapshot> {
  const admin = createAdminClient();
  const [courseResult, unitsResult, topicsResult, lessonsResult] = await Promise.all([
    admin.from("Subject")
      .select("id,name,slug,description,colourToken,coverUrl,gradeLevels,order")
      .eq("id", courseId)
      .maybeSingle(),
    admin.from("Unit")
      .select("id,subjectId,name,slug,description,order")
      .eq("subjectId", courseId)
      .order("order"),
    admin.from("Topic")
      .select("id,unitId,name,slug,description,order")
      .order("order"),
    admin.from("AdminLessonRecord")
      .select("record,classId,courseId,unitId,topicId,position")
      .eq("courseId", courseId)
      .eq("status", "published")
      .order("position")
  ]);
  const error = courseResult.error ?? unitsResult.error ?? topicsResult.error ?? lessonsResult.error;
  if (error) throw new Error(error.message);
  if (!courseResult.data) throw new Error("Course not found.");

  const lessons = (lessonsResult.data ?? []).map((row) => ({
    ...(row.record as AdminLessonRecord),
    classId: (row.classId as string | null) ?? null,
    courseId: (row.courseId as string | null) ?? courseId,
    unitId: (row.unitId as string | null) ?? null,
    topicId: (row.topicId as string | null) ?? null
  }));
  if (!lessons.length) {
    throw new Error("Publish at least one complete lesson before submitting this course to Public Learning.");
  }

  const lessonIdsByTopic = new Map<string, string[]>();
  for (const lesson of lessons) {
    if (!lesson.topicId) continue;
    lessonIdsByTopic.set(lesson.topicId, [...(lessonIdsByTopic.get(lesson.topicId) ?? []), lesson.id]);
  }

  const topicsByUnit = new Map<string, Topic[]>();
  for (const topic of topicsResult.data ?? []) {
    const unitId = String(topic.unitId);
    const mapped: Topic = {
      id: String(topic.id),
      unitId,
      title: String(topic.name),
      slug: String(topic.slug),
      description: String(topic.description ?? ""),
      order: Number(topic.order),
      lessonIds: lessonIdsByTopic.get(String(topic.id)) ?? []
    };
    topicsByUnit.set(unitId, [...(topicsByUnit.get(unitId) ?? []), mapped]);
  }

  const units: Unit[] = (unitsResult.data ?? []).map((unit) => ({
    id: String(unit.id),
    subjectId: courseId,
    title: String(unit.name),
    slug: String(unit.slug),
    description: String(unit.description ?? ""),
    order: Number(unit.order),
    topics: topicsByUnit.get(String(unit.id)) ?? []
  }));
  const course = courseResult.data;
  return {
    course: {
      id: String(course.id),
      name: String(course.name),
      slug: String(course.slug),
      description: String(course.description ?? ""),
      color: String(course.colourToken),
      coverUrl: typeof course.coverUrl === "string" ? course.coverUrl : null,
      gradeLevels: Array.isArray(course.gradeLevels) ? course.gradeLevels.map(Number) : [],
      order: Number(course.order)
    },
    units,
    lessons
  };
}

export async function getCoursePublicationState(courseId: string) {
  const admin = createAdminClient();
  const [{ data: course, error: courseError }, { data: revisions, error: revisionError }] = await Promise.all([
    admin.from("Subject").select("currentPublicRevisionId").eq("id", courseId).maybeSingle(),
    admin.from("PublicLearningRevision")
      .select("id,version,status,contentHash,submittedAt,reviewedAt,reviewNote,publishedAt")
      .eq("courseId", courseId)
      .order("version", { ascending: false })
      .limit(10)
  ]);
  const error = courseError ?? revisionError;
  if (error) throw new Error(error.message);
  const current = (revisions ?? []).find((revision) => revision.id === course?.currentPublicRevisionId) ?? null;
  const latest = revisions?.[0] ?? null;
  return {
    currentRevisionId: (course?.currentPublicRevisionId as string | null) ?? null,
    currentVersion: current ? Number(current.version) : null,
    publishedAt: (current?.publishedAt as string | null) ?? null,
    latest: latest ? {
      id: String(latest.id),
      version: Number(latest.version),
      status: latest.status as PublicLearningRevisionStatus,
      submittedAt: String(latest.submittedAt),
      reviewedAt: (latest.reviewedAt as string | null) ?? null,
      reviewNote: (latest.reviewNote as string | null) ?? null
    } : null
  };
}

export async function listApprovedPublicLearningSnapshots() {
  const admin = createAdminClient();
  const { data: subjects, error: subjectError } = await admin
    .from("Subject")
    .select("id,currentPublicRevisionId")
    .eq("status", "ACTIVE")
    .neq("visibility", "class")
    .not("currentPublicRevisionId", "is", null);
  if (subjectError) throw new Error(subjectError.message);
  const revisionIds = (subjects ?? []).map((subject) => String(subject.currentPublicRevisionId));
  if (!revisionIds.length) return [] as Array<{ revisionId: string; courseId: string; snapshot: PublicLearningSnapshot; publishedAt: string | null }>;
  const { data: revisions, error } = await admin
    .from("PublicLearningRevision")
    .select("id,courseId,snapshot,publishedAt,status")
    .in("id", revisionIds)
    .eq("status", "approved");
  if (error) throw new Error(error.message);
  return (revisions ?? []).map((revision) => ({
    revisionId: String(revision.id),
    courseId: String(revision.courseId),
    snapshot: revision.snapshot as PublicLearningSnapshot,
    publishedAt: (revision.publishedAt as string | null) ?? null
  }));
}

export async function findApprovedPublicLesson(lessonId: string) {
  const publications = await listApprovedPublicLearningSnapshots();
  for (const publication of publications) {
    const lesson = publication.snapshot.lessons.find((item) => item.id === lessonId);
    if (lesson) return lesson;
  }
  return null;
}
