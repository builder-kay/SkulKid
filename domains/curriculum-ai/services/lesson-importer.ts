import { importedLessonJsonSchema, importedLessonSchema, importedQuizJsonSchema, importedQuizSchema } from "@/domains/curriculum-ai/schemas/lesson-import";
import type { ImportedLesson, ImportedQuiz } from "@/domains/curriculum-ai/schemas/lesson-import";
import type { SupportedCurriculumSubject } from "@/domains/curriculum-ai/schemas/generated-course";
import { generateStructuredWithGemini, GeminiRequestError, resolveGeminiModel } from "@/domains/curriculum-ai/services/gemini";

export class LessonImportError extends Error {
  constructor(message: string, readonly status = 500) { super(message); this.name = "LessonImportError"; }
}

type Input = { mode: "lesson" | "quiz"; subject: SupportedCurriculumSubject; grade: number; questionCount: number; fileName: string; mimeType: string; bytes: Uint8Array };

export async function importLessonFile(input: Input): Promise<{ data: ImportedLesson | ImportedQuiz; model: string; responseId: string }> {
  const model = resolveGeminiModel(process.env.GEMINI_LESSON_MODEL ?? process.env.GEMINI_MODEL);
  const lessonMode = input.mode === "lesson";
  const schema = schemaWithQuestionCount(lessonMode ? importedLessonJsonSchema : importedQuizJsonSchema, input.questionCount);
  const prompt = lessonMode
    ? `Extract one editable ${input.subject} lesson for Basic ${input.grade} from the attached teacher note. Preserve stated facts and curriculum references. Fill every field using age-appropriate wording. Teaching text may use ## headings, lists, **bold**, *italics* and [tip] callouts. Also extract or create exactly ${input.questionCount} balanced three-option quiz question${input.questionCount === 1 ? "" : "s"} from the lesson content. Each question needs one correct answer, a helpful hint and a clear explanation. Never use trick questions. Return only the schema.`
    : `Extract or create exactly ${input.questionCount} balanced quiz question${input.questionCount === 1 ? "" : "s"} from this file for ${input.subject}, Basic ${input.grade}. Each question needs exactly three options, the correct option index, a helpful hint and an explanation. Never use trick questions. Return only the schema.`;
  try {
    const generated = await generateStructuredWithGemini({ model, prompt, mimeType: input.mimeType, bytes: input.bytes, schema });
    const data = lessonMode ? importedLessonSchema.parse(generated.data) : importedQuizSchema.parse(generated.data);
    return { data, model, responseId: generated.responseId };
  } catch (error) {
    if (error instanceof GeminiRequestError) throw new LessonImportError(error.message, error.status);
    throw error;
  }
}

function schemaWithQuestionCount(schema: unknown, questionCount: number) {
  const copy = structuredClone(schema) as { properties?: { questions?: { minItems?: number; maxItems?: number } } };
  const questions = copy.properties?.questions;
  if (questions) { questions.minItems = questionCount; questions.maxItems = questionCount; }
  return copy;
}
