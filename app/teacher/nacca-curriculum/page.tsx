import type { Metadata } from "next";
import { OfficialCurriculumLibrary } from "@/components/admin/official-curriculum-library";
import { TeacherCurriculumUploads } from "@/components/teacher/teacher-curriculum-uploads";

export const metadata: Metadata = { title: "NaCCA Curriculum | SkulKid Teacher", description: "Browse official Ghana curriculum sources and manage teacher curriculum references." };
export default function Page() {
  return <main className="mx-auto w-full max-w-7xl"><TeacherCurriculumUploads /><OfficialCurriculumLibrary /></main>;
}
