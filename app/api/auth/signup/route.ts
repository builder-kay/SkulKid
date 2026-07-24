import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/clifze";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { findSupabaseUserByPhone, phoneIdentityEmail } from "@/lib/auth/supabase-phone-user";

const studentSchema = z.object({
  role: z.literal("student").default("student"),
  phone: z.string().min(9).max(20),
  otp: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(2).max(50),
  gender: z.enum(["male", "female"]),
  age: z.number().int().min(5).max(18),
  grade: z.number().int().min(1).max(6)
});

const teacherSchema = z.object({
  role: z.literal("teacher"),
  phone: z.string().min(9).max(20),
  otp: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(2).max(50),
  school: z.string().trim().min(2).max(100),
  subjectsTaught: z.string().trim().min(2).max(80)
});

export async function POST(request: Request) {
  try {
    const raw = await request.json() as { role?: string };
    const input = raw.role === "teacher" ? teacherSchema.parse(raw) : studentSchema.parse(raw);
    const phone = normalizeGhanaPhone(input.phone);
    await verifyOtp(phone, input.otp);
    if (await findSupabaseUserByPhone(phone)) {
      throw new Error("An account already exists for this phone number. Please sign in or reset the password.");
    }

    const isTeacher = input.role === "teacher";
    const admin = createAdminClient();
    let userMetadata: Record<string, string | number>;
    if (input.role === "teacher") {
      userMetadata = {
        display_name: input.displayName,
        school: input.school,
        subjects_taught: input.subjectsTaught,
        phone_e164: phone,
        account_type: "teacher"
      };
    } else {
      userMetadata = {
        display_name: input.displayName,
        gender: input.gender,
        age: input.age,
        grade: input.grade,
        phone_e164: phone,
        account_type: "student"
      };
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: phoneIdentityEmail(phone),
      password: input.password,
      email_confirm: true,
      user_metadata: userMetadata,
      app_metadata: { role: isTeacher ? "teacher" : "student" }
    });
    if (error || !data.user) throw new Error(error?.message || "Unable to create the account.");

    const supabase = await createServerSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: phoneIdentityEmail(phone),
      password: input.password
    });

    if (signInError) {
      return NextResponse.json({
        ok: true,
        role: isTeacher ? "teacher" : "student",
        requiresSignIn: true,
        message: isTeacher
          ? "Your teacher account is ready! Please sign in to open your workspace."
          : "Your account is ready! Please sign in to start learning."
      }, { status: 201 });
    }

    return NextResponse.json({ ok: true, role: isTeacher ? "teacher" : "student" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
