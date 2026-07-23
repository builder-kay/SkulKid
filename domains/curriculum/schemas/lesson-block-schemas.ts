import { z } from "zod";

export const lessonDifficultySchema = z.enum([
  "foundation",
  "beginner",
  "developing",
  "proficient",
  "challenge"
]);

export const lessonPublicationStatusSchema = z.enum([
  "draft",
  "in_review",
  "published",
  "archived"
]);

const baseBlockSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  required: z.boolean(),
  estimatedSeconds: z.number().int().positive().optional()
});

const rewardPreviewSchema = z.object({
  xp: z.number().int().nonnegative(),
  starsAvailable: z.number().int().min(0).max(3)
});

const assessmentOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  text: z.string().min(1),
  feedback: z.string().min(1).optional()
});

const assessmentFieldsSchema = z.object({
  prompt: z.string().min(1),
  learningObjectiveIds: z.array(z.string().min(1)).min(1),
  difficulty: lessonDifficultySchema,
  xpWeight: z.number().positive(),
  maximumAttempts: z.number().int().positive(),
  hint: z.string().min(1).optional(),
  explanation: z.string().min(1),
  feedbackCorrect: z.string().min(1),
  feedbackIncorrect: z.string().min(1),
  feedbackRetry: z.string().min(1),
  shuffleOptions: z.boolean()
});

export const lessonIntroBlockSchema = baseBlockSchema.extend({
  type: z.literal("lesson_intro"),
  title: z.string().min(1),
  shortDescription: z.string().min(1),
  objectives: z.array(z.string().min(1)).min(1),
  estimatedMinutes: z.number().int().positive(),
  rewardPreview: rewardPreviewSchema
});

export const textBlockSchema = baseBlockSchema.extend({
  type: z.literal("text"),
  heading: z.string().min(1),
  body: z.string().min(1),
  emphasisTerms: z.array(z.string().min(1)).optional()
});

export const imageBlockSchema = baseBlockSchema
  .extend({
    type: z.literal("image"),
    source: z.string().min(1),
    altText: z.string(),
    caption: z.string().min(1).optional(),
    attribution: z.string().min(1).optional(),
    decorative: z.boolean()
  })
  .superRefine((block, context) => {
    if (!block.decorative && block.altText.trim().length < 8) {
      context.addIssue({
        code: "custom",
        path: ["altText"],
        message: "Non-decorative images need meaningful alternative text."
      });
    }

    if (block.decorative && block.altText.trim().length > 0) {
      context.addIssue({
        code: "custom",
        path: ["altText"],
        message: "Decorative images should use empty alternative text."
      });
    }
  });

export const videoBlockSchema = baseBlockSchema.extend({
  type: z.literal("video"),
  source: z.string().url(),
  provider: z.enum(["youtube", "vimeo", "tiktok"]),
  title: z.string().min(1),
  caption: z.string().min(1).optional(),
  participationPrompt: z.string().min(5).optional(),
  participationOptions: z.array(assessmentOptionSchema).min(2).optional(),
  participationCorrectOptionId: z.string().min(1).optional(),
  participationExplanation: z.string().min(1).optional(),
  participationXp: z.number().int().min(1).max(50).optional()
});

export const workedExampleBlockSchema = baseBlockSchema.extend({
  type: z.literal("worked_example"),
  title: z.string().min(1),
  problem: z.string().min(1),
  orderedSteps: z.array(z.string().min(1)).min(1),
  finalAnswer: z.string().min(1),
  explanation: z.string().min(1)
});

export const tipBlockSchema = baseBlockSchema.extend({
  type: z.literal("tip"),
  title: z.string().min(1),
  body: z.string().min(1),
  tone: z.enum(["tip", "remember", "warning"])
});

export const checkpointBlockSchema = baseBlockSchema.extend({
  type: z.literal("checkpoint"),
  prompt: z.string().min(1),
  acknowledgementLabel: z.string().min(1)
});

export const summaryBlockSchema = baseBlockSchema.extend({
  type: z.literal("summary"),
  heading: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(1),
  nextStepText: z.string().min(1)
});

export const multipleChoiceBlockSchema = baseBlockSchema
  .merge(assessmentFieldsSchema)
  .extend({
    type: z.literal("multiple_choice"),
    options: z.array(assessmentOptionSchema).min(2),
    correctOptionId: z.string().min(1)
  })
  .superRefine((block, context) => {
    if (!block.options.some((option) => option.id === block.correctOptionId)) {
      context.addIssue({
        code: "custom",
        path: ["correctOptionId"],
        message: "Correct option must reference a stable option ID."
      });
    }
  });

export const multipleSelectBlockSchema = baseBlockSchema
  .merge(assessmentFieldsSchema)
  .extend({
    type: z.literal("multiple_select"),
    options: z.array(assessmentOptionSchema).min(2),
    correctOptionIds: z.array(z.string().min(1)).min(1),
    partialCreditEnabled: z.boolean()
  })
  .superRefine((block, context) => {
    const optionIds = new Set(block.options.map((option) => option.id));
    for (const optionId of block.correctOptionIds) {
      if (!optionIds.has(optionId)) {
        context.addIssue({
          code: "custom",
          path: ["correctOptionIds"],
          message: "Every correct option must reference a stable option ID."
        });
      }
    }
  });

export const trueFalseBlockSchema = baseBlockSchema.merge(assessmentFieldsSchema).extend({
  type: z.literal("true_false"),
  statement: z.string().min(1),
  correctAnswer: z.boolean()
});

const fillBlankBlankSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  acceptedAnswers: z.array(z.string().min(1)).min(1)
});

export const fillBlankBlockSchema = baseBlockSchema.merge(assessmentFieldsSchema).extend({
  type: z.literal("fill_blank"),
  promptTemplate: z.string().min(1),
  blanks: z.array(fillBlankBlankSchema).min(1),
  caseSensitive: z.boolean(),
  ignoreExtraWhitespace: z.boolean()
});

export const sectionBreakBlockSchema = baseBlockSchema.extend({
  type: z.literal("section_break"),
  heading: z.string().min(1),
  description: z.string().min(1).optional()
});

export const reflectionBlockSchema = baseBlockSchema.extend({
  type: z.literal("reflection"),
  prompt: z.string().min(1),
  responseType: z.enum(["short_text", "confidence_scale"]),
  optional: z.boolean()
});

export const lessonBlockSchema = z.discriminatedUnion("type", [
  lessonIntroBlockSchema,
  textBlockSchema,
  imageBlockSchema,
  videoBlockSchema,
  workedExampleBlockSchema,
  tipBlockSchema,
  checkpointBlockSchema,
  summaryBlockSchema,
  multipleChoiceBlockSchema,
  multipleSelectBlockSchema,
  trueFalseBlockSchema,
  fillBlankBlockSchema,
  sectionBreakBlockSchema,
  reflectionBlockSchema
]);

export const assessmentBlockTypes = [
  "multiple_choice",
  "multiple_select",
  "true_false",
  "fill_blank"
] as const;

export const instructionalBlockTypes = [
  "text",
  "image",
  "video",
  "worked_example",
  "tip",
  "checkpoint"
] as const;
