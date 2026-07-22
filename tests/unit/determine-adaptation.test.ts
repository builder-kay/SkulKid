import { describe, expect, it } from "vitest";
import { determineAdaptation } from "@/lib/adaptive-learning/determine-adaptation";

describe("determineAdaptation", () => {
  it("masters and unlocks for scores of 80 or higher", () => {
    expect(determineAdaptation(80)).toMatchObject({
      status: "mastered",
      unlockNextLesson: true,
      recommendation: "continue",
      shouldShowHints: false
    });
  });

  it("completes and recommends targeted practice for scores from 50 to 79", () => {
    expect(determineAdaptation(79)).toMatchObject({
      status: "completed",
      unlockNextLesson: true,
      recommendation: "targeted_practice",
      shouldShowHints: true
    });
  });

  it("requires revision and blocks unlocking for scores below 50", () => {
    expect(determineAdaptation(49)).toMatchObject({
      status: "revision_required",
      unlockNextLesson: false,
      recommendation: "remedial_lesson",
      shouldShowHints: true
    });
  });
});
