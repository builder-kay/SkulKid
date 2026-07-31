import type { Metadata } from "next";
import { TeacherSettingsWorkspace } from "@/components/teacher/teacher-settings-workspace";

export const metadata: Metadata = { title: "Teacher Settings | SkulKid" };

export default function TeacherSettingsPage() { return <TeacherSettingsWorkspace />; }
