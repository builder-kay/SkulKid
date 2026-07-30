import type { Metadata } from "next";
import { ManualLessonBuilder } from "@/components/admin/manual-lesson-builder";
import { resolveGeminiModel } from "@/domains/curriculum-ai/services/gemini";

export const metadata: Metadata = { title: "Create Lesson | SkulKid Teacher", description: "Create, import, review and publish a pupil-ready lesson." };

export default async function CreateLessonPage({ searchParams }: { searchParams: Promise<{ edit?: string; courseId?: string; classId?: string }> }) {
  const { edit, courseId, classId } = await searchParams;
  return <ManualLessonBuilder editLessonId={edit} initialClassId={classId} initialCourseId={courseId} initialAiConfigured={Boolean(process.env.GEMINI_API_KEY)} initialAiModel={resolveGeminiModel(process.env.GEMINI_LESSON_MODEL ?? process.env.GEMINI_MODEL)} />;
}
