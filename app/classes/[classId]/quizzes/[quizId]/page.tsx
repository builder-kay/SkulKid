import { ClassQuizPlayer } from "@/components/student/class-quiz-player";

export default async function ClassQuizRoute({
  params
}: {
  params: Promise<{ classId: string; quizId: string }>;
}) {
  const { classId, quizId } = await params;
  return <ClassQuizPlayer classId={classId} quizId={quizId} />;
}
