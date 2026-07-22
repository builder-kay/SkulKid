import { z } from "zod";

export const supportedCurriculumSubjectSchema = z.enum([
  "mathematics",
  "english-language",
  "science"
]);

export const generatedChallengeSchema = z.object({
  prompt: z.string().min(5),
  options: z.array(z.string().min(1)).length(3),
  correctOptionIndex: z.number().int().min(0).max(2),
  hint: z.string().min(5),
  explanation: z.string().min(5)
});

export const generatedLessonSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  curriculumReferences: z.array(z.string().min(1)).min(1),
  objectives: z.array(z.string().min(5)).min(1),
  estimatedMinutes: z.number().int().min(5).max(20),
  difficulty: z.enum(["foundation", "beginner", "developing", "proficient", "challenge"]),
  teachingHeading: z.string().min(3),
  teachingText: z.string().min(30),
  exampleTitle: z.string().min(3),
  exampleProblem: z.string().min(10),
  exampleSteps: z.array(z.string().min(3)).min(2).max(5),
  exampleAnswer: z.string().min(1),
  challenge: generatedChallengeSchema,
  trueFalseStatement: z.string().min(5),
  trueFalseAnswer: z.boolean(),
  summaryPoints: z.array(z.string().min(5)).min(2).max(4)
});

export const generatedTopicSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  lessons: z.array(generatedLessonSchema).min(1).max(12)
});

export const generatedUnitSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  grade: z.number().int().min(1).max(12),
  topics: z.array(generatedTopicSchema).min(1).max(12)
});

export const generatedCourseSchema = z.object({
  title: z.string().min(3),
  subject: supportedCurriculumSubjectSchema,
  sourceSummary: z.string().min(20),
  designRationale: z.string().min(20),
  units: z.array(generatedUnitSchema).min(1).max(12)
});

export type GeneratedCourse = z.infer<typeof generatedCourseSchema>;
export type SupportedCurriculumSubject = z.infer<typeof supportedCurriculumSubjectSchema>;

export const generatedCourseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "subject", "sourceSummary", "designRationale", "units"],
  properties: {
    title: { type: "string" },
    subject: { type: "string", enum: supportedCurriculumSubjectSchema.options },
    sourceSummary: { type: "string" },
    designRationale: { type: "string" },
    units: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["title", "description", "grade", "topics"],
        properties: {
          title: { type: "string" }, description: { type: "string" }, grade: { type: "integer" },
          topics: {
            type: "array",
            items: {
              type: "object", additionalProperties: false,
              required: ["title", "description", "lessons"],
              properties: {
                title: { type: "string" }, description: { type: "string" },
                lessons: {
                  type: "array",
                  items: {
                    type: "object", additionalProperties: false,
                    required: ["title", "description", "curriculumReferences", "objectives", "estimatedMinutes", "difficulty", "teachingHeading", "teachingText", "exampleTitle", "exampleProblem", "exampleSteps", "exampleAnswer", "challenge", "trueFalseStatement", "trueFalseAnswer", "summaryPoints"],
                    properties: {
                      title: { type: "string" }, description: { type: "string" },
                      curriculumReferences: { type: "array", items: { type: "string" } },
                      objectives: { type: "array", items: { type: "string" }, minItems: 1 },
                      estimatedMinutes: { type: "integer" },
                      difficulty: { type: "string", enum: ["foundation", "beginner", "developing", "proficient", "challenge"] },
                      teachingHeading: { type: "string" }, teachingText: { type: "string" },
                      exampleTitle: { type: "string" }, exampleProblem: { type: "string" },
                      exampleSteps: { type: "array", items: { type: "string" } }, exampleAnswer: { type: "string" },
                      challenge: {
                        type: "object", additionalProperties: false,
                        required: ["prompt", "options", "correctOptionIndex", "hint", "explanation"],
                        properties: {
                          prompt: { type: "string" }, options: { type: "array", items: { type: "string" } },
                          correctOptionIndex: { type: "integer" }, hint: { type: "string" }, explanation: { type: "string" }
                        }
                      },
                      trueFalseStatement: { type: "string" }, trueFalseAnswer: { type: "boolean" },
                      summaryPoints: { type: "array", items: { type: "string" } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
} as const;
