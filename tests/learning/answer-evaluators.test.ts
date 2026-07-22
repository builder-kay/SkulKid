import { describe, expect, it } from "vitest";
import { sampleCurriculum } from "@/domains/curriculum/fixtures/sample-curriculum";
import {
  evaluateFillBlank,
  evaluateMultipleChoice,
  evaluateMultipleSelect,
  evaluateTrueFalse,
  normaliseFillBlankAnswer
} from "@/domains/learning/services/answer-evaluators";

const blocks = sampleCurriculum.lessonVersions.flatMap((version) => version.blocks);

describe("answer evaluators", () => {
  it("scores multiple choice", () => {
    const block = blocks.find((candidate) => candidate.type === "multiple_choice");
    if (!block || block.type !== "multiple_choice") throw new Error("Missing block.");

    expect(evaluateMultipleChoice(block, block.correctOptionId).status).toBe("correct");
    expect(evaluateMultipleChoice(block, "wrong").status).toBe("incorrect");
  });

  it("scores multiple select with partial credit", () => {
    const block = blocks.find((candidate) => candidate.type === "multiple_select");
    if (!block || block.type !== "multiple_select") throw new Error("Missing block.");

    expect(evaluateMultipleSelect(block, block.correctOptionIds).status).toBe("correct");
    expect(evaluateMultipleSelect(block, [block.correctOptionIds[0]]).status).toBe("partially_correct");
  });

  it("scores true/false", () => {
    const block = blocks.find((candidate) => candidate.type === "true_false");
    if (!block || block.type !== "true_false") throw new Error("Missing block.");

    expect(evaluateTrueFalse(block, block.correctAnswer).scoreEarned).toBe(1);
  });

  it("normalises fill blank answers", () => {
    const block = blocks.find((candidate) => candidate.type === "fill_blank");
    if (!block || block.type !== "fill_blank") throw new Error("Missing block.");

    expect(normaliseFillBlankAnswer(" Three   Quarters ", false, true)).toBe("three quarters");
    expect(evaluateFillBlank(block, { [block.blanks[0].id]: block.blanks[0].acceptedAnswers[0] }).status).toBe("correct");
  });

  it("respects case sensitivity", () => {
    expect(normaliseFillBlankAnswer("Three", true, true)).toBe("Three");
    expect(normaliseFillBlankAnswer("Three", false, true)).toBe("three");
  });
});
