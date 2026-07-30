import type { Metadata } from "next";
import { TeacherGuide } from "@/components/teacher/teacher-guide";

export const metadata: Metadata = {
  title: "Video Tutorials | SkulKid",
  description: "Practical video tutorials for every SkulKid teacher workflow."
};

export default async function TeacherTutorialPage({
  searchParams
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const params = await searchParams;
  return <TeacherGuide initialTopic={typeof params.topic === "string" ? params.topic : ""} />;
}
