import { describe, expect, it } from "vitest";
import { assignedQuizSms, otpSmsMessage, platformActionUrl, recoveredUsernameSms } from "@/lib/auth/sms-links";

describe("authentication SMS links", () => {
  it("builds reason-specific OTP messages", () => {
    expect(otpSmsMessage("learner-password-reset", "https://skulkid.app/forgot-password"))
      .toContain("learner password reset code is [otp]");
    expect(otpSmsMessage("teacher-signup", "https://skulkid.app/signup/teacher"))
      .toContain("Continue: https://skulkid.app/signup/teacher");
  });

  it("uses the request origin when no public URL is configured", () => {
    const previousPublic = process.env.NEXT_PUBLIC_APP_URL;
    const previousApp = process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.APP_URL;
    expect(platformActionUrl(new Request("https://example.test/api/auth/otp/send"), "/forgot-password"))
      .toBe("https://example.test/forgot-password");
    if (previousPublic === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previousPublic;
    if (previousApp === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previousApp;
  });

  it("links recovered usernames directly to learner sign-in", () => {
    expect(recoveredUsernameSms("ama_b4", "https://skulkid.app/login/student"))
      .toBe("Your SkulKid username is: ama_b4. Sign in: https://skulkid.app/login/student Do not share this message.");
  });

  it("includes quiz details, schedule, and direct URL", () => {
    const message = assignedQuizSms({
      quizTitle: "Fractions Challenge",
      className: "Mount Olive",
      startAt: "2026-07-26T08:00:00.000Z",
      endAt: "2026-07-27T16:00:00.000Z",
      quizUrl: "https://skulkid.app/classes/class-1/quizzes/quiz-1"
    });
    expect(message).toContain("Fractions Challenge");
    expect(message).toContain("Mount Olive");
    expect(message).toContain("Opens");
    expect(message).toContain("ends");
    expect(message).toContain("https://skulkid.app/classes/class-1/quizzes/quiz-1");
  });

  it("explains an unscheduled quiz remains open", () => {
    expect(assignedQuizSms({
      quizTitle: "Science",
      className: "Basic 4",
      startAt: null,
      endAt: null,
      quizUrl: "https://skulkid.app/quiz"
    })).toContain("stays available until your teacher ends it");
  });
});
