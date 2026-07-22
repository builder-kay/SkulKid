import type { LessonDifficulty } from "@/domains/curriculum/types";
import type { LessonProgressStatus, LearningEvent } from "@/domains/learning/types";

export type RewardSourceType =
  | "answer"
  | "lesson_completion"
  | "score_improvement"
  | "perfect_lesson"
  | "daily_goal"
  | "streak"
  | "badge"
  | "admin_adjustment"
  | "reversal";

export type RewardTransaction = {
  id: string;
  studentId: string;
  sourceType: RewardSourceType;
  sourceId: string;
  ruleKey: string;
  xpAmount: number;
  metadataJson: Record<string, unknown>;
  idempotencyKey: string;
  awardedAt: string;
  reversedAt: string | null;
  reversalTransactionId: string | null;
};

export type RewardRule = {
  key: string;
  sourceType: RewardSourceType;
  xpAmount: number;
  active: boolean;
};

export type LevelDefinition = {
  level: number;
  minimumXp: number;
  title: string;
};

export type LevelProgress = {
  currentLevel: number;
  title: string;
  currentLevelMinimumXp: number;
  nextLevelMinimumXp: number;
  xpIntoCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercentage: number;
};

export type BadgeCategory =
  | "learning"
  | "mastery"
  | "improvement"
  | "consistency"
  | "exploration";

export type BadgeDefinition = {
  id: string;
  key: string;
  name: string;
  description: string;
  iconKey: string;
  category: BadgeCategory;
  rarity: "common" | "uncommon" | "rare";
  criteriaType: string;
  criteriaJson: Record<string, unknown>;
  active: boolean;
  repeatable?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BadgeAward = {
  id: string;
  studentId: string;
  badgeId: string;
  sourceEventId: string;
  awardedAt: string;
  metadataJson: Record<string, unknown>;
};

export type StreakRecord = {
  id: string;
  studentId: string;
  currentStreakDays: number;
  longestStreakDays: number;
  lastQualifyingDate: string | null;
  timezone: string;
  updatedAt: string;
};

export type StarAward = {
  studentId: string;
  lessonVersionId: string;
  stars: number;
  awardedAt: string;
};

export type AdaptationDecision = {
  lessonStatus: LessonProgressStatus;
  unlockNextLesson: boolean;
  recommendation: "continue" | "targeted_practice" | "remedial_lesson";
  recommendedDifficulty: LessonDifficulty;
  shouldShowHints: boolean;
  reasonCode: string;
  studentMessage: string;
};

export type StreakLearningEvent = Pick<LearningEvent, "verb" | "occurredAt">;
