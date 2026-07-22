import { z } from "zod";
import { lessonBlockSchema, lessonDifficultySchema, lessonPublicationStatusSchema } from "./lesson-block-schemas";

export const isoDateSchema = z.string().datetime();

export const subjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  colourToken: z.string().min(1),
  gradeLevels: z.array(z.number().int().positive()).min(1),
  order: z.number().int().positive(),
  status: z.enum(["active", "archived"]),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

export const unitSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().positive(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

export const topicSchema = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().positive(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

export const lessonSchema = z.object({
  id: z.string().min(1),
  topicId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  shortDescription: z.string().min(1),
  order: z.number().int().positive(),
  prerequisiteLessonId: z.string().min(1).nullable(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
});

export const learningObjectiveSchema = z.object({
  id: z.string().min(1),
  lessonVersionId: z.string().min(1),
  code: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().positive()
});

export const lessonVersionSchema = z
  .object({
    id: z.string().min(1),
    lessonId: z.string().min(1),
    versionNumber: z.number().int().positive(),
    status: lessonPublicationStatusSchema,
    title: z.string().min(1),
    description: z.string().min(1),
    objectiveSummary: z.string().min(1),
    difficulty: lessonDifficultySchema,
    estimatedMinutes: z.number().int().positive(),
    baseXpReward: z.number().int().nonnegative(),
    passingScore: z.number().min(0).max(100),
    masteryScore: z.number().min(0).max(100),
    maximumLessonRedos: z.number().int().min(0).max(20).default(2),
    publishedAt: isoDateSchema.nullable(),
    learningObjectives: z.array(learningObjectiveSchema).min(1),
    blocks: z.array(lessonBlockSchema).min(1),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema
  })
  .superRefine((version, context) => {
    if (version.masteryScore < version.passingScore) {
      context.addIssue({
        code: "custom",
        path: ["masteryScore"],
        message: "Mastery score must be greater than or equal to passing score."
      });
    }

    if (version.status === "published" && version.publishedAt === null) {
      context.addIssue({
        code: "custom",
        path: ["publishedAt"],
        message: "Published lesson versions must have a publishedAt timestamp."
      });
    }

    for (const objective of version.learningObjectives) {
      if (objective.lessonVersionId !== version.id) {
        context.addIssue({
          code: "custom",
          path: ["learningObjectives"],
          message: "Learning objective must belong to the lesson version."
        });
      }
    }
  });

export const curriculumFixtureSchema = z.object({
  subjects: z.array(subjectSchema).min(1),
  units: z.array(unitSchema).min(1),
  topics: z.array(topicSchema).min(1),
  lessons: z.array(lessonSchema).min(1),
  lessonVersions: z.array(lessonVersionSchema).min(1)
});
