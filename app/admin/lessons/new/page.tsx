import type { Metadata } from "next";
import { ManualLessonBuilder } from "@/components/admin/manual-lesson-builder";
import { resolveGeminiModel } from "@/domains/curriculum-ai/services/gemini";

export const metadata: Metadata = { title: "Create Lesson | SkulKid Admin", description: "Create, import, review and validate a SkulKid lesson." };

export default async function CreateLessonPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  return <ManualLessonBuilder editLessonId={edit} initialAiConfigured={Boolean(process.env.GEMINI_API_KEY)} initialAiModel={resolveGeminiModel(process.env.GEMINI_LESSON_MODEL ?? process.env.GEMINI_MODEL)} />;
}
