import type { LessonDifficulty } from "@/types/lesson";
import type { StudentLessonStatus } from "@/types/progress";

export type AdaptationRecommendation =
  | "continue"
  | "targeted_practice"
  | "remedial_lesson";

export type AdaptationDecision = {
  status: Extract<StudentLessonStatus, "completed" | "mastered" | "revision_required">;
  unlockNextLesson: boolean;
  recommendation: AdaptationRecommendation;
  message: string;
  recommendedDifficulty: LessonDifficulty;
  shouldShowHints: boolean;
};
