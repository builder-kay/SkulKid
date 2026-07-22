import { z } from "zod";

export const rewardTransactionSchema = z.object({
  id: z.string().min(1),
  studentId: z.string().min(1),
  sourceType: z.enum([
    "answer",
    "lesson_completion",
    "score_improvement",
    "perfect_lesson",
    "daily_goal",
    "streak",
    "badge",
    "admin_adjustment",
    "reversal"
  ]),
  sourceId: z.string().min(1),
  ruleKey: z.string().min(1),
  xpAmount: z.number().int(),
  metadataJson: z.record(z.string(), z.unknown()),
  idempotencyKey: z.string().min(1),
  awardedAt: z.string().datetime(),
  reversedAt: z.string().datetime().nullable(),
  reversalTransactionId: z.string().min(1).nullable()
});

export const adaptationDecisionSchema = z.object({
  lessonStatus: z.enum([
    "locked",
    "available",
    "in_progress",
    "completed",
    "mastered",
    "revision_recommended"
  ]),
  unlockNextLesson: z.boolean(),
  recommendation: z.enum(["continue", "targeted_practice", "remedial_lesson"]),
  recommendedDifficulty: z.enum(["foundation", "beginner", "developing", "proficient", "challenge"]),
  shouldShowHints: z.boolean(),
  reasonCode: z.string().min(1),
  studentMessage: z.string().min(1)
});

export const gamificationConfigurationSchema = z.object({
  rewardRules: z.array(
    z.object({
      key: z.string().min(1),
      sourceType: z.string().min(1),
      xpAmount: z.number().int(),
      active: z.boolean()
    })
  ),
  levels: z.array(
    z.object({
      level: z.number().int().positive(),
      minimumXp: z.number().int().nonnegative(),
      title: z.string().min(1)
    })
  )
});
