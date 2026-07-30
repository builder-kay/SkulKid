import { describe, expect, it } from "vitest";
import { inWindow, isoDurationSeconds } from "./policy";

describe("Break Zone policy helpers", () => {
  it("parses YouTube ISO durations", () => {
    expect(isoDurationSeconds("PT18M5S")).toBe(1085);
    expect(isoDurationSeconds("PT1H2M3S")).toBe(3723);
  });
  it("supports an overnight break window in Accra", () => {
    const window = { dayOfWeek: 1, startsAt: "23:30", endsAt: "00:30", timezone: "Africa/Accra" };
    expect(inWindow(new Date("2026-07-27T23:45:00Z"), window)).toBe(true);
    expect(inWindow(new Date("2026-07-28T00:15:00Z"), window)).toBe(true);
    expect(inWindow(new Date("2026-07-28T01:00:00Z"), window)).toBe(false);
  });
});
