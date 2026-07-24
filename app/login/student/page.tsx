import { AuthPage } from "@/components/auth/auth-page";

export default async function StudentLoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <AuthPage audience="student" mode="login" nextPath={params.next} />;
}
