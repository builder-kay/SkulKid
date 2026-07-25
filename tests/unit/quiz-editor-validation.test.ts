import { describe, expect, it } from "vitest";
import {
  normalizeQuizQuestion,
  quizQuestionComplete,
  validateQuizBasics,
  validateQuizQuestions
} from "@/components/teacher/quiz-editor-dialog";
import type { Quiz } from "@/components/teacher/teacher-quiz-library";

function quiz(): Quiz {
  return {
    id: "",
    title: "Fractions challenge",
    description: "",
    subject: "mathematics",
    gradeLevels: [4],
    questions: [{
      id: "q1",
      prompt: "Which fraction is one half?",
      type: "multiple_choice",
      options: ["1/2", "1/3", "1/4"],
      correctIndex: 0,
      explanation: ""
    }],
    baseXpReward: 40,
    passingScore: 70,
    maxAttempts: 3,
    version: 1,
    status: "draft",
    assignmentCount: 0,
    attemptCount: 0,
    averageScore: null,
    passRate: null
  };
}

describe("reusable quiz editor validation", () => {
  it("accepts complete quiz basics and questions", () => {
    expect(validateQuizBasics(quiz())).toEqual({});
    expect(validateQuizQuestions(quiz())).toEqual({});
  });

  it("rejects empty, duplicate, and out-of-range answers", () => {
    const base = quiz().questions[0];
    expect(quizQuestionComplete({ ...base, options: ["Yes", ""] })).toBe(false);
    expect(quizQuestionComplete({ ...base, options: ["Same", "same"] })).toBe(false);
    expect(quizQuestionComplete({ ...base, correctIndex: 5 })).toBe(false);
  });

  it("normalizes true or false questions for the existing API", () => {
    expect(normalizeQuizQuestion({
      id: "q2",
      prompt: "  Plants need light. ",
      type: "true_false",
      options: ["yes", "no", "maybe"],
      correctIndex: 1,
      explanation: "  Review photosynthesis. "
    })).toEqual({
      id: "q2",
      prompt: "Plants need light.",
      type: "true_false",
      options: ["True", "False"],
      correctIndex: 1,
      explanation: "Review photosynthesis."
    });
  });

  it("validates level and challenge-setting limits", () => {
    expect(validateQuizBasics({ ...quiz(), gradeLevels: [], baseXpReward: 501 })).toMatchObject({
      grades: expect.any(String),
      settings: expect.any(String)
    });
  });
});
