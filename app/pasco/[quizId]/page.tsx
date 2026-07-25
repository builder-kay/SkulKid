import type { Metadata } from "next";
import { PascoQuizPage } from "@/components/student/pasco-quiz-page";

export const metadata: Metadata = { title: "PASCO Quiz | SkulKid" };

export default async function Page({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  return <PascoQuizPage quizId={quizId} />;
}
