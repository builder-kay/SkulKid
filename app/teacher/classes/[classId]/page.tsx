import { TeacherClassDetail } from "@/components/teacher/teacher-class-detail";

export default async function TeacherClassDetailRoute({
  params
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  return <TeacherClassDetail classId={classId} />;
}
