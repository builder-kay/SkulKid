import type { Lesson } from "@/types/lesson";
import type { StudentLessonProgress, StudentLessonStatus } from "@/types/progress";
import { canUnlockLesson } from "@/lib/lessons/can-unlock-lesson";

export function resolveLessonStatus(
  lesson: Lesson,
  progressRecords: StudentLessonProgress[],
  allLessons: Lesson[]
): StudentLessonStatus {
  const existingProgress = progressRecords.find((progress) => progress.lessonId === lesson.id);

  if (existingProgress) {
    return existingProgress.status;
  }

  return canUnlockLesson(lesson, progressRecords, allLessons) ? "available" : "locked";
}
