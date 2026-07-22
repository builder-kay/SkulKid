import type { LessonBlock } from "@/domains/curriculum/types";
import type {
  BlockAttempt,
  LessonAttempt,
  LessonProgressStatus,
  ProgressTransitionEvent,
  ProgressTransitionResult,
  StudentLessonProgress
} from "@/domains/learning/types";

const allowedTransitions: Record<LessonProgressStatus, LessonProgressStatus[]> = {
  locked: ["available"],
  available: ["in_progress"],
  in_progress: ["completed", "mastered", "revision_recommended"],
  completed: ["mastered", "revision_recommended", "completed"],
  mastered: ["mastered"],
  revision_recommended: ["in_progress", "completed", "mastered", "revision_recommended"]
};

export function calculateRequiredBlockProgress(
  completedRequiredBlocks: number,
  totalRequiredBlocks: number
): number {
  if (totalRequiredBlocks <= 0) {
    return 0;
  }

  return roundPercentage((completedRequiredBlocks / totalRequiredBlocks) * 100);
}

export function calculateLessonScore(blockAttempts: BlockAttempt[]): number {
  const scorePossible = blockAttempts.reduce((total, attempt) => total + attempt.scorePossible, 0);
  const scoreEarned = blockAttempts.reduce((total, attempt) => total + attempt.scoreEarned, 0);
  return scorePossible === 0 ? 0 : roundPercentage((scoreEarned / scorePossible) * 100);
}

export function calculateAccuracy(blockAttempts: BlockAttempt[]): number {
  const graded = blockAttempts.filter((attempt) => attempt.scorePossible > 0);
  if (graded.length === 0) {
    return 0;
  }

  const correct = graded.filter((attempt) => attempt.status === "correct").length;
  return roundPercentage((correct / graded.length) * 100);
}

export function determinePassStatus(score: number, passingScore: number): boolean {
  return score >= passingScore;
}

export function determineMasteryStatus(score: number, masteryScore: number): boolean {
  return score >= masteryScore;
}

export function deriveLessonProgressStatus(
  score: number,
  passingScore: number,
  masteryScore: number
): Extract<LessonProgressStatus, "completed" | "mastered" | "revision_recommended"> {
  if (score >= masteryScore) {
    return "mastered";
  }

  if (score >= passingScore) {
    return "completed";
  }

  return "revision_recommended";
}

export function validateProgressTransition(
  current: LessonProgressStatus,
  next: LessonProgressStatus
): { valid: boolean; code?: string } {
  return allowedTransitions[current].includes(next)
    ? { valid: true }
    : { valid: false, code: "INVALID_PROGRESS_TRANSITION" };
}

export function transitionLessonProgress(
  currentState: StudentLessonProgress,
  event: ProgressTransitionEvent
): ProgressTransitionResult {
  if (event.type === "start_lesson") {
    return applyTransition(currentState, {
      ...currentState,
      activeLessonVersionId: event.lessonVersionId,
      status: "in_progress",
      currentBlockId: event.firstBlockId,
      firstStartedAt: currentState.firstStartedAt ?? event.at,
      lastAccessedAt: event.at,
      updatedAt: event.at
    });
  }

  if (event.type === "complete_required_block") {
    const requiredBlockIds = new Set(event.requiredBlocks.filter((block) => block.required).map((block) => block.id));
    const increment = requiredBlockIds.has(event.blockId) ? 1 : 0;
    const completedRequiredBlocks = Math.min(
      currentState.totalRequiredBlocks,
      currentState.completedRequiredBlocks + increment
    );

    return {
      ok: true,
      state: {
        ...currentState,
        completedRequiredBlocks,
        progressPercentage: calculateRequiredBlockProgress(completedRequiredBlocks, currentState.totalRequiredBlocks),
        currentBlockId: event.blockId,
        lastAccessedAt: event.at,
        updatedAt: event.at
      }
    };
  }

  if (event.type === "submit_attempt") {
    return applyTransition(currentState, mergeAttemptIntoProgress(currentState, event.attempt, event.at));
  }

  if (event.type === "recommend_revision") {
    return applyTransition(currentState, {
      ...currentState,
      status: "revision_recommended",
      revisionRecommendedAt: currentState.revisionRecommendedAt ?? event.at,
      updatedAt: event.at
    });
  }

  return applyTransition(currentState, {
    ...currentState,
    status: "mastered",
    masteredAt: currentState.masteredAt ?? event.at,
    updatedAt: event.at
  });
}

export function mergeAttemptIntoProgress(
  currentState: StudentLessonProgress,
  attempt: LessonAttempt,
  at: string = attempt.submittedAt
): StudentLessonProgress {
  const status: LessonProgressStatus = attempt.mastered
    ? "mastered"
    : attempt.passed
      ? "completed"
      : "revision_recommended";

  const bestScore = Math.max(currentState.bestScore, attempt.scorePercentage);
  const bestAccuracy = Math.max(currentState.bestAccuracy, attempt.accuracyPercentage);

  return {
    ...currentState,
    status: currentState.status === "mastered" ? "mastered" : status,
    latestScore: attempt.scorePercentage,
    bestScore,
    latestAccuracy: attempt.accuracyPercentage,
    bestAccuracy,
    attemptCount: Math.max(currentState.attemptCount, attempt.attemptNumber),
    stars: Math.max(currentState.stars, attempt.starsAwarded),
    totalXpEarnedFromLesson: currentState.totalXpEarnedFromLesson + attempt.xpAwarded,
    firstCompletedAt: attempt.passed ? currentState.firstCompletedAt ?? at : currentState.firstCompletedAt,
    masteredAt: attempt.mastered ? currentState.masteredAt ?? at : currentState.masteredAt,
    revisionRecommendedAt:
      !attempt.passed && currentState.status !== "mastered"
        ? currentState.revisionRecommendedAt ?? at
        : currentState.revisionRecommendedAt,
    lastAccessedAt: at,
    updatedAt: at
  };
}

export function createInitialProgressSnapshot(input: {
  id: string;
  studentId: string;
  lessonId: string;
  lessonVersionId: string;
  requiredBlocks: LessonBlock[];
  createdAt: string;
}): StudentLessonProgress {
  const totalRequiredBlocks = input.requiredBlocks.filter((block) => block.required).length;

  return {
    id: input.id,
    studentId: input.studentId,
    lessonId: input.lessonId,
    activeLessonVersionId: input.lessonVersionId,
    status: "available",
    currentBlockId: null,
    completedRequiredBlocks: 0,
    totalRequiredBlocks,
    progressPercentage: 0,
    latestScore: 0,
    bestScore: 0,
    latestAccuracy: 0,
    bestAccuracy: 0,
    attemptCount: 0,
    stars: 0,
    totalXpEarnedFromLesson: 0,
    firstStartedAt: null,
    lastAccessedAt: null,
    firstCompletedAt: null,
    masteredAt: null,
    revisionRecommendedAt: null,
    createdAt: input.createdAt,
    updatedAt: input.createdAt
  };
}

function applyTransition(
  currentState: StudentLessonProgress,
  nextState: StudentLessonProgress
): ProgressTransitionResult {
  const validation = validateProgressTransition(currentState.status, nextState.status);

  if (!validation.valid && currentState.status !== nextState.status) {
    return {
      ok: false,
      state: currentState,
      issue: {
        code: validation.code ?? "INVALID_PROGRESS_TRANSITION",
        message: `Cannot transition lesson progress from ${currentState.status} to ${nextState.status}.`
      }
    };
  }

  return { ok: true, state: nextState };
}

function roundPercentage(value: number): number {
  return Math.round(value * 100) / 100;
}
