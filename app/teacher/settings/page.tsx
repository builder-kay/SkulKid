import type { Metadata } from "next";
import { UserDashboardSettings } from "@/components/admin/user-dashboard-settings";

export const metadata: Metadata = { title: "Teacher Settings | SkulKid" };

export default function UserDashboardSettingsPage() { return <UserDashboardSettings />; }
