import type { Lesson } from "@/types/lesson";
import type { StudentLessonProgress } from "@/types/progress";
import type { Subject } from "@/types/subject";

const COMPLETE = new Set(["completed", "mastered"]);

export function canUnlockStrand(
  lesson: Lesson,
  subject: Subject,
  allLessons: Lesson[],
  progressRecords: StudentLessonProgress[]
) {
  const strands = [...subject.units].sort((a, b) => a.order - b.order);
  const strandIndex = strands.findIndex((strand) => strand.id === lesson.unitId);
  if (strandIndex <= 0) return true;
  const strand = strands[strandIndex];
  if (!strand.requiresPrevious) return true;

  const previousStrandId = strands[strandIndex - 1].id;
  const previousLessons = allLessons.filter((candidate) => candidate.unitId === previousStrandId);
  if (!previousLessons.length) return true;
  return previousLessons.every((candidate) => {
    const progress = progressRecords.find((item) => item.lessonId === candidate.id);
    return Boolean(progress && COMPLETE.has(progress.status));
  });
}
