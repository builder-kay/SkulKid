import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { resolveAppRole } from "@/lib/auth/roles";
import {
  ensureUsernameLoginIdentity,
  findSupabaseUserByUsername,
  normalizeUsername,
  usernameIdentityEmail
} from "@/lib/auth/student-identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensurePhoneLoginIdentity, findSupabaseUserByPhone, phoneIdentityEmail } from "@/lib/auth/supabase-phone-user";

const studentSchema = z.object({
  role: z.literal("student").optional(),
  username: z.string().trim().min(3).max(20),
  password: z.string().min(8).max(72)
});

const teacherSchema = z.object({
  role: z.literal("teacher"),
  phone: z.string().min(9).max(20),
  password: z.string().min(8).max(72)
});

const legacyPhoneSchema = z.object({
  phone: z.string().min(9).max(20),
  password: z.string().min(8).max(72)
});

export async function POST(request: Request) {
  try {
    const raw = await request.json() as { role?: string; username?: string; phone?: string };
    const supabase = await createServerSupabaseClient();

    if (raw.role === "teacher" || (raw.phone && !raw.username && raw.role !== "student")) {
      const input = raw.role === "teacher" ? teacherSchema.parse(raw) : legacyPhoneSchema.parse(raw);
      const phone = normalizeGhanaPhone(input.phone);
      let result = await supabase.auth.signInWithPassword({ email: phoneIdentityEmail(phone), password: input.password });
      if (result.error) {
        const existing = await findSupabaseUserByPhone(phone);
        if (existing) {
          await ensurePhoneLoginIdentity(existing, phone);
          result = await supabase.auth.signInWithPassword({ email: phoneIdentityEmail(phone), password: input.password });
        }
      }
      if (result.error) {
        console.error("Supabase sign-in failed:", result.error.message);
        throw new Error("Phone number or password is incorrect.");
      }
      return NextResponse.json({ ok: true, role: resolveAppRole(result.data.user.app_metadata.role) });
    }

    const input = studentSchema.parse(raw);
    const username = normalizeUsername(input.username);
    let result = await supabase.auth.signInWithPassword({
      email: usernameIdentityEmail(username),
      password: input.password
    });
    if (result.error) {
      const existing = await findSupabaseUserByUsername(username);
      if (existing) {
        await ensureUsernameLoginIdentity(existing, username);
        result = await supabase.auth.signInWithPassword({
          email: usernameIdentityEmail(username),
          password: input.password
        });
      }
    }
    if (result.error) {
      console.error("Supabase student sign-in failed:", result.error.message);
      throw new Error("Username or password is incorrect.");
    }
    return NextResponse.json({ ok: true, role: resolveAppRole(result.data.user.app_metadata.role) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sign in." }, { status: 400 });
  }
}
