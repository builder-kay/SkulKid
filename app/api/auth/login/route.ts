import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensurePhoneLoginIdentity, findSupabaseUserByPhone, phoneIdentityEmail } from "@/lib/auth/supabase-phone-user";

const schema = z.object({ phone: z.string().min(9).max(20), password: z.string().min(8).max(72) });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const phone = normalizeGhanaPhone(input.phone);
    const supabase = await createServerSupabaseClient();
    let result = await supabase.auth.signInWithPassword({ email: phoneIdentityEmail(phone), password: input.password });
    if (result.error) {
      const existing = await findSupabaseUserByPhone(phone);
      if (existing) {
        await ensurePhoneLoginIdentity(existing, phone);
        result = await supabase.auth.signInWithPassword({ email: phoneIdentityEmail(phone), password: input.password });
      }
    }
    const { data, error } = result;
    if (error) {
      console.error("Supabase sign-in failed:", error.message);
      throw new Error("Phone number or password is incorrect.");
    }
    return NextResponse.json({ ok: true, role: data.user.app_metadata.role === "admin" ? "admin" : "student" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sign in." }, { status: 400 });
  }
}
