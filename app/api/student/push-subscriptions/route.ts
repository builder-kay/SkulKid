import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(20).max(512),
    auth: z.string().min(8).max(256)
  })
});
const deleteSchema = z.object({ endpoint: z.string().url().max(2048) });

export async function GET() {
  try {
    const student = await requireStudent();
    const publicKey = process.env.VAPID_PUBLIC_KEY || "";
    const { count } = await createAdminClient()
      .from("StudentPushSubscription")
      .select("id", { count: "exact", head: true })
      .eq("userId", student.id)
      .eq("enabled", true);
    return NextResponse.json({ configured: Boolean(publicKey && process.env.VAPID_PRIVATE_KEY), publicKey, subscribedDevices: count ?? 0 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to inspect push notifications." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const student = await requireStudent();
    const input = subscriptionSchema.parse(await request.json());
    const { error } = await createAdminClient().from("StudentPushSubscription").upsert({
      userId: student.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
      enabled: true,
      failureCount: 0,
      updatedAt: new Date().toISOString()
    }, { onConflict: "endpoint" });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to enable push notifications." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const student = await requireStudent();
    const input = deleteSchema.parse(await request.json());
    const { error } = await createAdminClient().from("StudentPushSubscription").delete().eq("userId", student.id).eq("endpoint", input.endpoint);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to disable push notifications." }, { status: 400 });
  }
}
