import { NextResponse } from "next/server";
import { adminContext } from "@/lib/admin/admin-server";

const providers = new Set(["all", "clifze", "arkesel", "bms"]);
const statuses = new Set(["all", "accepted", "rejected"]);

export async function GET(request: Request) {
  try {
    const { admin } = await adminContext();
    const url = new URL(request.url);
    const provider = providers.has(url.searchParams.get("provider") || "")
      ? url.searchParams.get("provider")!
      : "all";
    const status = statuses.has(url.searchParams.get("status") || "")
      ? url.searchParams.get("status")!
      : "all";

    let query = admin
      .from("OtpProviderDiagnostic")
      .select("id,attemptId,provider,purpose,status,maskedPhone,latencyMs,deliveryStatus,error,createdAt")
      .order("createdAt", { ascending: false })
      .limit(200);
    if (provider !== "all") query = query.eq("provider", provider);
    if (status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const events = data ?? [];
    const summary = ["clifze", "arkesel", "bms"].map((name) => {
      const matching = events.filter((event) => event.provider === name);
      const accepted = matching.filter((event) => event.status === "accepted").length;
      return {
        provider: name,
        total: matching.length,
        accepted,
        rejected: matching.length - accepted,
        acceptanceRate: matching.length ? Math.round((accepted / matching.length) * 100) : null,
        averageLatencyMs: matching.length
          ? Math.round(matching.reduce((sum, event) => sum + Number(event.latencyMs), 0) / matching.length)
          : null
      };
    });
    return NextResponse.json({ events, summary, generatedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load OTP diagnostics.";
    return NextResponse.json({ error: message }, { status: message.includes("required") ? 401 : 500 });
  }
}

