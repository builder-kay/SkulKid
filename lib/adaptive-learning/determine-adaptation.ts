import type { AdaptationDecision } from "@/types/adaptive-learning";

export function determineAdaptation(score: number): AdaptationDecision {
  if (score >= 80) {
    return {
      status: "mastered",
      unlockNextLesson: true,
      recommendation: "continue",
      message: "Excellent work. You understand this lesson and are ready to keep going.",
      recommendedDifficulty: "intermediate",
      shouldShowHints: false
    };
  }

  if (score >= 50) {
    return {
      status: "completed",
      unlockNextLesson: true,
      recommendation: "targeted_practice",
      message: "Good progress. A little focused practice will make this idea even stronger.",
      recommendedDifficulty: "beginner",
      shouldShowHints: true
    };
  }

  return {
    status: "revision_required",
    unlockNextLesson: false,
    recommendation: "remedial_lesson",
    message: "You are still learning this idea. Review the lesson and try the practice again.",
    recommendedDifficulty: "beginner",
    shouldShowHints: true
  };
}
