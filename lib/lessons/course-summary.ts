import { canUnlockLesson } from "@/lib/lessons/can-unlock-lesson";
import type { Lesson } from "@/types/lesson";
import type { Subject } from "@/types/subject";
import type { StudentLessonProgress } from "@/types/progress";

export type CourseSummary = {
  subject: Subject;
  lessons: Lesson[];
  totalLessons: number;
  completedLessons: number;
  unlockedLessons: number;
  totalMinutes: number;
  totalXp: number;
  progressPercent: number;
  isAvailable: boolean;
};

export function getLessonsForSubject(subject: Subject, lessons: Lesson[]) {
  return lessons
    .filter((lesson) => lesson.subjectId === subject.id && lesson.status === "published")
    .sort((first, second) => first.order - second.order);
}

export function getCourseSummary(
  subject: Subject,
  lessons: Lesson[],
  progressRecords: StudentLessonProgress[]
): CourseSummary {
  const subjectLessons = getLessonsForSubject(subject, lessons);
  const completedLessons = subjectLessons.filter((lesson) => {
    const progress = progressRecords.find((record) => record.lessonId === lesson.id);
    return progress?.status === "completed" || progress?.status === "mastered";
  }).length;
  const unlockedLessons = subjectLessons.filter((lesson) =>
    canUnlockLesson(lesson, progressRecords, subjectLessons)
  ).length;
  const totalLessons = subjectLessons.length;

  return {
    subject,
    lessons: subjectLessons,
    totalLessons,
    completedLessons,
    unlockedLessons,
    totalMinutes: subjectLessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0),
    totalXp: subjectLessons.reduce((total, lesson) => total + lesson.xpReward, 0),
    progressPercent: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
    isAvailable: totalLessons > 0
  };
}
