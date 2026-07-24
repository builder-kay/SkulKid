import { describe, expect, it } from "vitest";
import { buildCourseLessonOrder } from "@/lib/courses/module-lesson-order";

describe("module lesson ordering", () => {
  it("orders lessons by module sequence then local order", () => {
    expect(
      buildCourseLessonOrder(
        ["module-1", "module-2"],
        [
          { id: "l3", unitId: "module-2" },
          { id: "l1", unitId: "module-1" },
          { id: "l2", unitId: "module-1" },
          { id: "orphan", unitId: null }
        ],
        { "module-1": ["l2", "l1"] }
      )
    ).toEqual(["l2", "l1", "l3", "orphan"]);
  });
});
