import { describe, expect, it } from "vitest";
import { normalizeGhanaPhone } from "@/lib/auth/phone";

describe("normalizeGhanaPhone", () => {
  it.each([
    ["0241234567", "+233241234567"],
    ["233241234567", "+233241234567"],
    ["+233 24 123 4567", "+233241234567"],
    ["241234567", "+233241234567"]
  ])("normalizes %s", (input, expected) => {
    expect(normalizeGhanaPhone(input)).toBe(expected);
  });

  it("rejects an invalid number", () => {
    expect(() => normalizeGhanaPhone("1234")).toThrow("valid Ghana phone number");
  });
});
