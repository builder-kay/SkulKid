import { NextResponse } from "next/server";
import { z } from "zod";
import { supportedCurriculumSubjectSchema } from "@/domains/curriculum-ai/schemas/generated-course";
import { importLessonFile, LessonImportError } from "@/domains/curriculum-ai/services/lesson-importer";
import { resolveGeminiModel } from "@/domains/curriculum-ai/services/gemini";

export const runtime = "nodejs";
export const maxDuration = 300;
const supportedTypes = new Set(["application/pdf", "text/plain", "text/markdown"]);
const metadataSchema = z.object({ mode: z.enum(["lesson", "quiz"]), subject: supportedCurriculumSubjectSchema, grade: z.number().int().min(1).max(12), questionCount: z.number().int().min(1).max(10) });

export function GET() {
  return NextResponse.json({ configured: Boolean(process.env.GEMINI_API_KEY), model: resolveGeminiModel(process.env.GEMINI_LESSON_MODEL ?? process.env.GEMINI_MODEL) });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const metadata = metadataSchema.safeParse({ mode: form.get("mode"), subject: form.get("subject"), grade: Number(form.get("grade")), questionCount: Number(form.get("questionCount")) });
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a lesson or quiz file." }, { status: 400 });
    if (!metadata.success) return NextResponse.json({ error: "Choose a valid import type, subject and grade." }, { status: 400 });
    if (!supportedTypes.has(file.type)) return NextResponse.json({ error: "Supported formats are PDF, TXT and Markdown." }, { status: 415 });
    if (file.size === 0 || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "The file must be between 1 byte and 10 MB." }, { status: 413 });
    const result = await importLessonFile({ ...metadata.data, fileName: file.name, mimeType: file.type, bytes: new Uint8Array(await file.arrayBuffer()) });
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof LessonImportError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "The extracted content did not pass lesson validation.", details: error.issues }, { status: 502 });
    return NextResponse.json({ error: "The uploaded file could not be extracted." }, { status: 500 });
  }
}
