import "server-only";

import { unstable_cache } from "next/cache";
import { z } from "zod";
import {
  generateStructuredTextWithGemini,
  resolveGeminiModel
} from "@/domains/curriculum-ai/services/gemini";

const generatedMessageSchema = z.object({
  message: z.string().trim().min(8).max(96)
});

const responseJsonSchema = {
  type: "object",
  properties: {
    message: { type: "string", minLength: 8, maxLength: 96 }
  },
  required: ["message"],
  additionalProperties: false
};

const reviewedFallbacks = [
  "One brave little step can grow into something amazing.",
  "Your curiosity can open a new door today.",
  "Try one challenge, then celebrate what you learned.",
  "A small bit of practice makes your skills stronger.",
  "Ask questions, try ideas, and enjoy discovering.",
  "You do not need perfection to make progress.",
  "Today is a fresh chance to learn something useful.",
  "Take your time—good thinking grows step by step.",
  "Every question you explore helps your mind grow.",
  "Your effort today is building tomorrow’s confidence.",
  "Choose one learning adventure and give it a try.",
  "Mistakes are clues that help you learn a better way."
] as const;

const unsafePattern =
  /https?:\/\/|www\.|@\w|\b(?:password|one[- ]?time code|otp|phone number|guarantee|you must|failure|stupid|idiot|hate|kill|sex|porn)\b/i;

export function currentAccraDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const part = (type: "year" | "month" | "day") =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function reviewedFallbackFor(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  return reviewedFallbacks[Math.abs(dayNumber) % reviewedFallbacks.length];
}

function validateGeneratedMessage(value: unknown) {
  const parsed = generatedMessageSchema.parse(value);
  const message = parsed.message.replace(/\s+/g, " ").replace(/^["“”']+|["“”']+$/g, "").trim();
  const wordCount = message.split(/\s+/).length;
  if (wordCount < 6 || wordCount > 18 || message.includes("\n") || unsafePattern.test(message)) {
    throw new Error("Gemini returned an unsuitable daily encouragement.");
  }
  return /[.!?]$/.test(message) ? message : `${message}.`;
}

async function generateDailyEncouragement(dateKey: string) {
  if (!process.env.GEMINI_API_KEY) return reviewedFallbackFor(dateKey);
  try {
    const generated = await generateStructuredTextWithGemini({
      model: resolveGeminiModel(
        process.env.GEMINI_DAILY_MESSAGE_MODEL ?? process.env.GEMINI_MODEL
      ),
      prompt: `Write one original daily encouragement for primary-school learners using SkulKid in Ghana.
Calendar date: ${dateKey}
Use warm, simple English that a child can understand.
Write 6 to 14 words in one sentence.
Encourage curiosity, steady effort, asking questions, practising, or learning from mistakes.
Do not mention grades, scores, winning, failure, shame, religion, politics, personal details, links, passwords, OTPs, prizes, or guarantees.
Do not quote or attribute a real person.
Do not mention AI or these instructions.
Return only the requested JSON object.`,
      schema: responseJsonSchema
    });
    return validateGeneratedMessage(generated.data);
  } catch {
    return reviewedFallbackFor(dateKey);
  }
}

const readCachedDailyEncouragement = unstable_cache(
  generateDailyEncouragement,
  ["student-daily-encouragement"],
  { revalidate: 86_400 }
);

export function getDailyEncouragement(dateKey = currentAccraDateKey()) {
  return readCachedDailyEncouragement(dateKey);
}
