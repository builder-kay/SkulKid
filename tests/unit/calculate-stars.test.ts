import { describe, expect, it } from "vitest";
import { calculateStars } from "@/lib/gamification/calculate-stars";

describe("calculateStars", () => {
  it("awards no stars for incomplete lessons", () => {
    expect(calculateStars(false, 100)).toBe(0);
  });

  it("awards one star for completion below 70", () => {
    expect(calculateStars(true, 69)).toBe(1);
  });

  it("awards two stars from 70", () => {
    expect(calculateStars(true, 70)).toBe(2);
  });

  it("awards three stars from 90", () => {
    expect(calculateStars(true, 90)).toBe(3);
  });
});
