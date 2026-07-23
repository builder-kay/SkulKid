import { createHash } from "node:crypto";
import { generatedCourseJsonSchema, generatedCourseSchema } from "@/domains/curriculum-ai/schemas/generated-course";
import type { GeneratedCourse, SupportedCurriculumSubject } from "@/domains/curriculum-ai/schemas/generated-course";
import { generateStructuredWithGemini, GeminiRequestError, resolveGeminiModel } from "@/domains/curriculum-ai/services/gemini";

const promptVersion = "skulkid-gemini-curriculum-v1";

export type GenerateCourseInput = {
  subject: SupportedCurriculumSubject;
  grades: number[];
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
};

export type GenerateCourseResult = {
  course: GeneratedCourse;
  responseId: string;
  model: string;
  sourceChecksum: string;
  promptVersion: string;
};

export class CurriculumGenerationError extends Error {
  constructor(message: string, readonly status = 500) {
    super(message);
    this.name = "CurriculumGenerationError";
  }
}

export async function generateCourseFromCurriculum(input: GenerateCourseInput): Promise<GenerateCourseResult> {
  const model = resolveGeminiModel(process.env.GEMINI_CURRICULUM_MODEL ?? process.env.GEMINI_MODEL);
  const sourceChecksum = createHash("sha256").update(input.bytes).digest("hex");
  try {
    const generated = await generateStructuredWithGemini({ model, prompt: buildPrompt(input.subject, input.grades), mimeType: input.mimeType, bytes: input.bytes, schema: generatedCourseJsonSchema });
    return { course: generatedCourseSchema.parse(generated.data), responseId: generated.responseId, model, sourceChecksum, promptVersion };
  } catch (error) {
    if (error instanceof GeminiRequestError) throw new CurriculumGenerationError(error.message, error.status);
    throw error;
  }
}

function buildPrompt(subject: SupportedCurriculumSubject, grades: number[]) {
  return `You are the SkulKid curriculum designer. Analyse only the attached source and create a complete, playful course draft for ${subject}, grades ${grades.join(", ")}.

Requirements:
- Preserve curriculum strand, standard and indicator references exactly when present.
- Cover all important source outcomes for the selected grades; do not invent official standards.
- Create short 5-20 minute missions with explicit progression and age-appropriate Ghanaian contexts where natural.
- Every lesson needs direct teaching, a worked example, one three-option question, one true/false checkpoint, hints, explanations and retrieval-focused summary points.
- Wrong choices must be plausible misconceptions, never trick questions.
- Keep language encouraging, inclusive and suitable for children. Avoid stereotypes, shame, unsafe activities and copyrighted textbook passages.
- For Mathematics require reasoning, not answer guessing. For English integrate meaningful language use. For Science distinguish observation, evidence and explanation.
- Return only the requested JSON schema. This is a draft for human review, never a final publication.`;
}
