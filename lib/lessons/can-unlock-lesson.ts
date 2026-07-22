import type { Lesson } from "@/types/lesson";
import type { StudentLessonProgress } from "@/types/progress";

const UNLOCKING_PROGRESS_STATUSES = new Set(["completed", "mastered"]);

export function canUnlockLesson(
  lesson: Lesson,
  progressRecords: StudentLessonProgress[],
  allLessons: Lesson[]
): boolean {
  if (lesson.status !== "published") {
    return false;
  }

  if (lesson.prerequisiteLessonId === null) {
    return true;
  }

  const prerequisite = allLessons.find((candidate) => candidate.id === lesson.prerequisiteLessonId);

  if (!prerequisite || prerequisite.status !== "published") {
    return false;
  }

  const prerequisiteProgress = progressRecords.find(
    (progress) => progress.lessonId === lesson.prerequisiteLessonId
  );

  return prerequisiteProgress
    ? UNLOCKING_PROGRESS_STATUSES.has(prerequisiteProgress.status)
    : false;
}
