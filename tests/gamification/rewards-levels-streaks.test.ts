import { describe, expect, it } from "vitest";
import { badgeDefinitions } from "@/domains/gamification/config/reward-rules";
import { determineAdaptiveProgression } from "@/domains/gamification/services/adaptive-progression";
import { createBadgeAward } from "@/domains/gamification/services/badges";
import { getLevelFromXp, getLevelProgress, getLevelTitle } from "@/domains/gamification/services/levels";
import {
  calculateXpBalance,
  canAwardReward,
  createRewardReversal,
  createRewardTransaction
} from "@/domains/gamification/services/rewards";
import { calculateStars, mergeStarAward } from "@/domains/gamification/services/stars";
import {
  calculateStreakBonusEligibility,
  qualifiesForLearningDay,
  updateStreak
} from "@/domains/gamification/services/streaks";
import type { RewardTransaction, StreakRecord } from "@/domains/gamification/types";

const now = "2026-07-21T10:00:00.000Z";

describe("reward ledger", () => {
  it("prevents duplicate rewards and calculates balance", () => {
    const result = createRewardTransaction(
      {
        id: "reward-1",
        studentId: "student",
        sourceType: "answer",
        sourceId: "block",
        ruleKey: "answer_first_attempt",
        xpAmount: 10,
        idempotencyKey: "same",
        awardedAt: now
      },
      []
    );

    expect(result.awarded).toBe(true);
    const transaction = result.transaction as RewardTransaction;
    expect(canAwardReward("same", [transaction])).toBe(false);
    expect(calculateXpBalance([transaction])).toBe(10);
    expect(calculateXpBalance([transaction, createRewardReversal(transaction, { id: "reverse", awardedAt: now, idempotencyKey: "reverse" })])).toBe(0);
  });
});

describe("stars, levels and badges", () => {
  it("calculates star thresholds and never decreases", () => {
    expect(calculateStars(false, 100)).toBe(0);
    expect(calculateStars(true, 69)).toBe(1);
    expect(calculateStars(true, 70)).toBe(2);
    expect(calculateStars(true, 90)).toBe(3);
    expect(mergeStarAward(3, { studentId: "student", lessonVersionId: "version", stars: 1, awardedAt: now })).toBe(3);
  });

  it("handles configured level boundaries and progress", () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(300)).toBe(2);
    expect(getLevelTitle(21)).toBe("Master Scholar");
    expect(getLevelProgress(450).xpNeededForNextLevel).toBe(250);
  });

  it("keeps unique badges deterministic", () => {
    const badge = badgeDefinitions[0];
    const first = createBadgeAward(badge, { id: "award", studentId: "student", sourceEventId: "event", awardedAt: now }, []);

    expect(first.awarded).toBe(true);
    expect(createBadgeAward(badge, { id: "award-2", studentId: "student", sourceEventId: "event", awardedAt: now }, [first.award!]).awarded).toBe(false);
  });
});

describe("streaks and adaptation", () => {
  it("requires meaningful activity and updates streaks by local date", () => {
    const record: StreakRecord = {
      id: "streak",
      studentId: "student",
      currentStreakDays: 0,
      longestStreakDays: 0,
      lastQualifyingDate: null,
      timezone: "UTC",
      updatedAt: now
    };

    expect(qualifiesForLearningDay({ verb: "lesson_started", occurredAt: now })).toBe(false);
    const first = updateStreak(record, { verb: "answer_submitted", occurredAt: "2026-07-21T10:00:00.000Z" });
    const sameDay = updateStreak(first, { verb: "block_completed", occurredAt: "2026-07-21T12:00:00.000Z" });
    const second = updateStreak(sameDay, { verb: "lesson_completed", occurredAt: "2026-07-22T10:00:00.000Z" });

    expect(sameDay.currentStreakDays).toBe(1);
    expect(second.currentStreakDays).toBe(2);
    expect(calculateStreakBonusEligibility({ ...second, currentStreakDays: 7 })).toBe(true);
  });

  it("returns explainable adaptive decisions", () => {
    expect(determineAdaptiveProgression({ score: 85, currentDifficulty: "beginner" }).lessonStatus).toBe("mastered");
    expect(determineAdaptiveProgression({ score: 65, currentDifficulty: "beginner" }).recommendation).toBe("targeted_practice");
    expect(determineAdaptiveProgression({ score: 30, currentDifficulty: "beginner" }).unlockNextLesson).toBe(false);
  });
});
