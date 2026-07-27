export type CourseAudience = "class_only" | "public" | "both";

export function deriveCourseAudience(visibility: unknown, classIds: readonly string[]): CourseAudience {
  if (visibility === "class") return "class_only";
  return classIds.length ? "both" : "public";
}

export function canSubmitPublicLearning(input: {
  allowTeacherPublishing: boolean;
  readyLessonCount: number;
  latestStatus?: string | null;
}) {
  if (!input.allowTeacherPublishing) return { allowed: false, reason: "publishing_paused" as const };
  if (input.readyLessonCount < 1) return { allowed: false, reason: "no_ready_lessons" as const };
  if (input.latestStatus === "pending_review") return { allowed: false, reason: "already_in_review" as const };
  return { allowed: true, reason: null };
}

export function publicLearnersKeepCurrentVersion(latestStatus?: string | null) {
  return latestStatus === "pending_review" || latestStatus === "changes_requested";
}
