import { describe, expect, it } from "vitest";
import {
  calculateAnswerXp,
  calculateLessonCompletionXp,
  XP_RULES
} from "@/lib/gamification/calculate-xp";

describe("calculateAnswerXp", () => {
  it("awards first-attempt answer XP", () => {
    expect(calculateAnswerXp(true, 1)).toBe(XP_RULES.ANSWER_FIRST_ATTEMPT_XP);
  });

  it("awards retry answer XP", () => {
    expect(calculateAnswerXp(true, 2)).toBe(XP_RULES.ANSWER_RETRY_XP);
  });

  it("awards no answer XP when incorrect", () => {
    expect(calculateAnswerXp(false, 1)).toBe(0);
  });
});

describe("calculateLessonCompletionXp", () => {
  it("awards lesson completion XP", () => {
    expect(
      calculateLessonCompletionXp({
        isCompleted: true,
        isPerfectScore: false,
        previousBestScore: null,
        currentScore: 70
      })
    ).toBe(XP_RULES.LESSON_COMPLETION_XP);
  });

  it("adds the perfect-score bonus", () => {
    expect(
      calculateLessonCompletionXp({
        isCompleted: true,
        isPerfectScore: true,
        previousBestScore: null,
        currentScore: 100
      })
    ).toBe(XP_RULES.LESSON_COMPLETION_XP + XP_RULES.PERFECT_LESSON_BONUS_XP);
  });

  it("adds the improved previous score bonus", () => {
    expect(
      calculateLessonCompletionXp({
        isCompleted: true,
        isPerfectScore: false,
        previousBestScore: 60,
        currentScore: 80
      })
    ).toBe(XP_RULES.LESSON_COMPLETION_XP + XP_RULES.IMPROVED_SCORE_BONUS_XP);
  });
});
