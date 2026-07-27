import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/auth/clifze";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { allowOtpRequest } from "@/lib/auth/rate-limit";
import { platformActionUrl } from "@/lib/auth/sms-links";
import { findSupabaseUserByPhone } from "@/lib/auth/supabase-phone-user";
import { isTeacherPhoneBanned } from "@/lib/moderation/teacher-phone-ban";

const schema = z.object({ phone: z.string().min(9).max(20) });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const phone = normalizeGhanaPhone(input.phone);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!allowOtpRequest(`teacher-appeal:${ip}:${phone}`)) {
      return NextResponse.json({ error: "Too many codes requested. Please wait 10 minutes." }, { status: 429 });
    }
    const [user, banned] = await Promise.all([findSupabaseUserByPhone(phone), isTeacherPhoneBanned(phone)]);
    if (user && banned && user.app_metadata?.role === "teacher") {
      await sendOtp(phone, "teacher-moderation-appeal", platformActionUrl(request, "/teacher/appeal"));
    }
    return NextResponse.json({
      ok: true,
      message: "If this number is eligible for an appeal, a six-digit code has been sent."
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start the appeal." }, { status: 400 });
  }
}
