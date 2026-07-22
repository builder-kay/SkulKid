import type { Metadata } from "next";
import { UserDashboardSettings } from "@/components/admin/user-dashboard-settings";

export const metadata: Metadata = { title: "User Dashboard Settings | SkulKid Admin" };

export default function UserDashboardSettingsPage() { return <UserDashboardSettings />; }
