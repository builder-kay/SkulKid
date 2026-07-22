import type {
  FillBlankBlock,
  MultipleChoiceBlock,
  MultipleSelectBlock,
  TrueFalseBlock
} from "@/domains/curriculum/types";
import type { AnswerEvaluation } from "@/domains/learning/types";

export type AssessmentFeedback = {
  message: string;
  explanation: string;
  correctAnswerRevealed: boolean;
};

export function evaluateMultipleChoice(
  block: MultipleChoiceBlock,
  selectedOptionId: string
): AnswerEvaluation<AssessmentFeedback> {
  const correct = selectedOptionId === block.correctOptionId;

  return {
    status: correct ? "correct" : "incorrect",
    scoreEarned: correct ? 1 : 0,
    scorePossible: 1,
    feedback: feedback(block.feedbackCorrect, block.feedbackIncorrect, block.explanation, correct)
  };
}

export function evaluateMultipleSelect(
  block: MultipleSelectBlock,
  selectedOptionIds: string[]
): AnswerEvaluation<AssessmentFeedback> {
  const selected = new Set(selectedOptionIds);
  const correct = new Set(block.correctOptionIds);
  const correctSelections = [...selected].filter((optionId) => correct.has(optionId)).length;
  const incorrectSelections = [...selected].filter((optionId) => !correct.has(optionId)).length;
  const exact =
    selected.size === correct.size &&
    [...correct].every((optionId) => selected.has(optionId));

  if (exact) {
    return {
      status: "correct",
      scoreEarned: 1,
      scorePossible: 1,
      feedback: feedback(block.feedbackCorrect, block.feedbackIncorrect, block.explanation, true)
    };
  }

  if (block.partialCreditEnabled && correctSelections > 0 && incorrectSelections === 0) {
    return {
      status: "partially_correct",
      scoreEarned: correctSelections / correct.size,
      scorePossible: 1,
      feedback: feedback(block.feedbackRetry, block.feedbackIncorrect, block.explanation, false)
    };
  }

  return {
    status: "incorrect",
    scoreEarned: 0,
    scorePossible: 1,
    feedback: feedback(block.feedbackCorrect, block.feedbackIncorrect, block.explanation, false)
  };
}

export function evaluateTrueFalse(
  block: TrueFalseBlock,
  response: boolean
): AnswerEvaluation<AssessmentFeedback> {
  const correct = response === block.correctAnswer;

  return {
    status: correct ? "correct" : "incorrect",
    scoreEarned: correct ? 1 : 0,
    scorePossible: 1,
    feedback: feedback(block.feedbackCorrect, block.feedbackIncorrect, block.explanation, correct)
  };
}

export function evaluateFillBlank(
  block: FillBlankBlock,
  responses: Record<string, string>
): AnswerEvaluation<AssessmentFeedback> {
  const results = block.blanks.map((blank) => {
    const response = normaliseFillBlankAnswer(
      responses[blank.id] ?? "",
      block.caseSensitive,
      block.ignoreExtraWhitespace
    );
    const accepted = blank.acceptedAnswers.map((answer) =>
      normaliseFillBlankAnswer(answer, block.caseSensitive, block.ignoreExtraWhitespace)
    );
    return accepted.includes(response);
  });
  const correctCount = results.filter(Boolean).length;
  const score = correctCount / block.blanks.length;

  return {
    status: score === 1 ? "correct" : score > 0 ? "partially_correct" : "incorrect",
    scoreEarned: score,
    scorePossible: 1,
    feedback: feedback(
      block.feedbackCorrect,
      score > 0 ? block.feedbackRetry : block.feedbackIncorrect,
      block.explanation,
      score === 1
    )
  };
}

export function normaliseFillBlankAnswer(
  answer: string,
  caseSensitive: boolean,
  ignoreExtraWhitespace: boolean
): string {
  const trimmed = answer.trim();
  const whitespaceNormalised = ignoreExtraWhitespace ? trimmed.replace(/\s+/g, " ") : trimmed;
  return caseSensitive ? whitespaceNormalised : whitespaceNormalised.toLowerCase();
}

function feedback(
  correctMessage: string,
  incorrectMessage: string,
  explanation: string,
  correct: boolean
): AssessmentFeedback {
  return {
    message: correct ? correctMessage : incorrectMessage,
    explanation,
    correctAnswerRevealed: correct
  };
}
