import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/clifze";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import {
  assertStudentPhoneAvailable,
  findSupabaseUserByUsername,
  normalizeUsername,
  usernameIdentityEmail
} from "@/lib/auth/student-identity";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { findSupabaseUserByPhone, phoneIdentityEmail } from "@/lib/auth/supabase-phone-user";
import { isUsernameConflictError } from "@/lib/auth/username";
import { assertTeacherPhoneNotBanned } from "@/lib/moderation/teacher-phone-ban";
import { withTimeout } from "@/lib/server/with-timeout";

export const runtime = "nodejs";
export const maxDuration = 30;

const studentSchema = z.object({
  role: z.literal("student").default("student"),
  phone: z.string().min(9).max(20),
  phoneOwner: z.enum(["self", "guardian"]).default("self"),
  username: z.string().trim().min(3).max(20),
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
    const username = input.role === "student" ? normalizeUsername(input.username) : null;

    if (username && await findSupabaseUserByUsername(username)) {
      return NextResponse.json({
        error: "That username is already taken. Please choose a different username.",
        code: "USERNAME_TAKEN"
      }, { status: 409 });
    }

    await verifyOtp(phone, input.otp);

    const admin = createAdminClient();

    if (input.role === "teacher") {
      const [, existingTeacher] = await Promise.all([
        assertTeacherPhoneNotBanned(phone),
        findSupabaseUserByPhone(phone)
      ]);
      if (existingTeacher) {
        throw new Error("An account already exists for this phone number. Please sign in or reset the password.");
      }
      const { data, error } = await withTimeout(
        admin.auth.admin.createUser({
          email: phoneIdentityEmail(phone),
          password: input.password,
          email_confirm: true,
          user_metadata: {
            display_name: input.displayName,
            school: input.school,
            subjects_taught: input.subjectsTaught,
            phone_e164: phone,
            account_type: "teacher"
          },
          app_metadata: { role: "teacher" }
        }),
        8_000,
        "Account creation took too long. Please try again."
      );
      if (error || !data.user) throw new Error(error?.message || "Unable to create the account.");
      const { error: trustError } = await withTimeout(
        admin.from("TeacherTrustProfile").upsert({
          teacherId: data.user.id,
          status: "probation",
          cleanLessonCount: 0,
          requiredCleanLessons: 10,
          monitoringRemaining: 0
        }, { onConflict: "teacherId" }),
        6_000,
        "Teacher account setup took too long. Please try again."
      );
      if (trustError) {
        console.error("Teacher trust profile creation failed:", trustError.message);
        await withTimeout(
          admin.auth.admin.deleteUser(data.user.id),
          4_000,
          "Teacher account cleanup took too long."
        ).catch((cleanupError) => {
          console.error(
            "Incomplete teacher account cleanup failed:",
            cleanupError instanceof Error ? cleanupError.message : "Unknown cleanup error"
          );
        });
        throw new Error("Unable to finish creating the teacher account. Please try again.");
      }

      const supabase = await createServerSupabaseClient();
      const signInResult = await withTimeout(
        supabase.auth.signInWithPassword({
          email: phoneIdentityEmail(phone),
          password: input.password
        }),
        6_000,
        "Automatic sign-in took too long."
      ).catch((signInFailure) => ({
        error: signInFailure instanceof Error ? signInFailure : new Error("Automatic sign-in failed.")
      }));
      const signInError = signInResult.error;
      if (signInError) {
        return NextResponse.json({
          ok: true,
          role: "teacher",
          requiresSignIn: true,
          message: "Your teacher account is ready! Please sign in to open your workspace."
        }, { status: 201 });
      }
      return NextResponse.json({ ok: true, role: "teacher" });
    }

    if (!username) throw new Error("A username is required.");
    if (await findSupabaseUserByUsername(username)) {
      return NextResponse.json({
        error: "That username is already taken. Please choose a different username.",
        code: "USERNAME_TAKEN"
      }, { status: 409 });
    }
    await assertStudentPhoneAvailable(phone, input.phoneOwner);

    const { data, error } = await admin.auth.admin.createUser({
      email: usernameIdentityEmail(username),
      password: input.password,
      email_confirm: true,
      user_metadata: {
        display_name: input.displayName,
        gender: input.gender,
        age: input.age,
        grade: input.grade,
        username,
        phone_e164: phone,
        phone_owner: input.phoneOwner,
        account_type: "student"
      },
      app_metadata: { role: "student" }
    });
    if (error && isUsernameConflictError(error)) {
      return NextResponse.json({
        error: "That username is already taken. Please choose a different username.",
        code: "USERNAME_TAKEN"
      }, { status: 409 });
    }
    if (error || !data.user) throw new Error(error?.message || "Unable to create the account.");

    const supabase = await createServerSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameIdentityEmail(username),
      password: input.password
    });

    if (signInError) {
      return NextResponse.json({
        ok: true,
        role: "student",
        username,
        requiresSignIn: true,
        message: `Your account is ready! Sign in with username “${username}”.`
      }, { status: 201 });
    }

    return NextResponse.json({ ok: true, role: "student", username });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
