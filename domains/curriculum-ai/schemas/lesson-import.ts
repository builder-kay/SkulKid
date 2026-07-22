import { z } from "zod";
import { generatedChallengeSchema } from "@/domains/curriculum-ai/schemas/generated-course";

export const importedLessonSchema = z.object({
  unit: z.string(),
  chapter: z.string(),
  topic: z.string(),
  title: z.string(),
  description: z.string(),
  curriculumReference: z.string(),
  objectives: z.array(z.string()).min(1),
  estimatedMinutes: z.number().int().min(5).max(20),
  difficulty: z.enum(["foundation", "beginner", "developing", "proficient", "challenge"]),
  teachingHeading: z.string(),
  teachingText: z.string(),
  exampleTitle: z.string(),
  exampleProblem: z.string(),
  exampleSteps: z.array(z.string()).min(2).max(5),
  exampleAnswer: z.string(),
  trueFalseStatement: z.string(),
  trueFalseAnswer: z.boolean(),
  summaryPoints: z.array(z.string()).min(2).max(4)
});

export const importedQuizSchema = z.object({
  questions: z.array(generatedChallengeSchema).min(1).max(30)
});

export type ImportedLesson = z.infer<typeof importedLessonSchema>;
export type ImportedQuiz = z.infer<typeof importedQuizSchema>;

const challengeJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["prompt", "options", "correctOptionIndex", "hint", "explanation"],
  properties: {
    prompt: { type: "string" },
    options: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
    correctOptionIndex: { type: "integer", minimum: 0, maximum: 2 },
    hint: { type: "string" }, explanation: { type: "string" }
  }
} as const;

export const importedLessonJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["unit", "chapter", "topic", "title", "description", "curriculumReference", "objectives", "estimatedMinutes", "difficulty", "teachingHeading", "teachingText", "exampleTitle", "exampleProblem", "exampleSteps", "exampleAnswer", "trueFalseStatement", "trueFalseAnswer", "summaryPoints"],
  properties: {
    unit: { type: "string" }, chapter: { type: "string" }, topic: { type: "string" }, title: { type: "string" },
    description: { type: "string" }, curriculumReference: { type: "string" },
    objectives: { type: "array", items: { type: "string" }, minItems: 1 },
    estimatedMinutes: { type: "integer", minimum: 5, maximum: 20 },
    difficulty: { type: "string", enum: ["foundation", "beginner", "developing", "proficient", "challenge"] },
    teachingHeading: { type: "string" }, teachingText: { type: "string" }, exampleTitle: { type: "string" },
    exampleProblem: { type: "string" }, exampleSteps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
    exampleAnswer: { type: "string" }, trueFalseStatement: { type: "string" }, trueFalseAnswer: { type: "boolean" },
    summaryPoints: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 }
  }
} as const;

export const importedQuizJsonSchema = {
  type: "object", additionalProperties: false, required: ["questions"],
  properties: { questions: { type: "array", minItems: 1, maxItems: 30, items: challengeJsonSchema } }
} as const;
