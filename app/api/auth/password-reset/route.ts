import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/clifze";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensurePhoneLoginIdentity, findSupabaseUserByPhone } from "@/lib/auth/supabase-phone-user";

const schema = z.object({
  phone: z.string().min(9).max(20),
  otp: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(72)
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const phone = normalizeGhanaPhone(input.phone);
    await verifyOtp(phone, input.otp);
    const admin = createAdminClient();
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
