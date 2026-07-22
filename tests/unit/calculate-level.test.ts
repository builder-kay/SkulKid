import { describe, expect, it } from "vitest";
import { calculateLevel, getLevelTitle } from "@/lib/gamification/calculate-level";

describe("calculateLevel", () => {
  it("keeps the minimum level at 1", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("increases every 500 XP", () => {
    expect(calculateLevel(499)).toBe(1);
    expect(calculateLevel(500)).toBe(2);
    expect(calculateLevel(1000)).toBe(3);
  });
});

describe("getLevelTitle", () => {
  it("returns titles for configured level bands", () => {
    expect(getLevelTitle(1)).toBe("Beginner Explorer");
    expect(getLevelTitle(4)).toBe("Curious Learner");
    expect(getLevelTitle(7)).toBe("Knowledge Explorer");
    expect(getLevelTitle(11)).toBe("Rising Scholar");
    expect(getLevelTitle(16)).toBe("Learning Champion");
    expect(getLevelTitle(21)).toBe("Master Scholar");
  });
});
