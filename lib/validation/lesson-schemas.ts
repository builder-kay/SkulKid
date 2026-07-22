import { z } from "zod";

export const lessonDifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);
export const lessonStatusSchema = z.enum(["draft", "published", "archived"]);
export const studentLessonStatusSchema = z.enum([
  "locked",
  "available",
  "in_progress",
  "completed",
  "mastered",
  "revision_required"
]);

const isoDateSchema = z.string().datetime();

const lessonBlockBaseSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive()
});

export const answerOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  text: z.string().min(1)
});

export const introductionBlockSchema = lessonBlockBaseSchema.extend({
  type: z.literal("introduction"),
  title: z.string().min(1),
  content: z.string().min(1),
  objective: z.string().min(1)
});

export const textBlockSchema = lessonBlockBaseSchema.extend({
  type: z.literal("text"),
  heading: z.string().min(1),
  content: z.string().min(1)
});

export const imageBlockSchema = lessonBlockBaseSchema.extend({
  type: z.literal("image"),
  imageUrl: z.string().min(1),
  altText: z.string().min(1),
  caption: z.string().min(1)
});

export const exampleBlockSchema = lessonBlockBaseSchema.extend({
  type: z.literal("example"),
  title: z.string().min(1),
  content: z.string().min(1),
  explanation: z.string().min(1)
});

export const tipBlockSchema = lessonBlockBaseSchema.extend({
  type: z.literal("tip"),
  title: z.string().min(1),
  content: z.string().min(1)
});

export const multipleChoiceBlockSchema = lessonBlockBaseSchema.extend({
  type: z.literal("multiple_choice"),
  question: z.string().min(1),
  options: z.array(answerOptionSchema).min(2),
  correctOptionId: z.string().min(1),
  explanation: z.string().min(1),
  hint: z.string().min(1).optional(),
  xpReward: z.number().int().positive()
});

export const trueFalseBlockSchema = lessonBlockBaseSchema.extend({
  type: z.literal("true_false"),
  statement: z.string().min(1),
  correctAnswer: z.boolean(),
  explanation: z.string().min(1),
  hint: z.string().min(1).optional(),
  xpReward: z.number().int().positive()
});

export const fillBlankBlockSchema = lessonBlockBaseSchema.extend({
  type: z.literal("fill_blank"),
  sentence: z.string().min(1),
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  caseSensitive: z.boolean(),
  explanation: z.string().min(1),
  hint: z.string().min(1).optional(),
  xpReward: z.number().int().positive()
});

export const summaryBlockSchema = lessonBlockBaseSchema.extend({
  type: z.literal("summary"),
  heading: z.string().min(1),
  points: z.array(z.string().min(1)).min(1)
});

export const lessonBlockSchema = z.discriminatedUnion("type", [
  introductionBlockSchema,
  textBlockSchema,
  imageBlockSchema,
  exampleBlockSchema,
  tipBlockSchema,
  multipleChoiceBlockSchema,
  trueFalseBlockSchema,
  fillBlankBlockSchema,
  summaryBlockSchema
]);

export const lessonMetadataSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  unitId: z.string().min(1),
  topicId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  objective: z.string().min(1),
  difficulty: lessonDifficultySchema,
  estimatedMinutes: z.number().int().positive(),
  xpReward: z.number().int().nonnegative(),
  order: z.number().int().positive(),
  prerequisiteLessonId: z.string().min(1).nullable(),
  status: lessonStatusSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

export const lessonSchema = lessonMetadataSchema.extend({
  blocks: z.array(lessonBlockSchema).min(1)
});

export const lessonProgressSchema = z.object({
  id: z.string().min(1),
  studentId: z.string().min(1),
  lessonId: z.string().min(1),
  status: studentLessonStatusSchema,
  currentBlockIndex: z.number().int().nonnegative(),
  bestScore: z.number().min(0).max(100),
  latestScore: z.number().min(0).max(100),
  attemptsCount: z.number().int().nonnegative(),
  starsEarned: z.number().int().min(0).max(3),
  xpEarned: z.number().int().nonnegative(),
  startedAt: isoDateSchema.nullable(),
  completedAt: isoDateSchema.nullable(),
  lastAccessedAt: isoDateSchema.nullable()
});

export const adaptationDecisionSchema = z.object({
  status: z.enum(["completed", "mastered", "revision_required"]),
  unlockNextLesson: z.boolean(),
  recommendation: z.enum(["continue", "targeted_practice", "remedial_lesson"]),
  message: z.string().min(1),
  recommendedDifficulty: lessonDifficultySchema,
  shouldShowHints: z.boolean()
});

export function parseLessonData<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new Error(`${label} failed validation: ${z.prettifyError(result.error)}`);
  }

  return result.data;
}
