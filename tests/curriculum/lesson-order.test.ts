import { describe, expect, it } from "vitest";
import { normaliseOrder, placeLessonIdAfter } from "@/lib/admin/lesson-library";

describe("admin lesson ordering", () => {
  it("places a new lesson directly after its selected predecessor", () => {
    expect(placeLessonIdAfter(["lesson-1", "lesson-2", "lesson-3"], "lesson-3", "lesson-1")).toEqual(["lesson-1", "lesson-3", "lesson-2"]);
  });

  it("keeps saved order while appending newly available lessons", () => {
    expect(normaliseOrder(["lesson-2", "lesson-1"], ["lesson-1", "lesson-2", "lesson-3"])).toEqual(["lesson-2", "lesson-1", "lesson-3"]);
  });
});
