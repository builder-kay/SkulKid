import { describe, expect, it } from "vitest";
import { quizHasEnded, scorePascoPractice } from "@/lib/quizzes/pasco-rules";

describe("PASCO archive rules", () => {
  const now = new Date("2026-07-25T12:00:00.000Z").getTime();

  it("includes manually closed and expired published quizzes", () => {
    expect(quizHasEnded({ status: "closed", deadline: null }, now)).toBe(true);
    expect(quizHasEnded({ status: "published", deadline: "2026-07-25T11:59:59.000Z" }, now)).toBe(true);
    expect(quizHasEnded({ status: "published", deadline: "2026-07-25T12:00:00.000Z" }, now)).toBe(true);
  });

  it("excludes drafts, future deadlines, and unscheduled open quizzes", () => {
    expect(quizHasEnded({ status: "draft", deadline: "2026-07-24T12:00:00.000Z" }, now)).toBe(false);
    expect(quizHasEnded({ status: "published", deadline: "2026-07-26T12:00:00.000Z" }, now)).toBe(false);
    expect(quizHasEnded({ status: "published", deadline: null }, now)).toBe(false);
  });

  it("scores local practice without needing an attempt record", () => {
    const questions = [{ id: "one", correctIndex: 0 }, { id: "two", correctIndex: 2 }];
    expect(scorePascoPractice(questions, { one: 0, two: 1 })).toBe(50);
    expect(scorePascoPractice(questions, { one: 0, two: 2 })).toBe(100);
    expect(scorePascoPractice([], {})).toBe(0);
  });
});
