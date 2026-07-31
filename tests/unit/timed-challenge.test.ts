import { describe, expect, it } from "vitest";
import { isTimedChallengeQuiz, timedChallengeCountdown } from "@/lib/classes/timed-challenge";

describe("timed challenge helpers", () => {
  const now = Date.parse("2026-07-31T12:00:00.000Z");

  it("flags quizzes ending within 48 hours", () => {
    expect(isTimedChallengeQuiz({
      status: "published",
      deadline: new Date(now + 36 * 3_600_000).toISOString(),
      now
    })).toBe(true);
  });

  it("ignores quizzes without a deadline or already ended", () => {
    expect(isTimedChallengeQuiz({ status: "published", deadline: null, now })).toBe(false);
    expect(isTimedChallengeQuiz({
      status: "published",
      deadline: new Date(now - 1_000).toISOString(),
      now
    })).toBe(false);
  });

  it("formats countdown labels", () => {
    expect(timedChallengeCountdown(new Date(now + 90 * 60_000).toISOString(), now)).toBe("1h 30m left");
  });
});
