import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { auditAdminAction } from "@/lib/admin/admin-server";
import {
  buildPublicLearningSnapshot,
  getCoursePublicationState,
  readPublicLearningSettings,
  snapshotHash
} from "@/lib/public-learning/publication-server";
import { createAdminClient } from "@/lib/supabase/admin";

const actionSchema = z.object({
  action: z.enum(["submit", "unpublish"])
});

async function ownedPublicCourse(courseId: string, teacherId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("Subject")
    .select("id,name,visibility,createdBy,currentPublicRevisionId")
    .eq("id", courseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.createdBy !== teacherId) throw new Error("You can only publish courses you created.");
  if (data.visibility === "class") throw new Error("Choose Public Learning or Classes and Public Learning before submitting.");
  return data;
}

export async function GET(_request: Request, context: { params: Promise<{ courseId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { courseId } = await context.params;
    await ownedPublicCourse(courseId, teacher.id);
    const [publication, settings] = await Promise.all([
      getCoursePublicationState(courseId),
      readPublicLearningSettings()
    ]);
    return NextResponse.json({ publication, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load publication status.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ courseId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { courseId } = await context.params;
    const input = actionSchema.parse(await request.json());
    const course = await ownedPublicCourse(courseId, teacher.id);
    const admin = createAdminClient();

    if (input.action === "unpublish") {
      const { error } = await admin.rpc("unpublish_public_learning_course", {
        selected_course_id: courseId,
        archive_course: false
      });
      if (error) throw new Error(error.message);
      await auditAdminAction({
        actorId: teacher.id,
        action: "public_learning.unpublished_by_teacher",
        targetType: "course",
        targetId: courseId,
        before: { currentPublicRevisionId: course.currentPublicRevisionId },
        after: { currentPublicRevisionId: null }
      });
      return NextResponse.json({
        ok: true,
        publication: await getCoursePublicationState(courseId),
        message: "Course removed from Public Learning. Your editable course and publication history are safe."
      });
    }

    const settings = await readPublicLearningSettings();
    if (!settings.allowTeacherPublishing) {
      return NextResponse.json({
        error: "Public Learning submissions are currently paused by an administrator. Your course remains saved as a draft."
      }, { status: 403 });
    }

    const { data: pending } = await admin
      .from("PublicLearningRevision")
      .select("id")
      .eq("courseId", courseId)
      .eq("status", "pending_review")
      .maybeSingle();
    if (pending) throw new Error("This course already has a version awaiting review.");

    const snapshot = await buildPublicLearningSnapshot(courseId);
    const contentHash = snapshotHash(snapshot);
    const { data: current } = await admin
      .from("PublicLearningRevision")
      .select("contentHash")
      .eq("id", course.currentPublicRevisionId ?? "00000000-0000-0000-0000-000000000000")
      .maybeSingle();
    if (current?.contentHash === contentHash) throw new Error("Public Learning already has this exact course version.");

    const { data: lastRevision, error: versionError } = await admin
      .from("PublicLearningRevision")
      .select("version")
      .eq("courseId", courseId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (versionError) throw new Error(versionError.message);
    const version = Number(lastRevision?.version ?? 0) + 1;
    const { data: revision, error: insertError } = await admin
      .from("PublicLearningRevision")
      .insert({
        courseId,
        version,
        status: "pending_review",
        snapshot,
        contentHash,
        submittedBy: teacher.id
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    if (!settings.requireLessonApproval) {
      const { error: activationError } = await admin.rpc("activate_public_learning_revision", {
        revision_id: revision.id,
        reviewer_id: teacher.id
      });
      if (activationError) throw new Error(activationError.message);
    }
    await auditAdminAction({
      actorId: teacher.id,
      action: settings.requireLessonApproval ? "public_learning.submitted" : "public_learning.published_directly",
      targetType: "public_learning_revision",
      targetId: String(revision.id),
      after: { courseId, version, status: settings.requireLessonApproval ? "pending_review" : "approved" }
    });

    return NextResponse.json({
      ok: true,
      publication: await getCoursePublicationState(courseId),
      message: settings.requireLessonApproval
        ? `Version ${version} was sent to the Public Learning review queue.`
        : `Version ${version} is now live in Public Learning.`
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not submit this course.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 400 });
  }
}
