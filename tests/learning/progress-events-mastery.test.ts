import { describe, expect, it } from "vitest";
import { sampleCurriculum } from "@/domains/curriculum/fixtures/sample-curriculum";
import { answerSubmittedEvent, lessonStartedEvent } from "@/domains/learning/events/event-factories";
import { calculateObjectiveMastery, updateMasteryFromAttempt } from "@/domains/learning/services/mastery";
import { canResumeSession } from "@/domains/learning/services/session";
import {
  calculateAccuracy,
  calculateLessonScore,
  calculateRequiredBlockProgress,
  createInitialProgressSnapshot,
  mergeAttemptIntoProgress,
  transitionLessonProgress,
  validateProgressTransition
} from "@/domains/learning/services/progress-calculation";
import type { BlockAttempt, LessonAttempt, LessonSession, MasteryRecord } from "@/domains/learning/types";

const version = sampleCurriculum.lessonVersions[0];
const now = "2026-07-21T00:00:00.000Z";

describe("progress calculation", () => {
  it("calculates required-block progress and ignores optional blocks", () => {
    expect(calculateRequiredBlockProgress(2, 4)).toBe(50);
  });

  it("calculates score separately from accuracy", () => {
    const attempts: BlockAttempt[] = [
      blockAttempt("correct", 1, 1),
      blockAttempt("partially_correct", 0.5, 1)
    ];

    expect(calculateLessonScore(attempts)).toBe(75);
    expect(calculateAccuracy(attempts)).toBe(50);
  });

  it("validates transitions", () => {
    expect(validateProgressTransition("available", "in_progress").valid).toBe(true);
    expect(validateProgressTransition("locked", "completed").valid).toBe(false);
  });

  it("preserves best score and mastery on replay", () => {
    const progress = createInitialProgressSnapshot({
      id: "progress",
      studentId: "student",
      lessonId: version.lessonId,
      lessonVersionId: version.id,
      requiredBlocks: version.blocks,
      createdAt: now
    });
    const mastered = mergeAttemptIntoProgress(progress, lessonAttempt(95, true, true, 3));
    const replay = mergeAttemptIntoProgress(mastered, lessonAttempt(55, false, false, 1));

    expect(replay.status).toBe("mastered");
    expect(replay.bestScore).toBe(95);
    expect(replay.stars).toBe(3);
  });

  it("transitions through lesson start", () => {
    const progress = createInitialProgressSnapshot({
      id: "progress",
      studentId: "student",
      lessonId: version.lessonId,
      lessonVersionId: version.id,
      requiredBlocks: version.blocks,
      createdAt: now
    });
    const result = transitionLessonProgress(progress, {
      type: "start_lesson",
      at: now,
      lessonVersionId: version.id,
      firstBlockId: version.blocks[0].id
    });

    expect(result.ok).toBe(true);
    expect(result.state.status).toBe("in_progress");
  });
});

describe("sessions, events and mastery", () => {
  it("allows active or paused session resumption", () => {
    expect(canResumeSession(session("active"))).toBe(true);
    expect(canResumeSession(session("completed"))).toBe(false);
  });

  it("creates stable learning events with idempotency keys", () => {
    const event = lessonStartedEvent({
      id: "event-1",
      studentId: "student",
      sessionId: "session",
      lessonId: version.lessonId,
      lessonVersionId: version.id,
      objectId: version.lessonId,
      occurredAt: now,
      recordedAt: now,
      idempotencyKey: "student:lesson:start"
    });
    const answer = answerSubmittedEvent({ ...event, id: "event-2", objectId: "assessment" });

    expect(event.verb).toBe("lesson_started");
    expect(answer.objectType).toBe("assessment");
  });

  it("calculates objective mastery with recent evidence weighted", () => {
    expect(calculateObjectiveMastery([]).masteryStatus).toBe("not_started");
    expect(calculateObjectiveMastery([{ score: 30, occurredAt: now }]).masteryStatus).toBe("emerging");
    expect(calculateObjectiveMastery([{ score: 85, occurredAt: now }]).masteryStatus).toBe("mastered");
  });

  it("updates mastery records from attempt evidence", () => {
    const record: MasteryRecord = {
      id: "mastery",
      studentId: "student",
      learningObjectiveId: version.learningObjectives[0].id,
      masteryStatus: "not_started",
      masteryScore: 0,
      evidenceCount: 0,
      lastEvidenceAt: null,
      createdAt: now,
      updatedAt: now
    };

    expect(updateMasteryFromAttempt(record, [{ score: 70, occurredAt: now }], now).masteryStatus).toBe("proficient");
  });
});

function blockAttempt(status: BlockAttempt["status"], scoreEarned: number, scorePossible: number): BlockAttempt {
  return {
    id: `${status}-${scoreEarned}`,
    lessonAttemptId: "attempt",
    blockId: "block",
    attemptNumber: 1,
    status,
    scoreEarned,
    scorePossible,
    xpAwarded: 0,
    hintUsed: false,
    responseTimeSeconds: 10,
    submittedAt: now
  };
}

function lessonAttempt(score: number, passed: boolean, mastered: boolean, stars: number): LessonAttempt {
  return {
    id: `attempt-${score}`,
    studentId: "student",
    lessonId: version.lessonId,
    lessonVersionId: version.id,
    lessonSessionId: "session",
    attemptNumber: 1,
    scorePercentage: score,
    accuracyPercentage: score,
    totalAssessments: 2,
    correctAssessments: 1,
    partiallyCorrectAssessments: 0,
    incorrectAssessments: 1,
    xpAwarded: 10,
    starsAwarded: stars,
    passed,
    mastered,
    startedAt: now,
    submittedAt: now,
    durationSeconds: 100
  };
}

function session(status: LessonSession["status"]): LessonSession {
  return {
    id: "session",
    studentId: "student",
    lessonId: version.lessonId,
    lessonVersionId: version.id,
    status,
    startedAt: now,
    lastActivityAt: now,
    pausedAt: null,
    completedAt: null,
    currentBlockId: null,
    deviceSessionId: "device",
    durationSeconds: 0,
    createdAt: now,
    updatedAt: now
  };
}
