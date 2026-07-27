import { NextResponse } from "next/server";
import { adminContext } from "@/lib/admin/admin-server";

export async function GET() {
  try {
    const { admin } = await adminContext();
    const [{ data: audits, error }, { data: authUsers }] = await Promise.all([
      admin.from("AdminAuditEvent")
        .select("id,action,targetType,targetId,reason,createdAt")
        .order("createdAt", { ascending: false })
        .limit(30),
      admin.auth.admin.listUsers({ page: 1, perPage: 50 })
    ]);
    if (error) throw new Error(error.message);
    const adminEvents = (audits ?? []).map((event) => ({
      id: `audit-${event.id}`,
      type: event.targetType as string,
      title: String(event.action).replaceAll(".", " "),
      detail: (event.reason as string | null) || `${event.targetType}${event.targetId ? ` · ${event.targetId}` : ""}`,
      at: event.createdAt as string
    }));
    const userEvents = (authUsers?.users ?? [])
      .slice()
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 10)
      .map((user) => ({
        id: `user-${user.id}`,
        type: "user",
        title: "New account",
        detail: `${user.phone || user.email || user.id} joined as ${user.app_metadata?.role || "student"}`,
        at: user.created_at
      }));
    const events = [...adminEvents, ...userEvents]
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 30);
    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load activity.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 500 });
  }
}
