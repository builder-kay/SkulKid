import type { Metadata } from "next";
import { LessonLibrary } from "@/components/admin/lesson-library";
import type { SupportedCurriculumSubject } from "@/domains/curriculum-ai/schemas/generated-course";

export const metadata: Metadata = { title: "Lessons | SkulKid Admin", description: "Manage draft and published lessons by subject." };
const supported = new Set<SupportedCurriculumSubject>(["mathematics", "english-language", "science"]);

export default async function LessonsPage({ searchParams }: { searchParams: Promise<{ subject?: string; courseId?: string }> }) {
  const params = await searchParams;
  const requested = params.subject as SupportedCurriculumSubject;
  return <LessonLibrary initialCourseId={params.courseId} initialSubject={supported.has(requested) ? requested : "mathematics"} />;
}
