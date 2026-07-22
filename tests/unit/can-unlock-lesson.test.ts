import { describe, expect, it } from "vitest";
import { sampleLessons } from "@/data/sample-lessons";
import { canUnlockLesson } from "@/lib/lessons/can-unlock-lesson";
import { resolveLessonStatus } from "@/lib/lessons/resolve-lesson-status";
import type { Lesson } from "@/types/lesson";
import type { StudentLessonProgress } from "@/types/progress";

const firstLesson = sampleLessons[0];
const secondLesson = sampleLessons[1];

function progressFor(status: StudentLessonProgress["status"]): StudentLessonProgress[] {
  return [
    {
      id: `progress-${status}`,
      studentId: "student-test",
      lessonId: firstLesson.id,
      status,
      currentBlockIndex: 0,
      bestScore: status === "mastered" ? 95 : 70,
      latestScore: status === "mastered" ? 95 : 70,
      attemptsCount: 1,
      starsEarned: status === "mastered" ? 3 : 2,
      xpEarned: 60,
      startedAt: "2026-07-21T00:00:00.000Z",
      completedAt: "2026-07-21T00:00:00.000Z",
      lastAccessedAt: "2026-07-21T00:00:00.000Z"
    }
  ];
}

describe("canUnlockLesson", () => {
  it("makes the first published lesson available by default", () => {
    expect(canUnlockLesson(firstLesson, [], sampleLessons)).toBe(true);
    expect(resolveLessonStatus(firstLesson, [], sampleLessons)).toBe("available");
  });

  it("unlocks when the prerequisite is completed", () => {
    expect(canUnlockLesson(secondLesson, progressFor("completed"), sampleLessons)).toBe(true);
  });

  it("unlocks when the prerequisite is mastered", () => {
    expect(canUnlockLesson(secondLesson, progressFor("mastered"), sampleLessons)).toBe(true);
  });

  it("blocks when the prerequisite requires revision", () => {
    expect(canUnlockLesson(secondLesson, progressFor("revision_required"), sampleLessons)).toBe(
      false
    );
  });

  it("blocks draft lessons", () => {
    const draftLesson: Lesson = { ...firstLesson, id: "draft-lesson", status: "draft" };

    expect(canUnlockLesson(draftLesson, [], [draftLesson])).toBe(false);
  });

  it("blocks archived lessons", () => {
    const archivedLesson: Lesson = { ...firstLesson, id: "archived-lesson", status: "archived" };

    expect(canUnlockLesson(archivedLesson, [], [archivedLesson])).toBe(false);
  });
});
