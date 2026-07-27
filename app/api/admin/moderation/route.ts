import { NextResponse } from "next/server";
import { z } from "zod";
import { adminContext, auditAdminAction, listAllAuthUsers } from "@/lib/admin/admin-server";
import type { PublicLearningSnapshot } from "@/lib/public-learning/publication-server";

const reviewSchema = z.object({
  revisionId: z.string().uuid(),
  action: z.enum(["approve", "changes_requested"]),
  note: z.string().trim().max(1000).optional()
}).superRefine((input, context) => {
  if (input.action === "changes_requested" && (!input.note || input.note.length < 4)) {
    context.addIssue({ code: "custom", path: ["note"], message: "Explain what the teacher should change." });
  }
});

function displayName(user: { id: string; user_metadata?: Record<string, unknown>; email?: string | null; phone?: string | null } | undefined) {
  const value = user?.user_metadata?.display_name;
  return typeof value === "string" && value.trim() ? value.trim() : user?.email || user?.phone || "Teacher";
}

export async function GET() {
  try {
    const { admin } = await adminContext();
    const [{ data: revisions, error }, users] = await Promise.all([
      admin.from("PublicLearningRevision")
        .select("id,courseId,version,status,snapshot,submittedBy,submittedAt")
        .eq("status", "pending_review")
        .order("submittedAt", { ascending: false })
        .limit(40),
      listAllAuthUsers()
    ]);
    if (error) throw new Error(error.message);
    const userById = new Map(users.map((user) => [user.id, user]));
    return NextResponse.json({
      items: (revisions ?? []).map((revision) => {
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
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Public Learning reviews.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { actor, admin, requestId } = await adminContext();
    const input = reviewSchema.parse(await request.json());
    const { data: revision, error: readError } = await admin
      .from("PublicLearningRevision")
      .select("id,courseId,version,status")
      .eq("id", input.revisionId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!revision || revision.status !== "pending_review") throw new Error("This submission is no longer awaiting review.");

    if (input.action === "approve") {
      const { error } = await admin.rpc("activate_public_learning_revision", {
        revision_id: input.revisionId,
        reviewer_id: actor.id
      });
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to review Public Learning content.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 400 });
  }
}
