import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/clifze";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { findSupabaseUserByPhone, phoneIdentityEmail } from "@/lib/auth/supabase-phone-user";

const schema = z.object({
  phone: z.string().min(9).max(20),
  otp: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(2).max(50),
  gender: z.enum(["male", "female"]),
  age: z.number().int().min(5).max(18),
  grade: z.number().int().min(1).max(6)
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const phone = normalizeGhanaPhone(input.phone);
    await verifyOtp(phone, input.otp);
    if (await findSupabaseUserByPhone(phone)) throw new Error("An account already exists for this phone number. Please sign in or reset the password.");
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: phoneIdentityEmail(phone),
      password: input.password,
      email_confirm: true,
      user_metadata: { display_name: input.displayName, gender: input.gender, age: input.age, grade: input.grade, phone_e164: phone },
      app_metadata: { role: "student" }
    });
    if (error || !data.user) throw new Error(error?.message || "Unable to create the account.");
    const supabase = await createServerSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: phoneIdentityEmail(phone), password: input.password });
    if (signInError) return NextResponse.json({ ok: true, role: "student", requiresSignIn: true, message: "Your account is ready! Please sign in to start learning." }, { status: 201 });
    return NextResponse.json({ ok: true, role: "student" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
