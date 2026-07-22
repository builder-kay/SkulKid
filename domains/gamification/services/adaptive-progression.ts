import type { LessonDifficulty } from "@/domains/curriculum/types";
import type { AdaptationDecision } from "@/domains/gamification/types";

const difficultyOrder: LessonDifficulty[] = [
  "foundation",
  "beginner",
  "developing",
  "proficient",
  "challenge"
];

export type DetermineAdaptationInput = {
  score: number;
  currentDifficulty: LessonDifficulty;
  attemptCount?: number;
  hintsUsed?: number;
  objectiveMasteryAverage?: number;
};

export function determineAdaptiveProgression(input: DetermineAdaptationInput): AdaptationDecision {
  if (input.score >= 80) {
    return {
      lessonStatus: "mastered",
      unlockNextLesson: true,
      recommendation: "continue",
      recommendedDifficulty: stepDifficulty(input.currentDifficulty, 1),
      shouldShowHints: false,
      reasonCode: "score_mastery_band",
      studentMessage: "You showed strong understanding, so the next lesson is ready."
    };
  }

  if (input.score >= 50) {
    return {
      lessonStatus: "completed",
      unlockNextLesson: true,
      recommendation: "targeted_practice",
      recommendedDifficulty: input.currentDifficulty,
      shouldShowHints: true,
      reasonCode: input.hintsUsed && input.hintsUsed > 0 ? "practice_after_hint_use" : "score_practice_band",
      studentMessage: "You passed. A little focused practice can make this even stronger."
    };
  }

  return {
    lessonStatus: "revision_recommended",
    unlockNextLesson: false,
    recommendation: "remedial_lesson",
    recommendedDifficulty: stepDifficulty(input.currentDifficulty, -1),
    shouldShowHints: true,
    reasonCode: input.attemptCount && input.attemptCount > 1 ? "repeated_revision_needed" : "score_revision_band",
    studentMessage: "Let’s review this idea together before moving to the next core lesson."
  };
}

function stepDifficulty(currentDifficulty: LessonDifficulty, step: number): LessonDifficulty {
  const index = difficultyOrder.indexOf(currentDifficulty);
  const nextIndex = Math.max(0, Math.min(difficultyOrder.length - 1, index + step));
  return difficultyOrder[nextIndex];
}
