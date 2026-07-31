import type { Metadata } from "next";
import { TeacherProfilePage } from "@/components/teacher/teacher-profile-page";

export const metadata: Metadata = { title: "Teacher Profile | SkulKid" };

export default function ProfilePage() {
  return <TeacherProfilePage />;
}
