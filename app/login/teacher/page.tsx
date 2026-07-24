import { AuthPage } from "@/components/auth/auth-page";

export default async function TeacherLoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <AuthPage audience="teacher" mode="login" nextPath={params.next} />;
}
