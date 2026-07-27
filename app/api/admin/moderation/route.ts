import { NextResponse } from "next/server";
import { z } from "zod";
import { adminContext, auditAdminAction, listAllAuthUsers } from "@/lib/admin/admin-server";
import type { PublicLearningSnapshot } from "@/lib/public-learning/publication-server";
import {
  approveModerationCase,
  banTeacherForModeration,
  unbanTeacherAfterAppeal
} from "@/lib/moderation/admin-moderation-actions";
import type { ModerationContentType } from "@/lib/moderation/teacher-content-policy";
import { sendQuizAssignmentMessages } from "@/lib/quizzes/quiz-assignment-sms";
import { platformActionUrl } from "@/lib/auth/sms-links";

const publicReviewSchema = z.object({
  revisionId: z.string().uuid(),
  action: z.enum(["approve", "changes_requested"]),
  note: z.string().trim().max(1000).optional()
}).superRefine((input, context) => {
  if (input.action === "changes_requested" && (!input.note || input.note.length < 4)) {
    context.addIssue({ code: "custom", path: ["note"], message: "Explain what the teacher should change." });
  }
});

const contentReviewSchema = z.object({
  caseId: z.string().uuid(),
  action: z.enum(["approve_content", "reject_content", "ban_teacher"]),
  note: z.string().trim().min(4).max(1000),
  confirmation: z.string().optional()
});

const appealReviewSchema = z.object({
  appealId: z.string().uuid(),
  action: z.enum(["uphold_appeal", "overturn_appeal"]),
  note: z.string().trim().min(4).max(1000)
});

function displayName(user: { id: string; user_metadata?: Record<string, unknown>; email?: string | null; phone?: string | null } | undefined) {
  const value = user?.user_metadata?.display_name;
  return typeof value === "string" && value.trim() ? value.trim() : user?.email || user?.phone || "Teacher";
}

export async function GET() {
  try {
    const { admin } = await adminContext();
    const [{ data: revisions, error }, { data: cases, error: caseError }, { data: appeals, error: appealError }, { data: trustProfiles }, users] = await Promise.all([
      admin.from("PublicLearningRevision")
        .select("id,courseId,version,status,snapshot,submittedBy,submittedAt")
        .eq("status", "pending_review")
        .order("submittedAt", { ascending: false })
        .limit(40),
      admin.from("ContentModerationCase")
        .select("*")
        .in("status", ["held", "error"])
        .order("createdAt", { ascending: false })
        .limit(60),
      admin.from("ModerationAppeal")
        .select("*")
        .eq("status", "pending")
        .order("createdAt", { ascending: false })
        .limit(60),
      admin.from("TeacherTrustProfile").select("*"),
      listAllAuthUsers()
    ]);
    const firstError = error ?? caseError ?? appealError;
    if (firstError) throw new Error(firstError.message);
    const userById = new Map(users.map((user) => [user.id, user]));
    const trustById = new Map((trustProfiles ?? []).map((profile) => [String(profile.teacherId), profile]));
    return NextResponse.json({
      publicItems: (revisions ?? []).map((revision) => {
        const snapshot = revision.snapshot as PublicLearningSnapshot;
        return {
          id: String(revision.id),
          courseId: String(revision.courseId),
          version: Number(revision.version),
          title: snapshot.course.name,
          description: snapshot.course.description,
          gradeLevels: snapshot.course.gradeLevels ?? [],
          submittedAt: String(revision.submittedAt),
          teacherName: displayName(userById.get(String(revision.submittedBy))),
          moduleCount: snapshot.units.length,
          lessonCount: snapshot.lessons.length,
          snapshot
        };
      }),
      contentItems: (cases ?? []).map((item) => ({
        ...item,
        teacherName: displayName(userById.get(String(item.teacherId))),
        trust: trustById.get(String(item.teacherId)) ?? null
      })),
      appeals: (appeals ?? []).map((appeal) => ({
        ...appeal,
        teacherName: displayName(userById.get(String(appeal.teacherId))),
        trust: trustById.get(String(appeal.teacherId)) ?? null,
        moderationCase: appeal.caseId
          ? (cases ?? []).find((item) => item.id === appeal.caseId) ?? null
          : null
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load moderation queues.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const raw = await request.json() as Record<string, unknown>;
    if (raw.revisionId) return reviewPublicLearning(publicReviewSchema.parse(raw));
    if (raw.caseId) return reviewTeacherContent(contentReviewSchema.parse(raw), request);
    return reviewAppeal(appealReviewSchema.parse(raw), request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to review content.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 400 });
  }
}

async function reviewPublicLearning(input: z.infer<typeof publicReviewSchema>) {
  const { actor, admin, requestId } = await adminContext();
  const { data: revision, error: readError } = await admin
    .from("PublicLearningRevision")
    .select("id,courseId,version,status")
    .eq("id", input.revisionId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!revision || revision.status !== "pending_review") throw new Error("This submission is no longer awaiting review.");
  if (input.action === "approve") {
    const { error } = await admin.rpc("activate_public_learning_revision", { revision_id: input.revisionId, reviewer_id: actor.id });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("PublicLearningRevision").update({
      status: "changes_requested",
      reviewedBy: actor.id,
      reviewedAt: new Date().toISOString(),
      reviewNote: input.note
    }).eq("id", input.revisionId).eq("status", "pending_review");
    if (error) throw new Error(error.message);
  }
  await auditAdminAction({
    actorId: actor.id,
    action: input.action === "approve" ? "public_learning.approved" : "public_learning.changes_requested",
    targetType: "public_learning_revision",
    targetId: input.revisionId,
    reason: input.note,
    before: revision,
    after: { status: input.action === "approve" ? "approved" : "changes_requested" },
    requestId
  });
  return NextResponse.json({ ok: true });
}

async function reviewTeacherContent(input: z.infer<typeof contentReviewSchema>, request: Request) {
  const { actor, admin, requestId } = await adminContext();
  const { data, error } = await admin.from("ContentModerationCase").select("*").eq("id", input.caseId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !["held", "error", "rejected"].includes(String(data.status))) throw new Error("This content is no longer awaiting review.");
  const moderationCase = {
    id: String(data.id),
    teacherId: String(data.teacherId),
    contentType: data.contentType as ModerationContentType,
    contentId: String(data.contentId),
    snapshot: data.snapshot as Record<string, unknown>,
    status: String(data.status)
  };
  if (input.action === "approve_content") {
    await approveModerationCase({ moderationCase, reviewerId: actor.id, note: input.note });
    await notifyApprovedClassQuiz(moderationCase, request);
  } else {
    const now = new Date().toISOString();
    const { error: updateError } = await admin.from("ContentModerationCase").update({
      status: "rejected",
      reviewNote: input.note,
      reviewedBy: actor.id,
      reviewedAt: now,
      updatedAt: now
    }).eq("id", input.caseId);
    if (updateError) throw new Error(updateError.message);
    const { data: currentTrust, error: trustReadError } = await admin.from("TeacherTrustProfile")
      .select("status")
      .eq("teacherId", moderationCase.teacherId)
      .maybeSingle();
    if (trustReadError) throw new Error(trustReadError.message);
    if (currentTrust?.status !== "banned") {
      const remainsProbationary = currentTrust?.status === "probation";
      const { error: trustError } = await admin.from("TeacherTrustProfile").update({
        status: remainsProbationary ? "probation" : "monitored",
        monitoringRemaining: remainsProbationary ? 0 : 10,
        updatedAt: now
      }).eq("teacherId", moderationCase.teacherId);
      if (trustError) throw new Error(trustError.message);
    }
    if (input.action === "ban_teacher") {
      if (input.confirmation !== "BAN") throw new Error('Type "BAN" to confirm the account and phone ban.');
      await banTeacherForModeration({ teacherId: moderationCase.teacherId, actorId: actor.id, reason: input.note });
    }
  }
  await auditAdminAction({
    actorId: actor.id,
    action: `teacher_content.${input.action}`,
    targetType: "content_moderation_case",
    targetId: input.caseId,
    reason: input.note,
    before: { status: data.status, teacherId: data.teacherId },
    after: { status: input.action === "approve_content" ? "overridden" : "rejected" },
    requestId
  });
  return NextResponse.json({ ok: true });
}

async function reviewAppeal(input: z.infer<typeof appealReviewSchema>, request: Request) {
  const { actor, admin, requestId } = await adminContext();
  const { data: appeal, error } = await admin.from("ModerationAppeal").select("*").eq("id", input.appealId).eq("status", "pending").maybeSingle();
  if (error) throw new Error(error.message);
  if (!appeal) throw new Error("This appeal is no longer awaiting review.");
  if (input.action === "overturn_appeal") {
    const { data: trust } = await admin.from("TeacherTrustProfile").select("status").eq("teacherId", appeal.teacherId).maybeSingle();
    if (trust?.status === "banned") await unbanTeacherAfterAppeal({ teacherId: String(appeal.teacherId), actorId: actor.id });
    if (appeal.caseId) {
      const { data: moderationCase, error: caseError } = await admin.from("ContentModerationCase").select("*").eq("id", appeal.caseId).maybeSingle();
      if (caseError || !moderationCase) throw caseError ?? new Error("The appealed content could not be found.");
      const reviewedCase = {
          id: String(moderationCase.id),
          teacherId: String(moderationCase.teacherId),
          contentType: moderationCase.contentType as ModerationContentType,
          contentId: String(moderationCase.contentId),
          snapshot: moderationCase.snapshot as Record<string, unknown>,
          status: String(moderationCase.status)
      };
      await approveModerationCase({
        moderationCase: reviewedCase,
        reviewerId: actor.id,
        note: input.note
      });
      await notifyApprovedClassQuiz(reviewedCase, request);
    }
  }
  const now = new Date().toISOString();
  const status = input.action === "overturn_appeal" ? "overturned" : "upheld";
  const { error: updateError } = await admin.from("ModerationAppeal").update({
    status,
    resolutionNote: input.note,
    resolvedBy: actor.id,
    resolvedAt: now
  }).eq("id", input.appealId).eq("status", "pending");
  if (updateError) throw new Error(updateError.message);
  await auditAdminAction({
    actorId: actor.id,
    action: `moderation_appeal.${status}`,
    targetType: "moderation_appeal",
    targetId: input.appealId,
    reason: input.note,
    before: { status: "pending" },
    after: { status },
    requestId
  });
  return NextResponse.json({ ok: true });
}

async function notifyApprovedClassQuiz(
  moderationCase: {
    teacherId: string;
    contentType: ModerationContentType;
    contentId: string;
    snapshot: Record<string, unknown>;
  },
  request: Request
) {
  if (moderationCase.contentType !== "class_quiz") return;
  const classId = String(moderationCase.snapshot.classId ?? "");
  if (!classId) return;
  await sendQuizAssignmentMessages({
    teacherId: moderationCase.teacherId,
    assignments: [{ id: moderationCase.contentId, classId }],
    startAt: typeof moderationCase.snapshot.startAt === "string" ? moderationCase.snapshot.startAt : null,
    deadline: typeof moderationCase.snapshot.deadline === "string" ? moderationCase.snapshot.deadline : null,
    quizUrl: (assignedClassId, quizId) => platformActionUrl(request, `/classes/${assignedClassId}/quizzes/${quizId}`)
  });
}
