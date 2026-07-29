import { AdminCommandCenter } from "@/components/admin/admin-command-center";
import { LayoutDashboard } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function PlatformAdminHomePage() {
  return (
    <main className="mx-auto grid w-full max-w-[96rem] gap-7">
      <AdminPageHeader description="Protect people, resolve urgent work, and keep SkulKid healthy from one accountable workspace." eyebrow="Platform command center" icon={LayoutDashboard} title="Good decisions start with a clear system view." tone="dark" />
      <AdminCommandCenter />
    </main>
  );
}
