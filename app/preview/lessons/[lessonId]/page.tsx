import { PublishedLessonPlayer } from "@/components/student/published-lesson-player";

type Props = { params: Promise<{ lessonId: string }> };

export default async function LessonPage({ params }: Props) {
  const { lessonId } = await params;
  return <PublishedLessonPlayer lessonId={lessonId} />;
}
