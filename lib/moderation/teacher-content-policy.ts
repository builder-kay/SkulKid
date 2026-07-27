import { createHash } from "node:crypto";
import { isIP } from "node:net";

export const REQUIRED_CLEAN_LESSONS = 10;
export const MODERATION_PROMPT_VERSION = "teacher-content-v1";
export const AUTO_APPROVAL_CONFIDENCE = 0.85;

export type TeacherTrustStatus =
  | "probation"
  | "content_trusted"
  | "legacy_trusted"
  | "monitored"
  | "banned";

export type ModerationContentType = "lesson" | "teacher_quiz" | "class_quiz";
export type ModerationCategory =
  | "sexual_content"
  | "harassment_or_insults"
  | "hate"
  | "profanity"
  | "dangerous_content"
  | "spam_or_nonsense"
  | "nonacademic"
  | "commercial"
  | "suspicious_link"
  | "age_inappropriate"
  | "misleading_academic_content";

export type GeminiModerationResult = {
  academicRelevance: "genuine" | "unclear" | "nonacademic";
  severity: "none" | "low" | "medium" | "high" | "critical";
  confidence: number;
  categories: ModerationCategory[];
  reasons: string[];
};

export function stableContentHash(value: unknown) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function stableJson(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `string:${JSON.stringify(value)}`;
  if (typeof value === "number") return `number:${Number.isFinite(value) ? value : String(value)}`;
  if (typeof value === "boolean") return `boolean:${value}`;
  if (typeof value === "bigint") return `bigint:${value}`;
  if (Array.isArray(value)) return `array:[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    return `object:{${Object.keys(source).sort().map((key) => `${JSON.stringify(key)}:${stableJson(source[key])}`).join(",")}}`;
  }
  return `${typeof value}:${String(value)}`;
}

export function isDeterministicSample(contentHash: string) {
  return Number.parseInt(contentHash.slice(0, 8), 16) % 10 === 0;
}

export function shouldModerateContent(input: {
  trustStatus: TeacherTrustStatus;
  monitoringRemaining: number;
  contentHash: string;
  hasExternalMedia: boolean;
}) {
  if (input.trustStatus === "banned") return true;
  if (input.trustStatus === "probation" || input.trustStatus === "monitored") return true;
  if (input.monitoringRemaining > 0 || input.hasExternalMedia) return true;
  return isDeterministicSample(input.contentHash);
}

export function canAutoApprove(result: GeminiModerationResult) {
  return result.academicRelevance === "genuine"
    && result.severity === "none"
    && result.categories.length === 0
    && result.confidence >= AUTO_APPROVAL_CONFIDENCE;
}

export function nextTrustState(input: {
  status: TeacherTrustStatus;
  cleanLessonCount: number;
  approvedDistinctLesson: boolean;
}) {
  const count = input.cleanLessonCount + (input.approvedDistinctLesson ? 1 : 0);
  if (input.status === "probation" && count >= REQUIRED_CLEAN_LESSONS) {
    return { status: "content_trusted" as const, cleanLessonCount: count, trusted: true };
  }
  return { status: input.status, cleanLessonCount: count, trusted: false };
}

export function isPrivateNetworkAddress(address: string) {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 192 && b === 0 && (c === 0 || c === 2))
      || (a === 198 && (b === 18 || b === 19))
      || (a === 198 && b === 51 && c === 100)
      || (a === 203 && b === 0 && c === 113);
  }
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice("::ffff:".length);
    if (isIP(mapped) === 4) return isPrivateNetworkAddress(mapped);
  }
  return normalized === "::1" || normalized === "::"
    || normalized.startsWith("fc") || normalized.startsWith("fd")
    || /^fe[89ab]/.test(normalized)
    || normalized.startsWith("ff")
    || normalized.startsWith("2001:db8:");
}
