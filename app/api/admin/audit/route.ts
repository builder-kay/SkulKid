import { NextResponse } from "next/server";
import { adminContext } from "@/lib/admin/admin-server";

export async function GET(request: Request) {
  try {
    const { admin } = await adminContext();
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") || "").trim();
    let select = admin.from("AdminAuditEvent")
      .select("id,actorId,action,targetType,targetId,result,reason,createdAt", { count: "exact" })
      .order("createdAt", { ascending: false }).limit(100);
    if (query) select = select.or(`action.ilike.%${query}%,targetType.ilike.%${query}%,targetId.ilike.%${query}%`);
    const { data, count, error } = await select;
    if (error) throw error;
    return NextResponse.json({ events: data ?? [], total: count ?? 0 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load audit history." }, { status: 500 });
  }
}
