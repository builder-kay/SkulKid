import { describe, expect, it } from "vitest";
import {
  canSubmitPublicLearning,
  deriveCourseAudience,
  publicLearnersKeepCurrentVersion
} from "@/lib/public-learning/rules";

describe("Public Learning publishing rules", () => {
  it("derives class, public and combined course audiences", () => {
    expect(deriveCourseAudience("class", ["class-a"])).toBe("class_only");
    expect(deriveCourseAudience("platform", [])).toBe("public");
    expect(deriveCourseAudience("platform", ["class-a", "class-b"])).toBe("both");
  });

  it("requires publishing permission, a ready lesson and no pending review", () => {
    expect(canSubmitPublicLearning({ allowTeacherPublishing: false, readyLessonCount: 2 })).toEqual({
      allowed: false,
      reason: "publishing_paused"
    });
    expect(canSubmitPublicLearning({ allowTeacherPublishing: true, readyLessonCount: 0 })).toEqual({
      allowed: false,
      reason: "no_ready_lessons"
    });
    expect(canSubmitPublicLearning({ allowTeacherPublishing: true, readyLessonCount: 2, latestStatus: "pending_review" })).toEqual({
      allowed: false,
      reason: "already_in_review"
    });
    expect(canSubmitPublicLearning({ allowTeacherPublishing: true, readyLessonCount: 2, latestStatus: "changes_requested" }).allowed).toBe(true);
  });

  it("keeps the approved public version while review is unresolved", () => {
    expect(publicLearnersKeepCurrentVersion("pending_review")).toBe(true);
    expect(publicLearnersKeepCurrentVersion("changes_requested")).toBe(true);
    expect(publicLearnersKeepCurrentVersion("approved")).toBe(false);
  });
});
