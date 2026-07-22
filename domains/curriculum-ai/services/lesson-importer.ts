import { importedLessonJsonSchema, importedLessonSchema, importedQuizJsonSchema, importedQuizSchema } from "@/domains/curriculum-ai/schemas/lesson-import";
import type { ImportedLesson, ImportedQuiz } from "@/domains/curriculum-ai/schemas/lesson-import";
import type { SupportedCurriculumSubject } from "@/domains/curriculum-ai/schemas/generated-course";

const endpoint = "https://api.openai.com/v1/responses";

export class LessonImportError extends Error {
  constructor(message: string, readonly status = 500) { super(message); this.name = "LessonImportError"; }
}

type Input = { mode: "lesson" | "quiz"; subject: SupportedCurriculumSubject; grade: number; fileName: string; mimeType: string; bytes: Uint8Array };

export async function importLessonFile(input: Input): Promise<{ data: ImportedLesson | ImportedQuiz; model: string; responseId: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new LessonImportError("OPENAI_API_KEY is not configured on the server.", 503);
  const model = process.env.OPENAI_LESSON_MODEL ?? process.env.OPENAI_CURRICULUM_MODEL ?? "gpt-5.6-sol";
  const fileContent = input.mimeType === "application/pdf"
    ? { type: "input_file", filename: input.fileName, file_data: `data:application/pdf;base64,${Buffer.from(input.bytes).toString("base64")}` }
    : { type: "input_text", text: new TextDecoder().decode(input.bytes) };
  const lessonMode = input.mode === "lesson";
  const schema = lessonMode ? importedLessonJsonSchema : importedQuizJsonSchema;
  const prompt = lessonMode
    ? `Extract one editable ${input.subject} lesson for Basic ${input.grade} from the attached teacher note. Preserve stated facts and curriculum references. Fill every field using age-appropriate wording. Teaching text may use ## headings, lists, **bold**, *italics* and [tip] callouts. Do not create quiz multiple-choice questions. Return only the schema.`
    : `Extract the existing quiz from this file, or create a balanced quiz from the attached lesson note, for ${input.subject}, Basic ${input.grade}. Produce every useful question present, up to 30. Each question needs exactly three options, the correct option index, a helpful hint and an explanation. Never use trick questions. Return only the schema.`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, reasoning: { effort: "medium" },
      input: [{ role: "user", content: [fileContent, { type: "input_text", text: prompt }] }],
      text: { format: { type: "json_schema", name: lessonMode ? "skulkid_lesson_import" : "skulkid_quiz_import", strict: true, schema }, verbosity: "medium" }
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new LessonImportError(`OpenAI extraction failed (${response.status}): ${detail.slice(0, 400)}`, 502);
  }
  const payload = await response.json() as { id?: string; output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const outputText = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  if (!outputText) throw new LessonImportError("OpenAI returned no structured content.", 502);
  const data = lessonMode ? importedLessonSchema.parse(JSON.parse(outputText)) : importedQuizSchema.parse(JSON.parse(outputText));
  return { data, model, responseId: payload.id ?? "unknown" };
}
