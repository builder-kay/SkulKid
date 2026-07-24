import { JoinClassPage } from "@/components/student/join-class-page";

export default async function JoinRoute({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <JoinClassPage code={code} />;
}
