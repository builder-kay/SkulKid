import type { LessonBlock } from "@/domains/curriculum/types";

export type LessonProgressStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "mastered"
  | "revision_recommended";

export type LessonSessionStatus = "active" | "paused" | "completed" | "abandoned";

export type BlockAttemptStatus =
  | "unanswered"
  | "correct"
  | "partially_correct"
  | "incorrect"
  | "skipped";

export type MasteryStatus = "not_started" | "emerging" | "developing" | "proficient" | "mastered";

export type StudentLessonProgress = {
  id: string;
  studentId: string;
  lessonId: string;
  activeLessonVersionId: string;
  status: LessonProgressStatus;
  currentBlockId: string | null;
  completedRequiredBlocks: number;
  totalRequiredBlocks: number;
  progressPercentage: number;
  latestScore: number;
  bestScore: number;
  latestAccuracy: number;
  bestAccuracy: number;
  attemptCount: number;
  stars: number;
  totalXpEarnedFromLesson: number;
  firstStartedAt: string | null;
  lastAccessedAt: string | null;
  firstCompletedAt: string | null;
  masteredAt: string | null;
  revisionRecommendedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LessonSession = {
  id: string;
  studentId: string;
  lessonId: string;
  lessonVersionId: string;
  status: LessonSessionStatus;
  startedAt: string;
  lastActivityAt: string;
  pausedAt: string | null;
  completedAt: string | null;
  currentBlockId: string | null;
  deviceSessionId: string;
  durationSeconds: number;
  createdAt: string;
  updatedAt: string;
};

export type LessonAttempt = {
  id: string;
  studentId: string;
  lessonId: string;
  lessonVersionId: string;
  lessonSessionId: string;
  attemptNumber: number;
  scorePercentage: number;
  accuracyPercentage: number;
  totalAssessments: number;
  correctAssessments: number;
  partiallyCorrectAssessments: number;
  incorrectAssessments: number;
  xpAwarded: number;
  starsAwarded: number;
  passed: boolean;
  mastered: boolean;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
};

export type BlockAttempt = {
  id: string;
  lessonAttemptId: string;
  blockId: string;
  attemptNumber: number;
  status: BlockAttemptStatus;
  scoreEarned: number;
  scorePossible: number;
  xpAwarded: number;
  hintUsed: boolean;
  responseTimeSeconds: number;
  submittedAt: string;
};

export type StudentResponse = {
  id: string;
  blockAttemptId: string;
  responseJson: unknown;
  normalisedResponseJson: unknown;
  isCorrect: boolean;
  feedbackShown: string;
  createdAt: string;
};

export type MasteryRecord = {
  id: string;
  studentId: string;
  learningObjectiveId: string;
  masteryStatus: MasteryStatus;
  masteryScore: number;
  evidenceCount: number;
  lastEvidenceAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LearningEventVerb =
  | "lesson_started"
  | "lesson_resumed"
  | "block_viewed"
  | "answer_submitted"
  | "hint_requested"
  | "block_completed"
  | "lesson_paused"
  | "lesson_completed"
  | "lesson_mastered"
  | "reward_earned";

export type LearningEventObjectType =
  | "lesson"
  | "lesson_block"
  | "assessment"
  | "learning_objective"
  | "reward";

export type LearningEvent = {
  id: string;
  studentId: string;
  sessionId: string;
  lessonId: string;
  lessonVersionId: string;
  blockId: string | null;
  verb: LearningEventVerb;
  objectType: LearningEventObjectType;
  objectId: string;
  resultJson: Record<string, unknown>;
  contextJson: Record<string, unknown>;
  occurredAt: string;
  recordedAt: string;
  eventVersion: number;
  idempotencyKey: string;
};

export type AnswerEvaluation<TFeedback = unknown> = {
  status: Extract<BlockAttemptStatus, "correct" | "partially_correct" | "incorrect">;
  scoreEarned: number;
  scorePossible: number;
  feedback: TFeedback;
};

export type ProgressTransitionEvent =
  | { type: "start_lesson"; at: string; lessonVersionId: string; firstBlockId: string | null }
  | { type: "complete_required_block"; at: string; blockId: string; requiredBlocks: LessonBlock[] }
  | { type: "submit_attempt"; at: string; attempt: LessonAttempt }
  | { type: "recommend_revision"; at: string }
  | { type: "master_lesson"; at: string };

export type ProgressTransitionResult = {
  ok: boolean;
  state: StudentLessonProgress;
  issue?: {
    code: string;
    message: string;
  };
};
