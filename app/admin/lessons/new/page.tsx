import type { Metadata } from "next";
import { ManualLessonBuilder } from "@/components/admin/manual-lesson-builder";

export const metadata: Metadata = { title: "Create Lesson | SkulKid Admin", description: "Create, import, review and validate a SkulKid lesson." };

export default function CreateLessonPage() {
  return <ManualLessonBuilder initialAiConfigured={Boolean(process.env.OPENAI_API_KEY)} initialAiModel={process.env.OPENAI_LESSON_MODEL ?? process.env.OPENAI_CURRICULUM_MODEL ?? "gpt-5.6-sol"} />;
}
