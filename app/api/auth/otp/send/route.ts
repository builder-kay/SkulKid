import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/auth/clifze";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { allowOtpRequest } from "@/lib/auth/rate-limit";
import {
  assertStudentPhoneAvailable,
  findSupabaseUserByUsername,
  findTeacherByPhone
} from "@/lib/auth/student-identity";
import { platformActionUrl } from "@/lib/auth/sms-links";
import { updateSignupFunnel } from "@/lib/auth/signup-funnel";
import { recordOperationalEvent, requestIp } from "@/lib/admin/operational-events";
import { assertTeacherPhoneNotBanned } from "@/lib/moderation/teacher-phone-ban";

export const runtime = "nodejs";
export const maxDuration = 30;

const signupSchema = z.object({
  purpose: z.literal("signup"),
  phone: z.string().min(9).max(20),
  role: z.enum(["student", "teacher"]).default("student"),
  phoneOwner: z.enum(["self", "guardian"]).optional(),
  signupSessionId: z.string().uuid().optional(),
  username: z.string().trim().min(3).max(20).optional()
});

const resetSchema = z.object({
  purpose: z.literal("password-reset"),
  role: z.enum(["student", "teacher"]).default("student"),
  phone: z.string().min(9).max(20).optional(),
  username: z.string().trim().min(3).max(20).optional()
});

export async function POST(request: Request) {
  try {
    const raw = await request.json() as { purpose?: string };
    if (raw.purpose === "password-reset") {
      return await handlePasswordResetOtp(resetSchema.parse(raw), request);
    }
    return await handleSignupOtp(signupSchema.parse(raw), request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send the code.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function handleSignupOtp(input: z.infer<typeof signupSchema>, request: Request) {
  const phone = normalizeGhanaPhone(input.phone);
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowOtpRequest(`${forwardedFor}:${phone}`)) {
    await recordOperationalEvent({
      category: "abuse", eventType: "rate_limit.otp", outcome: "blocked", severity: "medium",
      route: "/api/auth/otp/send", subject: phone, ip: requestIp(request)
    });
    return NextResponse.json({ error: "Too many codes requested. Please wait 10 minutes." }, { status: 429 });
  }

  if (input.role === "teacher") {
    const [, existingTeacher] = await Promise.all([
      assertTeacherPhoneNotBanned(phone),
      findTeacherByPhone(phone)
    ]);
    if (existingTeacher) {
      return NextResponse.json({
        error: "This phone number already has a teacher account.",
        code: "ACCOUNT_EXISTS",
        actions: ["login", "password-reset"]
      }, { status: 409 });
    }
  } else {
    try {
      await assertStudentPhoneAvailable(phone, input.phoneOwner ?? "self");
    } catch (error) {
      return NextResponse.json({
        error: error instanceof Error ? error.message : "This phone number cannot be used.",
        code: "ACCOUNT_EXISTS",
        actions: ["login", "password-reset"]
      }, { status: 409 });
    }
  }

  const delivery = await sendOtp(
    phone,
    input.role === "teacher" ? "teacher-signup" : "learner-signup",
    platformActionUrl(request, input.role === "teacher" ? "/signup/teacher" : "/signup/student"),
    input.signupSessionId
  );
  if (input.signupSessionId) {
    await updateSignupFunnel({
      sessionId: input.signupSessionId,
      role: input.role,
      step: 5,
      usernamePrefix: input.username?.slice(0, 6),
      event: "otp_requested"
    }).catch((error) => console.error("Signup funnel OTP event failed:", error));
  }
  return NextResponse.json({ ok: true, shortcode: delivery.shortcode });
}

async function handlePasswordResetOtp(input: z.infer<typeof resetSchema>, request: Request) {
  if (input.role === "student") {
    if (!input.username) {
      return NextResponse.json({ error: "Enter your username to reset your password." }, { status: 400 });
    }
    const user = await findSupabaseUserByUsername(input.username);
    if (!user) {
      return NextResponse.json({
        error: "We could not find a learner account with that username.",
        code: "ACCOUNT_NOT_FOUND",
        actions: ["signup"]
      }, { status: 404 });
    }
    const phoneRaw = user.user_metadata?.phone_e164 ?? user.user_metadata?.phone;
    if (typeof phoneRaw !== "string") {
      return NextResponse.json({ error: "This account has no recovery phone number." }, { status: 400 });
    }
    const phone = normalizeGhanaPhone(phoneRaw);
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!allowOtpRequest(`${forwardedFor}:${phone}`)) {
      await recordOperationalEvent({
        category: "abuse", eventType: "rate_limit.otp", outcome: "blocked", severity: "medium",
        route: "/api/auth/otp/send", subject: phone, ip: requestIp(request)
      });
      return NextResponse.json({ error: "Too many codes requested. Please wait 10 minutes." }, { status: 429 });
    }
    const delivery = await sendOtp(phone, "learner-password-reset", platformActionUrl(request, "/forgot-password"));
    return NextResponse.json({
      ok: true,
      phoneHint: maskPhone(phone),
      shortcode: delivery.shortcode
    });
  }

  if (!input.phone) {
    return NextResponse.json({ error: "Enter your phone number to reset your password." }, { status: 400 });
  }
  const phone = normalizeGhanaPhone(input.phone);
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowOtpRequest(`${forwardedFor}:${phone}`)) {
    await recordOperationalEvent({
      category: "abuse", eventType: "rate_limit.otp", outcome: "blocked", severity: "medium",
      route: "/api/auth/otp/send", subject: phone, ip: requestIp(request)
    });
    return NextResponse.json({ error: "Too many codes requested. Please wait 10 minutes." }, { status: 429 });
  }
  const existingTeacher = await findTeacherByPhone(phone);
  if (!existingTeacher) {
    return NextResponse.json({
      error: "We could not find a teacher account registered with this phone number.",
      code: "ACCOUNT_NOT_FOUND",
      actions: ["signup"]
    }, { status: 404 });
  }
  const delivery = await sendOtp(phone, "teacher-password-reset", platformActionUrl(request, "/forgot-password/teacher"));
  return NextResponse.json({ ok: true, shortcode: delivery.shortcode });
}

function maskPhone(phone: string) {
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 6)}****${phone.slice(-2)}`;
}
