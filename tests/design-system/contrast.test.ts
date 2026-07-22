import { describe, expect, it } from "vitest";
import { passesAaForNormalText, semanticColours } from "@/domains/design-system/tokens";

describe("design token contrast", () => {
  it("passes AA for documented primary foreground/background combinations", () => {
    for (const colour of semanticColours) {
      expect(passesAaForNormalText(colour.foreground, colour.value), colour.name).toBe(true);
    }
  });
});
