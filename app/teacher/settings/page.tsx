import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { UserDashboardSettings } from "@/components/admin/user-dashboard-settings";

export const metadata: Metadata = { title: "Teacher Settings | SkulKid" };

export default function UserDashboardSettingsPage() {
  return <div className="grid gap-5">
    <section className="overflow-hidden rounded-[1.75rem] border border-blue-200 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-800 p-5 text-white shadow-lg sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-blue-100"><ShieldCheck className="size-6" /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Communication settings</p>
            <h2 className="mt-1 text-xl font-black sm:text-2xl">Class chat safety</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">Control discussion access and hours, review reports, manage guardian consent, and inspect the supervised message timeline.</p>
          </div>
        </div>
        <Link className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-blue-950 transition hover:bg-blue-50" href="/teacher/settings/class-chat-safety">Manage chat safety<ArrowRight className="size-4" /></Link>
      </div>
    </section>
    <UserDashboardSettings />
  </div>;
}
