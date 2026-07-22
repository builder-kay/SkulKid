import type { Lesson, LessonVersion, ValidationIssue, ValidationResult } from "@/domains/curriculum/types";

export function getActivePublishedVersion(
  lessonId: string,
  versions: LessonVersion[]
): LessonVersion | null {
  const publishedVersions = versions
    .filter((version) => version.lessonId === lessonId && version.status === "published")
    .sort((first, second) => second.versionNumber - first.versionNumber);

  return publishedVersions[0] ?? null;
}

export function canStudentAccessLesson(lesson: Lesson, versions: LessonVersion[]) {
  const activeVersion = getActivePublishedVersion(lesson.id, versions);

  return {
    canAccess: activeVersion !== null,
    lessonVersionId: activeVersion?.id ?? null,
    reason: activeVersion ? "active_published_version" : "no_active_published_version"
  };
}

export function canPublishLessonVersion(
  version: LessonVersion,
  siblingVersions: LessonVersion[]
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const alreadyPublished = siblingVersions.some(
    (sibling) =>
      sibling.lessonId === version.lessonId &&
      sibling.id !== version.id &&
      sibling.status === "published"
  );

  if (version.status === "archived") {
    issues.push({
      code: "ARCHIVED_VERSION",
      severity: "error",
      field: "status",
      message: "Archived lesson versions cannot be published."
    });
  }

  if (alreadyPublished) {
    issues.push({
      code: "ACTIVE_VERSION_EXISTS",
      severity: "error",
      field: "status",
      message: "Only one lesson version may be actively published at a time."
    });
  }

  return { valid: issues.every((issue) => issue.severity !== "error"), issues };
}

export function validateLessonPrerequisites(lessons: Lesson[]): ValidationResult {
  const cycle = detectPrerequisiteCycle(lessons);
  const issues: ValidationIssue[] = [];

  if (cycle.length > 0) {
    issues.push({
      code: "PREREQUISITE_CYCLE",
      severity: "error",
      field: "prerequisiteLessonId",
      message: `Prerequisite cycle detected: ${cycle.join(" -> ")}`
    });
  }

  return { valid: issues.length === 0, issues };
}

export function detectPrerequisiteCycle(lessons: Lesson[]): string[] {
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));

  for (const lesson of lessons) {
    const visited = new Set<string>();
    const path: string[] = [];
    let current: Lesson | undefined = lesson;

    while (current?.prerequisiteLessonId) {
      if (visited.has(current.id)) {
        const cycleStart = path.indexOf(current.id);
        return cycleStart >= 0 ? [...path.slice(cycleStart), current.id] : [current.id];
      }

      visited.add(current.id);
      path.push(current.id);
      current = byId.get(current.prerequisiteLessonId);
    }
  }

  return [];
}
