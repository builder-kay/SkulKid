import { StudentClassDetail } from "@/components/student/student-class-detail";

export default async function StudentClassDetailRoute({
  params
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  return <StudentClassDetail classId={classId} />;
}
