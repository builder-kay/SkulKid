import { beforeEach, describe, expect, it } from "vitest";
import { normaliseOrder, placeLessonAfter, readLessonOrder } from "@/lib/admin/lesson-library";

describe("admin lesson ordering", () => {
  beforeEach(() => window.localStorage.clear());

  it("places a new lesson directly after its selected predecessor", () => {
    placeLessonAfter("english-language", "lesson-3", "lesson-1", ["lesson-1", "lesson-2", "lesson-3"]);
    expect(readLessonOrder("english-language")).toEqual(["lesson-1", "lesson-3", "lesson-2"]);
  });

  it("keeps saved order while appending newly available lessons", () => {
    expect(normaliseOrder(["lesson-2", "lesson-1"], ["lesson-1", "lesson-2", "lesson-3"])).toEqual(["lesson-2", "lesson-1", "lesson-3"]);
  });
});
