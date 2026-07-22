import { z } from "zod";

export const lessonProgressStatusSchema = z.enum([
  "locked",
  "available",
  "in_progress",
  "completed",
  "mastered",
  "revision_recommended"
]);

export const learningEventSchema = z.object({
  id: z.string().min(1),
  studentId: z.string().min(1),
  sessionId: z.string().min(1),
  lessonId: z.string().min(1),
  lessonVersionId: z.string().min(1),
  blockId: z.string().min(1).nullable(),
  verb: z.enum([
    "lesson_started",
    "lesson_resumed",
    "block_viewed",
    "answer_submitted",
    "hint_requested",
    "block_completed",
    "lesson_paused",
    "lesson_completed",
    "lesson_mastered",
    "reward_earned"
  ]),
  objectType: z.enum(["lesson", "lesson_block", "assessment", "learning_objective", "reward"]),
  objectId: z.string().min(1),
  resultJson: z.record(z.string(), z.unknown()),
  contextJson: z.record(z.string(), z.unknown()),
  occurredAt: z.string().datetime(),
  recordedAt: z.string().datetime(),
  eventVersion: z.number().int().positive(),
  idempotencyKey: z.string().min(1)
});

export const progressTransitionEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("start_lesson"),
    at: z.string().datetime(),
    lessonVersionId: z.string().min(1),
    firstBlockId: z.string().min(1).nullable()
  }),
  z.object({
    type: z.literal("recommend_revision"),
    at: z.string().datetime()
  }),
  z.object({
    type: z.literal("master_lesson"),
    at: z.string().datetime()
  })
]);
