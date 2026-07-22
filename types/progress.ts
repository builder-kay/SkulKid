export type StudentLessonStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "mastered"
  | "revision_required";

export type StudentProfile = {
  id: string;
  displayName: string;
  age: number;
  totalXp: number;
  currentLevel: number;
  dailyGoalXp: number;
  currentStreakDays: number;
};

export type StudentLessonProgress = {
  id: string;
  studentId: string;
  lessonId: string;
  status: StudentLessonStatus;
  currentBlockIndex: number;
  bestScore: number;
  latestScore: number;
  attemptsCount: number;
  starsEarned: number;
  xpEarned: number;
  startedAt: string | null;
  completedAt: string | null;
  lastAccessedAt: string | null;
};

export type StudentAnswerResponse = string | boolean | string[];

export type StudentAnswer = {
  blockId: string;
  response: StudentAnswerResponse;
  isCorrect: boolean;
  attempts: number;
  xpEarned: number;
};

export type LessonAttempt = {
  id: string;
  studentId: string;
  lessonId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  earnedXp: number;
  startedAt: string;
  completedAt: string;
  answers: StudentAnswer[];
};
