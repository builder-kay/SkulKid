import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/auth/clifze";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { allowOtpRequest } from "@/lib/auth/rate-limit";
import { findSupabaseUserByPhone } from "@/lib/auth/supabase-phone-user";

const inputSchema = z.object({
  phone: z.string().min(9).max(20),
  purpose: z.enum(["signup", "password-reset"])
});

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    const phone = normalizeGhanaPhone(input.phone);
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!allowOtpRequest(`${forwardedFor}:${phone}`)) {
      return NextResponse.json({ error: "Too many codes requested. Please wait 10 minutes." }, { status: 429 });
    }
    const existingUser = await findSupabaseUserByPhone(phone);
    if (input.purpose === "signup" && existingUser) {
      return NextResponse.json({
        error: "This phone number already has a SkulKid account.",
        code: "ACCOUNT_EXISTS",
        actions: ["login", "password-reset"]
      }, { status: 409 });
    }
    if (input.purpose === "password-reset" && !existingUser) {
      return NextResponse.json({
        error: "We could not find a SkulKid account registered with this phone number.",
        code: "ACCOUNT_NOT_FOUND",
        actions: ["signup"]
      }, { status: 404 });
    }
    await sendOtp(phone, input.purpose);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send the code.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
