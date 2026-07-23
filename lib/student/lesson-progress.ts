import type { StudentLessonProgress } from "@/types/progress";

type QuizProgressRecord = {
  bestScore?: number;
  passed?: boolean;
  stars?: number;
};

/**
 * Builds the progress records used by course cards and learning paths from the
 * authenticated learner's persisted game state.
 */
export function lessonProgressFromGameState(
  studentId: string,
  completedLessonIds: string[],
  quizRecords: Record<string, QuizProgressRecord>
): StudentLessonProgress[] {
  const now = new Date().toISOString();
  const lessonIds = new Set([...completedLessonIds, ...Object.keys(quizRecords)]);

  return Array.from(lessonIds, (lessonId) => {
    const quiz = quizRecords[lessonId];
    const completed = completedLessonIds.includes(lessonId);
    const score = Math.max(0, Math.min(100, Math.round(quiz?.bestScore ?? 0)));
    const mastered = completed && score >= 80;

    return {
      id: `game-state-${lessonId}`,
      studentId,
      lessonId,
      status: mastered ? "mastered" : completed ? "completed" : quiz?.passed ? "in_progress" : "revision_required",
      currentBlockIndex: 0,
      bestScore: score,
      latestScore: score,
      attemptsCount: quiz ? 1 : 0,
      starsEarned: Math.max(0, Math.min(3, Math.round(quiz?.stars ?? 0))),
      xpEarned: 0,
      startedAt: now,
      completedAt: completed ? now : null,
      lastAccessedAt: now
    };
  });
}
