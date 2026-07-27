import type { Metadata } from "next";
import { TeacherGuide } from "@/components/teacher/teacher-guide";

export const metadata: Metadata = {
  title: "Teacher Guide | SkulKid",
  description: "Clear, practical guides for every SkulKid teacher workflow."
};

export default async function TeacherTutorialPage({
  searchParams
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const params = await searchParams;
  return <TeacherGuide initialTopic={typeof params.topic === "string" ? params.topic : ""} />;
}
