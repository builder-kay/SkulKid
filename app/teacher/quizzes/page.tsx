import { TeacherQuizLibrary } from "@/components/teacher/teacher-quiz-library";
export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const params = await searchParams;
  return <TeacherQuizLibrary initialCreate={params.create === "1"} />;
}
