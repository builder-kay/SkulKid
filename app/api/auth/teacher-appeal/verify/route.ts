import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/clifze";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { findSupabaseUserByPhone } from "@/lib/auth/supabase-phone-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAppealToken, verifyAppealToken } from "@/lib/moderation/appeal-token";
import { isTeacherPhoneBanned } from "@/lib/moderation/teacher-phone-ban";

const verifySchema = z.object({
  action: z.literal("verify"),
  phone: z.string().min(9).max(20),
  otp: z.string().regex(/^\d{6}$/)
});
const submitSchema = z.object({
  action: z.literal("submit"),
  token: z.string().min(20),
  caseId: z.string().uuid().nullable().optional(),
  message: z.string().trim().min(20).max(2000)
});

export async function POST(request: Request) {
  try {
    const raw = await request.json() as { action?: string };
    if (raw.action === "submit") return submitAppeal(submitSchema.parse(raw));
    const input = verifySchema.parse(raw);
    const phone = normalizeGhanaPhone(input.phone);
    const user = await findSupabaseUserByPhone(phone);
    if (!user || user.app_metadata?.role !== "teacher" || !(await isTeacherPhoneBanned(phone))) {
      throw new Error("This appeal could not be verified.");
    }
    await verifyOtp(phone, input.otp);
    const admin = createAdminClient();
    const { data: cases, error } = await admin.from("ContentModerationCase")
      .select("id,contentType,contentId,snapshot,reviewNote,reviewedAt")
      .eq("teacherId", user.id)
      .eq("status", "rejected")
      .order("reviewedAt", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return NextResponse.json({
      token: createAppealToken(user.id),
      cases: (cases ?? []).map((item) => ({
        id: item.id,
        contentType: item.contentType,
        title: titleFrom(item.snapshot),
        reviewNote: item.reviewNote,
        reviewedAt: item.reviewedAt
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not verify the appeal." }, { status: 400 });
  }
}

async function submitAppeal(input: z.infer<typeof submitSchema>) {
  const payload = verifyAppealToken(input.token);
  const admin = createAdminClient();
  if (input.caseId) {
    const { data: moderationCase } = await admin.from("ContentModerationCase")
      .select("id")
      .eq("id", input.caseId)
      .eq("teacherId", payload.teacherId)
      .eq("status", "rejected")
      .maybeSingle();
    if (!moderationCase) throw new Error("The selected decision is not eligible for appeal.");
  }
  const { error } = await admin.from("ModerationAppeal").insert({
    teacherId: payload.teacherId,
    caseId: input.caseId ?? null,
    kind: "account_ban",
    message: input.message,
    authMethod: "otp"
  });
  if (error) {
    if (error.code === "23505") throw new Error("An account-ban appeal is already waiting for review.");
    throw new Error(error.message);
  }
  return NextResponse.json({ ok: true, message: "Your appeal was sent to the SkulKid administrator." }, { status: 201 });
}

function titleFrom(value: unknown) {
  if (!value || typeof value !== "object") return "Moderated content";
  const title = (value as Record<string, unknown>).title;
  return typeof title === "string" && title.trim() ? title : "Moderated content";
}
