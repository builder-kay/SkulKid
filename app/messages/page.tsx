import { StudentMessagesPage } from "@/components/student/student-messages-page";

export default async function MessagesRoute({
  searchParams
}: {
  searchParams: Promise<{ classId?: string; thread?: string }>;
}) {
  const { classId, thread } = await searchParams;
  return (
    <StudentMessagesPage
      initialClassId={classId ?? ""}
      initialThread={thread === "dm" ? "dm" : "group"}
    />
  );
}
