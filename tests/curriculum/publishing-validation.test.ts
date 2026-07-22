import { describe, expect, it } from "vitest";
import { sampleCurriculum } from "@/domains/curriculum/fixtures/sample-curriculum";
import { lessonBlockSchema } from "@/domains/curriculum/schemas/lesson-block-schemas";
import { canPublishLessonVersion, canStudentAccessLesson, getActivePublishedVersion } from "@/domains/curriculum/services/lesson-lifecycle";
import { detectPrerequisiteCycle } from "@/domains/curriculum/services/lesson-lifecycle";
import {
  normaliseBlockOrder,
  validateBlockObjectiveReferences,
  validateLessonForPublishing
} from "@/domains/curriculum/services/publishing-validation";
import type { Lesson, LessonVersion } from "@/domains/curriculum/types";

const [version] = sampleCurriculum.lessonVersions;

describe("lesson block schemas", () => {
  it("validates every sample block schema", () => {
    for (const lessonVersion of sampleCurriculum.lessonVersions) {
      for (const block of lessonVersion.blocks) {
        expect(lessonBlockSchema.safeParse(block).success).toBe(true);
      }
    }
  });

  it("rejects invalid answer references", () => {
    const block = { ...version.blocks.find((candidate) => candidate.type === "multiple_choice"), correctOptionId: "missing" };

    expect(lessonBlockSchema.safeParse(block).success).toBe(false);
  });
});

describe("publishing validation", () => {
  it("accepts the sample publishable lesson versions", () => {
    for (const lessonVersion of sampleCurriculum.lessonVersions) {
      expect(validateLessonForPublishing(lessonVersion, sampleCurriculum.lessons).valid).toBe(true);
    }
  });

  it("reports missing summary and missing assessment", () => {
    const broken: LessonVersion = {
      ...version,
      blocks: version.blocks.filter((block) => block.type !== "summary" && block.type !== "multiple_choice" && block.type !== "true_false")
    };

    const result = validateLessonForPublishing(broken, sampleCurriculum.lessons);

    expect(result.issues.map((issue) => issue.code)).toContain("SUMMARY_COUNT");
    expect(result.issues.map((issue) => issue.code)).toContain("MISSING_ASSESSMENT");
  });

  it("reports duplicate block order", () => {
    const broken: LessonVersion = {
      ...version,
      blocks: version.blocks.map((block, index) => (index === 1 ? { ...block, order: 1 } : block))
    };

    expect(validateLessonForPublishing(broken, sampleCurriculum.lessons).issues.map((issue) => issue.code)).toContain(
      "DUPLICATE_BLOCK_ORDER"
    );
  });

  it("normalises contiguous block order", () => {
    const blocks = normaliseBlockOrder([{ ...version.blocks[1], order: 4 }, { ...version.blocks[0], order: 2 }]);

    expect(blocks.map((block) => block.order)).toEqual([1, 2]);
  });

  it("reports invalid objective references", () => {
    const assessment = version.blocks.find((block) => block.type === "multiple_choice");
    if (!assessment || assessment.type !== "multiple_choice") {
      throw new Error("Expected multiple choice block.");
    }
    const broken: LessonVersion = {
      ...version,
      blocks: [{ ...assessment, learningObjectiveIds: ["outside-objective"] }]
    };

    expect(validateBlockObjectiveReferences(broken).valid).toBe(false);
  });

  it("detects lesson prerequisite cycles", () => {
    const lessons: Lesson[] = [
      { ...sampleCurriculum.lessons[0], prerequisiteLessonId: sampleCurriculum.lessons[2].id },
      sampleCurriculum.lessons[1],
      sampleCurriculum.lessons[2]
    ];

    expect(detectPrerequisiteCycle(lessons).length).toBeGreaterThan(0);
  });

  it("resolves access and version publishing rules", () => {
    const lesson = sampleCurriculum.lessons[0];

    expect(getActivePublishedVersion(lesson.id, sampleCurriculum.lessonVersions)?.id).toBe(version.id);
    expect(canStudentAccessLesson(lesson, sampleCurriculum.lessonVersions).canAccess).toBe(true);
    expect(
      canPublishLessonVersion(
        { ...version, id: "new-version", versionNumber: 2 },
        sampleCurriculum.lessonVersions
      ).valid
    ).toBe(false);
  });
});
