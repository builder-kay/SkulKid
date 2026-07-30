import "server-only";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;

function configure() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@skulkid.app", publicKey, privateKey);
  configured = true;
  return true;
}

export async function sendClassMessagePush(input: { classId: string; senderId: string; kind: "discussion" | "announcement" }) {
  if (!configure()) return { sent: 0, failed: 0, skipped: true };
  const admin = createAdminClient();
  const [{ data: classroom }, { data: memberships }] = await Promise.all([
    admin.from("TeacherClass").select("name").eq("id", input.classId).maybeSingle(),
    admin.from("ClassMembership").select("studentId").eq("classId", input.classId).eq("status", "active")
  ]);
  const recipientIds = (memberships ?? []).map((row) => String(row.studentId)).filter((id) => id !== input.senderId);
  if (!recipientIds.length) return { sent: 0, failed: 0, skipped: false };
  const { data: subscriptions } = await admin.from("StudentPushSubscription").select("id,endpoint,p256dh,auth").in("userId", recipientIds).eq("enabled", true);
  const payload = JSON.stringify({
    title: input.kind === "announcement" ? "New class announcement" : "Class discussion is active",
    body: `${String(classroom?.name ?? "Your class")} has a new message. Open SkulKid to read it.`,
    url: `/classes/${input.classId}`,
    tag: `class-chat-${input.classId}`
  });
  let sent = 0, failed = 0;
  await Promise.all((subscriptions ?? []).map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: String(subscription.endpoint),
        keys: { p256dh: String(subscription.p256dh), auth: String(subscription.auth) }
      }, payload, { TTL: 300, urgency: input.kind === "announcement" ? "high" : "normal" });
      sent += 1;
      await admin.from("StudentPushSubscription").update({ lastSuccessAt: new Date().toISOString(), failureCount: 0, updatedAt: new Date().toISOString() }).eq("id", subscription.id);
    } catch (error) {
      failed += 1;
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await admin.from("StudentPushSubscription").delete().eq("id", subscription.id);
      } else {
        await admin.from("StudentPushSubscription").update({ lastFailureAt: new Date().toISOString(), failureCount: 1, updatedAt: new Date().toISOString() }).eq("id", subscription.id);
      }
    }
  }));
  return { sent, failed, skipped: false };
}
