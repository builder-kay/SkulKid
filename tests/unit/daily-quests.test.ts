import { describe, expect, it } from "vitest";
import { accraWeekStart, pickDailyQuestId } from "@/lib/gamification/daily-quests";
import { ensureDailyQuest, type GameState } from "@/lib/gamification/student-game";

describe("daily quests", () => {
  it("picks a stable quest for a date key", () => {
    expect(pickDailyQuestId("2026-07-31")).toBe(pickDailyQuestId("2026-07-31"));
    expect(["finish_lesson", "beat_yesterday", "kind_message"]).toContain(pickDailyQuestId("2026-07-31"));
  });

  it("computes Accra Monday week starts", () => {
    // Friday 31 Jul 2026 Accra → week starts Monday 27 Jul 2026
    expect(accraWeekStart(new Date("2026-07-31T15:00:00.000Z"))).toBe("2026-07-27");
  });

  it("rolls quest fields onto a new Accra day", () => {
    const state = {
      xp: 40,
      avatarPoints: 40,
      unlockedAvatarAssetIds: [],
      stars: 2,
      streak: 1,
      completedLessonIds: ["lesson-1"],
      completedVideoPromptIds: [],
      claimedDailyReward: null,
      surpriseCount: 0,
      lastReward: null,
      dailyLearningDate: "2026-07-30",
      dailyLearningXp: 18,
      lastStreakDate: "2026-07-30",
      quizRecords: {},
      history: [],
      yesterdayLearningXp: 5,
      questDate: "2026-07-30",
      questId: "finish_lesson",
      questProgress: 1,
      questClaimed: true
    } as GameState;

    const next = ensureDailyQuest(state);
    expect(next.questDate).not.toBe("2026-07-30");
    expect(next.yesterdayLearningXp).toBe(18);
    expect(next.questClaimed).toBe(false);
    expect(next.questProgress).toBe(0);
    expect(next.questId).toBeTruthy();
  });
});
