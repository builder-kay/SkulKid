import { describe, expect, it } from "vitest";
import {
  filterTeacherTutorials,
  teacherTutorialPaths,
  teacherTutorials
} from "@/lib/teacher/tutorials";

describe("teacher tutorial catalogue", () => {
  it("has unique deep-link topics and covers every learning path", () => {
    const ids = teacherTutorials.map((tutorial) => tutorial.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const path of teacherTutorialPaths) {
      expect(teacherTutorials.some((tutorial) => tutorial.path === path.id)).toBe(true);
    }
  });

  it("provides complete, teacher-facing guidance and authenticated actions", () => {
    for (const tutorial of teacherTutorials) {
      expect(tutorial.prerequisites.length).toBeGreaterThan(0);
      expect(tutorial.steps.length).toBeGreaterThan(1);
      expect(tutorial.success.length).toBeGreaterThan(10);
      expect(tutorial.mistakes.length).toBeGreaterThan(0);
      expect(tutorial.visual.length).toBeGreaterThan(1);
      expect(tutorial.action.href.startsWith("/teacher")).toBe(true);
    }
  });

  it("includes all workflow topics used by contextual help links", () => {
    const ids = new Set(teacherTutorials.map((tutorial) => tutorial.id));
    for (const id of [
      "create-class",
      "create-course",
      "create-lesson",
      "link-lessons",
      "reusable-quiz",
      "messages",
      "teacher-settings"
    ]) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it("searches instructional content and filters by learning path", () => {
    expect(filterTeacherTutorials(teacherTutorials, "PASCO", "all").map((item) => item.id))
      .toContain("quiz-results");
    expect(filterTeacherTutorials(teacherTutorials, "Public Learning", "build").length)
      .toBeGreaterThan(0);
    expect(filterTeacherTutorials(teacherTutorials, "", "communicate").every((item) => item.path === "communicate"))
      .toBe(true);
    expect(filterTeacherTutorials(teacherTutorials, "no matching teacher workflow", "all"))
      .toEqual([]);
  });

  it("documents sensitive and publishing workflows explicitly", () => {
    expect(teacherTutorials.find((item) => item.id === "point-deductions")?.note?.tone).toBe("safety");
    expect(teacherTutorials.find((item) => item.id === "publish-public-learning")?.note?.tone).toBe("publishing");
    expect(teacherTutorials.find((item) => item.id === "assign-quiz")?.steps.join(" ")).toMatch(/SMS/i);
  });
});
