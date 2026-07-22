import { NextResponse } from "next/server";
import { z } from "zod";
import { supportedCurriculumSubjectSchema } from "@/domains/curriculum-ai/schemas/generated-course";
import { CurriculumGenerationError, generateCourseFromCurriculum } from "@/domains/curriculum-ai/services/course-generator";
import { materialiseGeneratedCourse } from "@/domains/curriculum-ai/services/materialise-course";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  subject: supportedCurriculumSubjectSchema,
  grades: z.array(z.number().int().min(1).max(12)).min(1).max(6)
});

const supportedTypes = new Set(["application/pdf", "text/plain", "text/markdown"]);
const maximumBytes = 10 * 1024 * 1024;

export function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_CURRICULUM_MODEL ?? "gpt-5.6-terra",
    supportedSubjects: supportedCurriculumSubjectSchema.options
  });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const metadata = requestSchema.safeParse({
      subject: form.get("subject"),
      grades: String(form.get("grades") ?? "").split(",").filter(Boolean).map(Number)
    });

    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a curriculum PDF or text file." }, { status: 400 });
    if (!metadata.success) return NextResponse.json({ error: "Choose a supported subject and at least one valid grade." }, { status: 400 });
    if (!supportedTypes.has(file.type)) return NextResponse.json({ error: "Supported formats are PDF, TXT and Markdown." }, { status: 415 });
    if (file.size === 0 || file.size > maximumBytes) return NextResponse.json({ error: "The curriculum file must be between 1 byte and 10 MB." }, { status: 413 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const generated = await generateCourseFromCurriculum({ ...metadata.data, fileName: file.name, mimeType: file.type, bytes });
    const materialised = materialiseGeneratedCourse(generated.course, generated.sourceChecksum);
    return NextResponse.json({
      course: generated.course,
      fixture: materialised.fixture,
      validation: { valid: materialised.issues.every((issue) => issue.severity !== "error"), issues: materialised.issues },
      provenance: { responseId: generated.responseId, model: generated.model, sourceChecksum: generated.sourceChecksum, promptVersion: generated.promptVersion, sourceFileName: file.name }
    });
  } catch (error: unknown) {
    if (error instanceof CurriculumGenerationError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "The generated draft failed strict validation.", details: error.issues }, { status: 502 });
    return NextResponse.json({ error: "The curriculum draft could not be generated." }, { status: 500 });
  }
}
