import { PublishedLessonPlayer } from "@/components/student/published-lesson-player";

type Props = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ classId?: string; course?: string }>;
};

export default async function LessonPage({ params, searchParams }: Props) {
  const { lessonId } = await params;
  const { classId, course } = await searchParams;
  return <PublishedLessonPlayer classId={classId} courseSlug={course} lessonId={lessonId} />;
}
