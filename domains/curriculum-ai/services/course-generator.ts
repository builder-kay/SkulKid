import { createHash } from "node:crypto";
import { generatedCourseJsonSchema, generatedCourseSchema } from "@/domains/curriculum-ai/schemas/generated-course";
import type { GeneratedCourse, SupportedCurriculumSubject } from "@/domains/curriculum-ai/schemas/generated-course";

const endpoint = "https://api.openai.com/v1/responses";
const promptVersion = "skulkid-curriculum-v1";

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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new CurriculumGenerationError("OPENAI_API_KEY is not configured on the server.", 503);

  const model = process.env.OPENAI_CURRICULUM_MODEL ?? "gpt-5.6-terra";
  const sourceChecksum = createHash("sha256").update(input.bytes).digest("hex");
  const fileContent = input.mimeType === "application/pdf"
    ? { type: "input_file", filename: input.fileName, file_data: `data:application/pdf;base64,${Buffer.from(input.bytes).toString("base64")}` }
    : { type: "input_text", text: new TextDecoder().decode(input.bytes) };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      reasoning: { effort: "medium" },
      input: [{
        role: "user",
        content: [
          fileContent,
          { type: "input_text", text: buildPrompt(input.subject, input.grades) }
        ]
      }],
      text: {
        format: { type: "json_schema", name: "skulkid_generated_course", strict: true, schema: generatedCourseJsonSchema },
        verbosity: "medium"
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new CurriculumGenerationError(`OpenAI generation failed (${response.status}): ${detail.slice(0, 500)}`, 502);
  }

  const payload = await response.json() as { id?: string; output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const outputText = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  if (!outputText) throw new CurriculumGenerationError("OpenAI returned no structured course content.", 502);

  const parsedJson: unknown = JSON.parse(outputText);
  return { course: generatedCourseSchema.parse(parsedJson), responseId: payload.id ?? "unknown", model, sourceChecksum, promptVersion };
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
