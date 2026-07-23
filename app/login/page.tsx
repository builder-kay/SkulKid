import { AuthPage } from "@/components/auth/auth-page";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthPage mode="login" nextPath={next} />;
}
