import { describe, expect, it } from "vitest";
import {
  canAutoApprove,
  isDeterministicSample,
  isPrivateNetworkAddress,
  nextTrustState,
  shouldModerateContent,
  stableContentHash
} from "@/lib/moderation/teacher-content-policy";

describe("teacher content moderation policy", () => {
  it("hashes equivalent snapshots identically regardless of object key order", () => {
    expect(stableContentHash({
      title: "Fractions",
      questions: [{ prompt: "One half?", answers: [1, 2] }]
    })).toBe(stableContentHash({
      questions: [{ answers: [1, 2], prompt: "One half?" }],
      title: "Fractions"
    }));
    expect(stableContentHash({ value: undefined })).not.toBe(stableContentHash({}));
  });

  it("always checks probation, monitored, and external-media submissions", () => {
    const common = { monitoringRemaining: 0, contentHash: "ffffffff", hasExternalMedia: false };
    expect(shouldModerateContent({ ...common, trustStatus: "probation" })).toBe(true);
    expect(shouldModerateContent({ ...common, trustStatus: "monitored" })).toBe(true);
    expect(shouldModerateContent({ ...common, trustStatus: "content_trusted", hasExternalMedia: true })).toBe(true);
    expect(shouldModerateContent({ ...common, trustStatus: "legacy_trusted", monitoringRemaining: 3 })).toBe(true);
  });

  it("uses a stable ten-percent sample for otherwise trusted content", () => {
    expect(isDeterministicSample("00000000")).toBe(true);
    expect(isDeterministicSample("00000001")).toBe(false);
    expect(shouldModerateContent({
      trustStatus: "content_trusted",
      monitoringRemaining: 0,
      contentHash: "00000000",
      hasExternalMedia: false
    })).toBe(true);
    expect(shouldModerateContent({
      trustStatus: "legacy_trusted",
      monitoringRemaining: 0,
      contentHash: "00000001",
      hasExternalMedia: false
    })).toBe(false);
  });

  it("auto-approves only confident, safe, genuinely academic content", () => {
    const safe = {
      academicRelevance: "genuine" as const,
      severity: "none" as const,
      confidence: 0.85,
      categories: [],
      reasons: ["A clear Basic 4 mathematics lesson."]
    };
    expect(canAutoApprove(safe)).toBe(true);
    expect(canAutoApprove({ ...safe, confidence: 0.849 })).toBe(false);
    expect(canAutoApprove({ ...safe, academicRelevance: "unclear" })).toBe(false);
    expect(canAutoApprove({ ...safe, severity: "low" })).toBe(false);
    expect(canAutoApprove({ ...safe, categories: ["spam_or_nonsense"] })).toBe(false);
  });

  it("grants content trust on the tenth distinct clean lesson only", () => {
    expect(nextTrustState({
      status: "probation",
      cleanLessonCount: 9,
      approvedDistinctLesson: true
    })).toEqual({ status: "content_trusted", cleanLessonCount: 10, trusted: true });
    expect(nextTrustState({
      status: "probation",
      cleanLessonCount: 9,
      approvedDistinctLesson: false
    })).toEqual({ status: "probation", cleanLessonCount: 9, trusted: false });
    expect(nextTrustState({
      status: "legacy_trusted",
      cleanLessonCount: 0,
      approvedDistinctLesson: true
    })).toEqual({ status: "legacy_trusted", cleanLessonCount: 1, trusted: false });
  });

  it("blocks private, local, mapped, and reserved image destinations", () => {
    for (const address of [
      "127.0.0.1",
      "10.10.1.2",
      "172.20.1.2",
      "192.168.1.2",
      "169.254.169.254",
      "100.64.0.1",
      "198.18.0.1",
      "::1",
      "fd00::1",
      "fe80::1",
      "::ffff:127.0.0.1"
    ]) {
      expect(isPrivateNetworkAddress(address), address).toBe(true);
    }
    expect(isPrivateNetworkAddress("8.8.8.8")).toBe(false);
    expect(isPrivateNetworkAddress("2606:4700:4700::1111")).toBe(false);
  });
});
