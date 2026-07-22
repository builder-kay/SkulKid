const ANSWER_FIRST_ATTEMPT_XP = 10;
const ANSWER_RETRY_XP = 5;
const LESSON_COMPLETION_XP = 30;
const PERFECT_LESSON_BONUS_XP = 20;
const IMPROVED_SCORE_BONUS_XP = 15;
const DAILY_GOAL_COMPLETION_XP = 25;
const SEVEN_DAY_STREAK_BONUS_XP = 50;

export type LessonCompletionXpInput = {
  isCompleted: boolean;
  isPerfectScore: boolean;
  previousBestScore: number | null;
  currentScore: number;
  completedDailyGoal?: boolean;
  completedSevenDayStreak?: boolean;
};

export function calculateAnswerXp(isCorrect: boolean, attemptNumber: number): number {
  if (!isCorrect) {
    return 0;
  }

  return attemptNumber <= 1 ? ANSWER_FIRST_ATTEMPT_XP : ANSWER_RETRY_XP;
}

export function calculateLessonCompletionXp(input: LessonCompletionXpInput): number {
  if (!input.isCompleted) {
    return 0;
  }

  const improvedPreviousScore =
    input.previousBestScore !== null && input.currentScore > input.previousBestScore;

  return [
    LESSON_COMPLETION_XP,
    input.isPerfectScore ? PERFECT_LESSON_BONUS_XP : 0,
    improvedPreviousScore ? IMPROVED_SCORE_BONUS_XP : 0,
    input.completedDailyGoal ? DAILY_GOAL_COMPLETION_XP : 0,
    input.completedSevenDayStreak ? SEVEN_DAY_STREAK_BONUS_XP : 0
  ].reduce((total, xp) => total + xp, 0);
}

export const XP_RULES = {
  ANSWER_FIRST_ATTEMPT_XP,
  ANSWER_RETRY_XP,
  LESSON_COMPLETION_XP,
  PERFECT_LESSON_BONUS_XP,
  IMPROVED_SCORE_BONUS_XP,
  DAILY_GOAL_COMPLETION_XP,
  SEVEN_DAY_STREAK_BONUS_XP
} as const;
