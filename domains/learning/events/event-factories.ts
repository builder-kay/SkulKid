import type {
  LearningEvent,
  LearningEventObjectType,
  LearningEventVerb
} from "@/domains/learning/types";

export type LearningEventFactoryInput = {
  id: string;
  studentId: string;
  sessionId: string;
  lessonId: string;
  lessonVersionId: string;
  blockId?: string | null;
  objectId: string;
  resultJson?: Record<string, unknown>;
  contextJson?: Record<string, unknown>;
  occurredAt: string;
  recordedAt: string;
  idempotencyKey: string;
};

export function createLearningEvent(
  verb: LearningEventVerb,
  objectType: LearningEventObjectType,
  input: LearningEventFactoryInput
): LearningEvent {
  return {
    id: input.id,
    studentId: input.studentId,
    sessionId: input.sessionId,
    lessonId: input.lessonId,
    lessonVersionId: input.lessonVersionId,
    blockId: input.blockId ?? null,
    verb,
    objectType,
    objectId: input.objectId,
    resultJson: input.resultJson ?? {},
    contextJson: input.contextJson ?? {},
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    eventVersion: 1,
    idempotencyKey: input.idempotencyKey
  };
}

export function lessonStartedEvent(input: LearningEventFactoryInput) {
  return createLearningEvent("lesson_started", "lesson", input);
}

export function answerSubmittedEvent(input: LearningEventFactoryInput) {
  return createLearningEvent("answer_submitted", "assessment", input);
}

export function rewardEarnedEvent(input: LearningEventFactoryInput) {
  return createLearningEvent("reward_earned", "reward", input);
}
