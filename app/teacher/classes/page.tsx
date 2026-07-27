import { TeacherClassesPage } from "@/components/teacher/teacher-classes-page";

export default async function TeacherClassesRoute({
  searchParams
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const params = await searchParams;
  return <TeacherClassesPage initialCreate={params.create === "1"} />;
}
