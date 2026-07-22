import {
  assessmentBlockTypes,
  instructionalBlockTypes
} from "@/domains/curriculum/schemas/lesson-block-schemas";
import type {
  Lesson,
  LessonBlock,
  LessonVersion,
  ValidationIssue,
  ValidationResult
} from "@/domains/curriculum/types";
import { detectPrerequisiteCycle } from "./lesson-lifecycle";

const assessmentTypes = new Set<string>(assessmentBlockTypes);
const instructionalTypes = new Set<string>(instructionalBlockTypes);

export function normaliseBlockOrder(blocks: LessonBlock[]): LessonBlock[] {
  return [...blocks]
    .sort((first, second) => first.order - second.order)
    .map((block, index) => ({ ...block, order: index + 1 }));
}

export function validateBlockObjectiveReferences(version: LessonVersion): ValidationResult {
  const objectiveIds = new Set(version.learningObjectives.map((objective) => objective.id));
  const issues: ValidationIssue[] = [];

  for (const block of version.blocks) {
    switch (block.type) {
      case "multiple_choice":
      case "multiple_select":
      case "true_false":
      case "fill_blank":
        for (const objectiveId of block.learningObjectiveIds) {
          if (!objectiveIds.has(objectiveId)) {
            issues.push({
              code: "INVALID_OBJECTIVE_REFERENCE",
              severity: "error",
              blockId: block.id,
              field: "learningObjectiveIds",
              message: "Assessment block references a learning objective outside this lesson version."
            });
          }
        }
        break;
      default:
        break;
      }
  }

  return { valid: issues.length === 0, issues };
}

export function validateLessonForPublishing(
  version: LessonVersion,
  lessons: Lesson[]
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const blockIds = new Set<string>();
  const blockOrders = new Set<number>();
  const normalised = normaliseBlockOrder(version.blocks);

  if (version.learningObjectives.length === 0) {
    issues.push(issue("MISSING_OBJECTIVE", "learningObjectives", "A publishable lesson needs at least one learning objective."));
  }

  if (!version.blocks.some((block) => block.type === "lesson_intro")) {
    issues.push(issue("MISSING_INTRO", "blocks", "A publishable lesson needs a lesson intro block."));
  }

  if (!version.blocks.some((block) => instructionalTypes.has(block.type))) {
    issues.push(issue("MISSING_CONTENT", "blocks", "A publishable lesson needs at least one instructional content block."));
  }

  if (!version.blocks.some((block) => assessmentTypes.has(block.type))) {
    issues.push(issue("MISSING_ASSESSMENT", "blocks", "A publishable lesson needs at least one assessment block."));
  }

  const summaryCount = version.blocks.filter((block) => block.type === "summary").length;
  if (summaryCount !== 1) {
    issues.push(issue("SUMMARY_COUNT", "blocks", "A publishable lesson needs exactly one summary block."));
  }

  for (const block of version.blocks) {
    if (blockIds.has(block.id)) {
      issues.push(issue("DUPLICATE_BLOCK_ID", "blocks", "Block IDs must be unique.", block.id));
    }
    blockIds.add(block.id);

    if (blockOrders.has(block.order)) {
      issues.push(issue("DUPLICATE_BLOCK_ORDER", "blocks", "Block order values must be unique.", block.id));
    }
    blockOrders.add(block.order);

    const normalisedBlock = normalised.find((candidate) => candidate.id === block.id);
    if (normalisedBlock && normalisedBlock.order !== block.order) {
      issues.push({
        code: "NON_CONTIGUOUS_ORDER",
        severity: "warning",
        blockId: block.id,
        field: "order",
        message: "Block order should be contiguous after normalisation."
      });
    }

    if (block.type === "image" && !block.decorative && block.altText.trim().length < 8) {
      issues.push(issue("IMAGE_ALT_REQUIRED", "altText", "Non-decorative images need meaningful alt text.", block.id));
    }

    if (block.type === "image" && block.decorative && block.altText.trim().length > 0) {
      issues.push(issue("DECORATIVE_ALT_EMPTY", "altText", "Decorative images should use empty alt text.", block.id));
    }
  }

  issues.push(...validateAssessmentAnswers(version.blocks));
  issues.push(...validateBlockObjectiveReferences(version).issues);

  if (version.passingScore < 0 || version.passingScore > 100) {
    issues.push(issue("INVALID_PASSING_SCORE", "passingScore", "Passing score must be between 0 and 100."));
  }

  if (version.masteryScore < version.passingScore || version.masteryScore > 100) {
    issues.push(issue("INVALID_MASTERY_SCORE", "masteryScore", "Mastery score must be between passing score and 100."));
  }

  if (version.estimatedMinutes <= 0) {
    issues.push(issue("INVALID_DURATION", "estimatedMinutes", "Estimated lesson duration must be positive."));
  }

  const cycle = detectPrerequisiteCycle(lessons);
  if (cycle.length > 0) {
    issues.push({
      code: "PREREQUISITE_CYCLE",
      severity: "error",
      field: "prerequisiteLessonId",
      message: `Prerequisite cycle detected: ${cycle.join(" -> ")}`
    });
  }

  return { valid: issues.every((validationIssue) => validationIssue.severity !== "error"), issues };
}

function validateAssessmentAnswers(blocks: LessonBlock[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const block of blocks) {
    if (block.type === "multiple_choice") {
      const optionIds = new Set(block.options.map((option) => option.id));
      if (!optionIds.has(block.correctOptionId)) {
        issues.push(issue("INVALID_CORRECT_OPTION", "correctOptionId", "Correct option must exist.", block.id));
      }
    }

    if (block.type === "multiple_select") {
      const optionIds = new Set(block.options.map((option) => option.id));
      for (const correctOptionId of block.correctOptionIds) {
        if (!optionIds.has(correctOptionId)) {
          issues.push(issue("INVALID_CORRECT_OPTION", "correctOptionIds", "Every correct option must exist.", block.id));
        }
      }
    }

    if (block.type === "fill_blank") {
      for (const blank of block.blanks) {
        if (blank.acceptedAnswers.length === 0) {
          issues.push(issue("MISSING_ACCEPTED_ANSWER", "blanks", "Each blank needs at least one accepted answer.", block.id));
        }
      }
    }
  }

  return issues;
}

function issue(code: string, field: string, message: string, blockId?: string): ValidationIssue {
  return {
    code,
    field,
    blockId,
    severity: "error",
    message
  };
}
