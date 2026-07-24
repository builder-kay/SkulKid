import Link from "next/link";
import { AuthRoleChooser } from "@/components/auth/auth-role-chooser";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; reset?: string; created?: string }>;
}) {
  const params = await searchParams;
  return <AuthRoleChooser intent="login" nextPath={params.next} />;
}
