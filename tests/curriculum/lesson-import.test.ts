import { describe, expect, it } from "vitest";
import { importedLessonSchema, importedQuizSchema } from "@/domains/curriculum-ai/schemas/lesson-import";

describe("lesson file import schemas", () => {
  it("accepts a complete editable lesson", () => {
    const result = importedLessonSchema.safeParse({
      unit: "Fractions", chapter: "Chapter 1", topic: "Equivalent fractions", title: "Fraction twins",
      description: "Recognise equivalent fractions using familiar objects.", curriculumReference: "B4.1.2.1",
      objectives: ["Identify equivalent fractions", "Explain equivalence using a model"], estimatedMinutes: 12,
      difficulty: "beginner", teachingHeading: "Let’s learn", teachingText: "Equivalent fractions name the same amount.",
      exampleTitle: "Share the fruit", exampleProblem: "Compare one half and two quarters.",
      exampleSteps: ["Draw equal wholes", "Shade both fractions"], exampleAnswer: "They are equivalent.",
      trueFalseStatement: "One half equals two quarters.", trueFalseAnswer: true,
      summaryPoints: ["Equivalent fractions have the same value", "Models help us compare fractions"]
    });
    expect(result.success).toBe(true);
  });

  it("requires a correct answer for every imported quiz question", () => {
    const result = importedQuizSchema.safeParse({ questions: [{ prompt: "Which fraction equals one half?", options: ["2/4", "1/4", "3/4"], correctOptionIndex: 0, hint: "Think about two equal parts.", explanation: "Two quarters cover the same amount as one half." }] });
    expect(result.success).toBe(true);
  });
});
