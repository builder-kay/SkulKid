import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { teacherPhoneHash } from "@/lib/moderation/teacher-phone-ban";
import {
  markModerationPublished,
  recordAdminApprovedContent
} from "@/lib/moderation/teacher-content-server";
import type { ModerationContentType } from "@/lib/moderation/teacher-content-policy";

type ModerationCase = {
  id: string;
  teacherId: string;
  contentType: ModerationContentType;
  contentId: string;
  snapshot: Record<string, unknown>;
  status: string;
};

export async function approveModerationCase(input: {
  moderationCase: ModerationCase;
  reviewerId: string;
  note: string;
}) {
  const admin = createAdminClient();
  await publishModeratedSnapshot(input.moderationCase);
  const now = new Date().toISOString();
  const { error } = await admin.from("ContentModerationCase").update({
    status: "overridden",
    reviewNote: input.note,
    reviewedBy: input.reviewerId,
    reviewedAt: now,
    publishedAt: now,
    updatedAt: now
  }).eq("id", input.moderationCase.id).in("status", ["held", "error", "rejected"]);
  if (error) throw new Error(error.message);
  await recordAdminApprovedContent(
    input.moderationCase.teacherId,
    input.moderationCase.contentType,
    input.moderationCase.contentId
  );
}

export async function publishModeratedSnapshot(moderationCase: ModerationCase) {
  const admin = createAdminClient();
  const snapshot = structuredClone(moderationCase.snapshot);
  if (moderationCase.contentType === "lesson") {
    const record = { ...snapshot, status: "published", createdBy: undefined };
    delete record.createdBy;
    const { data: existing } = await admin.from("AdminLessonRecord")
      .select("position,createdAt")
      .eq("id", moderationCase.contentId)
      .maybeSingle();
    const { count } = existing
      ? { count: null }
      : await admin.from("AdminLessonRecord").select("id", { count: "exact", head: true }).eq("courseId", String(snapshot.courseId));
    const { error } = await admin.from("AdminLessonRecord").upsert({
      id: moderationCase.contentId,
      subject: snapshot.subject,
      status: "published",
      classId: snapshot.classId ?? null,
      courseId: snapshot.courseId,
      unitId: snapshot.unitId ?? null,
      topicId: snapshot.topicId ?? null,
      position: existing?.position ?? count ?? 0,
      record,
      createdBy: moderationCase.teacherId,
      createdAt: existing?.createdAt ?? snapshot.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quarantinedAt: null,
      preQuarantineStatus: null
    }, { onConflict: "id" });
    if (error) throw new Error(error.message);
  } else if (moderationCase.contentType === "teacher_quiz") {
    const { error } = await admin.from("TeacherQuiz").upsert({
      id: moderationCase.contentId,
      createdBy: moderationCase.teacherId,
      title: snapshot.title,
      description: snapshot.description ?? "",
      subject: snapshot.subject ?? "general",
      gradeLevels: snapshot.gradeLevels,
      questions: snapshot.questions,
      baseXpReward: snapshot.baseXpReward,
      passingScore: snapshot.passingScore,
      maxAttempts: snapshot.maxAttempts,
      version: snapshot.version ?? 1,
      status: "ready",
      quarantinedAt: null,
      preQuarantineStatus: null
    }, { onConflict: "id" });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("ClassQuiz").upsert({
      id: moderationCase.contentId,
      classId: snapshot.classId,
      createdBy: moderationCase.teacherId,
      title: snapshot.title,
      description: snapshot.description ?? "",
      questions: snapshot.questions,
      startAt: snapshot.startAt ?? null,
      deadline: snapshot.deadline ?? null,
      offPlatformReward: snapshot.offPlatformReward ?? "",
      baseXpReward: snapshot.baseXpReward ?? 40,
      passingScore: snapshot.passingScore ?? 70,
      maxAttempts: snapshot.maxAttempts ?? 3,
      status: "published",
      quarantinedAt: null,
      preQuarantineStatus: null
    }, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }
  await markModerationPublished(moderationCase.id);
}

export async function banTeacherForModeration(input: {
  teacherId: string;
  actorId: string;
  reason: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(input.teacherId);
  if (error || !data.user) throw error ?? new Error("Teacher account not found.");
  const phoneRaw = data.user.user_metadata?.phone_e164 ?? data.user.phone;
  if (typeof phoneRaw !== "string" || !phoneRaw.trim()) throw new Error("The teacher account has no registered phone number.");
  const now = new Date().toISOString();
  const phoneHash = teacherPhoneHash(phoneRaw);
  const { data: activeBan, error: activeBanError } = await admin.from("TeacherPhoneBan")
    .select("id")
    .eq("phoneHash", phoneHash)
    .eq("active", true)
    .maybeSingle();
  if (activeBanError) throw new Error(activeBanError.message);
  const { data: previousBan, error: previousBanError } = activeBan
    ? { data: null, error: null }
    : await admin.from("TeacherPhoneBan")
    .select("id")
    .eq("phoneHash", phoneHash)
    .order("bannedAt", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previousBanError) throw new Error(previousBanError.message);
  const existingBan = activeBan ?? previousBan;
  const banPayload = {
    teacherId: input.teacherId,
    phoneHash,
    phoneLast4: phoneRaw.replace(/\D/g, "").slice(-4),
    reason: input.reason,
    active: true,
    bannedBy: input.actorId,
    bannedAt: now,
    liftedBy: null,
    liftedAt: null
  };
  const { error: banError } = existingBan
    ? await admin.from("TeacherPhoneBan").update(banPayload).eq("id", existingBan.id)
    : await admin.from("TeacherPhoneBan").insert(banPayload);
  if (banError) throw new Error(banError.message);
  const { error: authError } = await admin.auth.admin.updateUserById(input.teacherId, { ban_duration: "876000h" });
  if (authError) throw authError;
  const { error: trustError } = await admin.from("TeacherTrustProfile").update({
    status: "banned",
    monitoringRemaining: 10,
    updatedAt: now
  }).eq("teacherId", input.teacherId);
  if (trustError) throw new Error(trustError.message);
  await quarantineTeacherContent(input.teacherId, now);
}

export async function unbanTeacherAfterAppeal(input: {
  teacherId: string;
  actorId: string;
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: authError } = await admin.auth.admin.updateUserById(input.teacherId, { ban_duration: "none" });
  if (authError) throw authError;
  const [{ error: phoneError }, { error: trustError }] = await Promise.all([
    admin.from("TeacherPhoneBan").update({
      active: false,
      liftedBy: input.actorId,
      liftedAt: now
    }).eq("teacherId", input.teacherId).eq("active", true),
    admin.from("TeacherTrustProfile").update({
      status: "monitored",
      monitoringRemaining: 10,
      updatedAt: now
    }).eq("teacherId", input.teacherId)
  ]);
  if (phoneError || trustError) throw new Error((phoneError ?? trustError)?.message || "Could not restore the teacher account.");
}

async function quarantineTeacherContent(teacherId: string, now: string) {
  const admin = createAdminClient();
  const [
    { data: lessons, error: lessonReadError },
    { data: quizzes, error: quizReadError },
    { data: classQuizzes, error: classQuizReadError },
    { data: subjects, error: subjectReadError }
  ] = await Promise.all([
    admin.from("AdminLessonRecord").select("id,status,record").eq("createdBy", teacherId),
    admin.from("TeacherQuiz").select("id,status").eq("createdBy", teacherId),
    admin.from("ClassQuiz").select("id,status").eq("createdBy", teacherId),
    admin.from("Subject").select("id,status").eq("createdBy", teacherId)
  ]);
  const firstError = lessonReadError ?? quizReadError ?? classQuizReadError ?? subjectReadError;
  if (firstError) throw new Error(firstError.message);

  const updates = [
    ...(lessons ?? []).map((lesson) => {
      const record = { ...(lesson.record as Record<string, unknown>), status: "draft" };
      return admin.from("AdminLessonRecord").update({
        status: "draft",
        record,
        quarantinedAt: now,
        preQuarantineStatus: lesson.status
      }).eq("id", lesson.id);
    }),
    ...(quizzes ?? []).map((quiz) => admin.from("TeacherQuiz").update({
      status: "archived",
      quarantinedAt: now,
      preQuarantineStatus: quiz.status
    }).eq("id", quiz.id)),
    ...(classQuizzes ?? []).map((quiz) => admin.from("ClassQuiz").update({
      status: "draft",
      quarantinedAt: now,
      preQuarantineStatus: quiz.status
    }).eq("id", quiz.id)),
    ...(subjects ?? []).map((subject) => admin.from("Subject").update({
      currentPublicRevisionId: null,
      status: "ARCHIVED",
      quarantinedAt: now,
      preQuarantineStatus: subject.status
    }).eq("id", subject.id)),
    admin.from("PublicLearningRevision").update({ status: "archived" }).eq("submittedBy", teacherId).in("status", ["pending_review", "changes_requested", "approved"])
  ];
  const results = await Promise.all(updates);
  const updateError = results.find((result) => result.error)?.error;
  if (updateError) throw new Error(updateError.message);
}
