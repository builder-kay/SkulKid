import { describe, expect, it } from "vitest";
import { canUnlockStrand } from "@/lib/lessons/can-unlock-strand";
import type { Lesson } from "@/types/lesson";
import type { Subject } from "@/types/subject";
import type { StudentLessonProgress } from "@/types/progress";

const lesson = (id: string, unitId: string): Lesson => ({
  id, subjectId: "subject", unitId, topicId: "topic", title: id, slug: id,
  description: id, objective: id, difficulty: "beginner", estimatedMinutes: 10,
  xpReward: 10, passingScore: 60, masteryScore: 80, order: 1,
  prerequisiteLessonId: null, blocks: [], status: "published",
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z"
});
const subject: Subject = {
  id: "subject", name: "Subject", slug: "subject", description: "Subject", color: "#000000",
  units: [
    { id: "strand-1", subjectId: "subject", title: "One", slug: "one", description: "", order: 1, topics: [] },
    { id: "strand-2", subjectId: "subject", title: "Two", slug: "two", description: "", order: 2, requiresPrevious: true, topics: [] }
  ]
};
const lessons = [lesson("one-a", "strand-1"), lesson("one-b", "strand-1"), lesson("two-a", "strand-2")];

describe("strand unlocking", () => {
  it("keeps a sequential strand locked until every previous lesson is complete", () => {
    const partial = [{ lessonId: "one-a", status: "completed" }] as StudentLessonProgress[];
    expect(canUnlockStrand(lessons[2], subject, lessons, partial)).toBe(false);
  });

  it("unlocks after every lesson in the previous strand is complete or mastered", () => {
    const complete = [
      { lessonId: "one-a", status: "completed" },
      { lessonId: "one-b", status: "mastered" }
    ] as StudentLessonProgress[];
    expect(canUnlockStrand(lessons[2], subject, lessons, complete)).toBe(true);
  });

  it("leaves open strands available", () => {
    const open = { ...subject, units: subject.units.map((unit) => ({ ...unit, requiresPrevious: false })) };
    expect(canUnlockStrand(lessons[2], open, lessons, [])).toBe(true);
  });
});
