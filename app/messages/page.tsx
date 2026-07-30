import { StudentMessagesPage } from "@/components/student/student-messages-page";

export default async function MessagesRoute({
  searchParams
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const { classId } = await searchParams;
  return <StudentMessagesPage initialClassId={classId ?? ""} />;
}
