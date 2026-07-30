import { NextResponse } from "next/server";
import { processOneModerationJob } from "@/lib/break-zone/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.BREAK_ZONE_CRON_SECRET ?? process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const result = await processOneModerationJob(`cron-${crypto.randomUUID()}`);
  await createAdminClient().rpc("cleanup_break_zone_identifiers");
  return NextResponse.json(result);
}
