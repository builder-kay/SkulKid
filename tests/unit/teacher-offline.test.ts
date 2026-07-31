import { describe, expect, it } from "vitest";
import {
  classCourseDraftKey,
  classQuizDraftKey,
  libraryQuizDraftKey
} from "@/lib/network/teacher-drafts";
import { classPackKey, isOpenQuizForPack } from "@/lib/network/teacher-class-pack";
import { onlineRequiredMessage } from "@/lib/network/use-online";

describe("teacher offline helpers", () => {
  it("builds stable draft and pack keys", () => {
    expect(classQuizDraftKey("abc")).toBe("teacher-draft:class-quiz:abc");
    expect(classCourseDraftKey("abc")).toBe("teacher-draft:class-course:abc");
    expect(libraryQuizDraftKey("q1")).toBe("teacher-draft:library-quiz:q1");
    expect(libraryQuizDraftKey("")).toBe("teacher-draft:library-quiz:new");
    expect(classPackKey("abc")).toBe("teacher-pack:abc");
  });

  it("keeps only live published quizzes in the overnight pack", () => {
    const now = Date.parse("2026-07-31T12:00:00.000Z");
    expect(isOpenQuizForPack({ status: "published", deadline: null }, now)).toBe(true);
    expect(isOpenQuizForPack({
      status: "published",
      deadline: new Date(now + 3_600_000).toISOString()
    }, now)).toBe(true);
    expect(isOpenQuizForPack({
      status: "published",
      deadline: new Date(now - 1_000).toISOString()
    }, now)).toBe(false);
    expect(isOpenQuizForPack({ status: "draft", deadline: null }, now)).toBe(false);
  });

  it("returns a short connected-state message helper", () => {
    expect(onlineRequiredMessage("Publish quiz")).toContain("connected");
  });
});
