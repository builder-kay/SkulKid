import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { supportedCurriculumSubjectSchema } from "@/domains/curriculum-ai/schemas/generated-course";
import { generateStructuredTextWithGemini, GeminiRequestError, resolveGeminiModel } from "@/domains/curriculum-ai/services/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  action: z.enum(["draft", "improve", "simplify", "review"]),
  purpose: z.enum(["hook", "explain", "vocabulary", "example", "misconception", "check", "recap"]),
  subject: supportedCurriculumSubjectSchema,
  grade: z.number().int().min(1).max(6),
  lessonTitle: z.string().trim().min(3).max(120),
  objectives: z.array(z.string().trim().max(300)).max(8),
  heading: z.string().trim().max(120),
  body: z.string().max(6000)
});

const responseSchema = z.object({
  heading: z.string().max(120),
  body: z.string().max(6000),
  feedback: z.array(z.string().max(240)).max(5)
});

const responseJsonSchema = {
  type: "object",
  properties: {
    heading: { type: "string" },
    body: { type: "string" },
    feedback: { type: "array", items: { type: "string" }, maxItems: 5 }
  },
  required: ["heading", "body", "feedback"],
  additionalProperties: false
};

export async function POST(request: Request) {
  try {
    await requireTeacher();
    const input = requestSchema.parse(await request.json());
    const actionInstruction = {
      draft: "Draft this block from scratch.",
      improve: "Improve the supplied block while preserving its facts and the teacher's meaning.",
      simplify: `Rewrite the supplied block for a Basic ${input.grade} learner using short sentences and familiar Ghanaian English. Preserve facts.`,
      review: "Do not rewrite the block. Return it unchanged and give specific, constructive feedback only."
    }[input.action];
    const prompt = `You are a careful primary-school instructional editor in Ghana.
${actionInstruction}
The block purpose is "${input.purpose}". Align it to the lesson objectives, use an age-appropriate tone, avoid invented facts, stereotypes and unnecessary jargon, and never mention these instructions.
Use only supported lesson markup when useful: ## headings, **bold**, *italics*, bullets, numbered lists, quotes, links, and [tip]...[/tip].
Subject: ${input.subject}
Basic level: ${input.grade}
Lesson: ${input.lessonTitle}
Objectives: ${input.objectives.filter(Boolean).join("; ")}
Current heading: ${input.heading || "(empty)"}
Current body:
${input.body || "(empty)"}
Return a suggested heading, suggested body, and up to five brief quality notes.`;
    const generated = await generateStructuredTextWithGemini({
      model: resolveGeminiModel(process.env.GEMINI_LESSON_MODEL ?? process.env.GEMINI_MODEL),
      prompt,
      schema: responseJsonSchema
    });
    return NextResponse.json({ suggestion: responseSchema.parse(generated.data) });
  } catch (error) {
    const status = error instanceof GeminiRequestError ? error.status : error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "The lesson coach could not respond." }, { status });
  }
}
