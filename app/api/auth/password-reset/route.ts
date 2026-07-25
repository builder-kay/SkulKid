import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/clifze";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import {
  ensureUsernameLoginIdentity,
  findSupabaseUserByUsername,
  normalizeUsername
} from "@/lib/auth/student-identity";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensurePhoneLoginIdentity, findSupabaseUserByPhone } from "@/lib/auth/supabase-phone-user";

const studentSchema = z.object({
  role: z.literal("student").default("student"),
  username: z.string().trim().min(3).max(20),
  otp: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(72)
});

const teacherSchema = z.object({
  role: z.literal("teacher"),
  phone: z.string().min(9).max(20),
  otp: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(72)
});

const legacySchema = z.object({
  phone: z.string().min(9).max(20),
  otp: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(72)
});

export async function POST(request: Request) {
  try {
    const raw = await request.json() as { role?: string; username?: string; phone?: string };
    const admin = createAdminClient();

    if (raw.username || raw.role === "student") {
      const input = studentSchema.parse({ ...raw, role: "student" });
      const username = normalizeUsername(input.username);
      const existing = await findSupabaseUserByUsername(username);
      if (!existing) throw new Error("No learner account was found for that username.");
      const phoneRaw = existing.user_metadata?.phone_e164 ?? existing.user_metadata?.phone;
      if (typeof phoneRaw !== "string") throw new Error("This account has no recovery phone number.");
      const phone = normalizeGhanaPhone(phoneRaw);
      await verifyOtp(phone, input.otp);
      const migrated = await ensureUsernameLoginIdentity(existing, username);
      const { error } = await admin.auth.admin.updateUserById(migrated.id, { password: input.password });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    const input = raw.role === "teacher" ? teacherSchema.parse(raw) : legacySchema.parse(raw);
    const phone = normalizeGhanaPhone(input.phone);
    await verifyOtp(phone, input.otp);
    const existing = await findSupabaseUserByPhone(phone);
    if (!existing) throw new Error("No account was found for this phone number.");
    const migrated = await ensurePhoneLoginIdentity(existing, phone);
    const { error } = await admin.auth.admin.updateUserById(migrated.id, { password: input.password });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to reset the password." }, { status: 400 });
  }
}
