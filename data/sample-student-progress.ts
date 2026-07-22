import type { StudentProfile, StudentLessonProgress } from "@/types/progress";

const timestamp = "2026-07-21T00:00:00.000Z";

export const sampleStudentProfile: StudentProfile = {
  id: "student-preview-1",
  displayName: "Preview Learner",
  age: 10,
  totalXp: 720,
  currentLevel: 2,
  dailyGoalXp: 60,
  currentStreakDays: 4
};

export const sampleStudentProgress: StudentLessonProgress[] = [
  {
    id: "progress-introduction-to-fractions",
    studentId: sampleStudentProfile.id,
    lessonId: "lesson-introduction-to-fractions",
    status: "completed",
    currentBlockIndex: 7,
    bestScore: 75,
    latestScore: 75,
    attemptsCount: 1,
    starsEarned: 2,
    xpEarned: 70,
    startedAt: timestamp,
    completedAt: timestamp,
    lastAccessedAt: timestamp
  }
];
