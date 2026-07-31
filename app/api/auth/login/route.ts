import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { resolveAppRole } from "@/lib/auth/roles";
import {
  ensureUsernameLoginIdentity,
  findSupabaseUserByUsername,
  findTeacherByPhone,
  normalizeUsername,
  usernameIdentityEmail
} from "@/lib/auth/student-identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensurePhoneLoginIdentity, phoneIdentityEmail } from "@/lib/auth/supabase-phone-user";
import {
  evaluateFailedLoginAlert,
  recordOperationalEvent,
  requestIp
} from "@/lib/admin/operational-events";

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
  const startedAt = performance.now();
  let loginSubject = "";
  let requestedRole = "student";
  try {
    const raw = await request.json() as { role?: string; username?: string; phone?: string };
    requestedRole = raw.role || (raw.phone ? "teacher" : "student");
    loginSubject = raw.username || raw.phone || "";
    const supabase = await createServerSupabaseClient();

    if (raw.role === "teacher" || (raw.phone && !raw.username && raw.role !== "student")) {
      const input = raw.role === "teacher" ? teacherSchema.parse(raw) : legacyPhoneSchema.parse(raw);
      const phone = normalizeGhanaPhone(input.phone);
      let result = await supabase.auth.signInWithPassword({ email: phoneIdentityEmail(phone), password: input.password });
      if (result.error) {
        const existing = await findTeacherByPhone(phone);
        if (existing) {
          await ensurePhoneLoginIdentity(existing, phone);
          result = await supabase.auth.signInWithPassword({ email: phoneIdentityEmail(phone), password: input.password });
        }
      }
      if (result.error) {
        const existing = await findTeacherByPhone(phone);
        const suspended = Boolean(existing?.banned_until && Date.parse(existing.banned_until) > Date.now());
        await recordOperationalEvent({
          category: "authentication",
          eventType: suspended ? "login.suspended_attempt" : "login.failed",
          outcome: suspended ? "blocked" : "failure",
          severity: suspended ? "high" : "medium",
          route: "/api/auth/login",
          subject: loginSubject,
          ip: requestIp(request),
          durationMs: performance.now() - startedAt,
          metadata: { requestedRole }
        });
        void evaluateFailedLoginAlert();
        console.error("Supabase sign-in failed:", result.error.message);
        throw new Error("Phone number or password is incorrect.");
      }
      const role = resolveAppRole(result.data.user.app_metadata.role);
      await recordOperationalEvent({
        category: "authentication", eventType: "login.succeeded", outcome: "success",
        route: "/api/auth/login", subject: result.data.user.id, ip: requestIp(request),
        durationMs: performance.now() - startedAt, metadata: { role }
      });
      return NextResponse.json({ ok: true, role });
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
      const existing = await findSupabaseUserByUsername(username);
      const suspended = Boolean(existing?.banned_until && Date.parse(existing.banned_until) > Date.now());
      await recordOperationalEvent({
        category: "authentication",
        eventType: suspended ? "login.suspended_attempt" : "login.failed",
        outcome: suspended ? "blocked" : "failure",
        severity: suspended ? "high" : "medium",
        route: "/api/auth/login",
        subject: loginSubject,
        ip: requestIp(request),
        durationMs: performance.now() - startedAt,
        metadata: { requestedRole }
      });
      void evaluateFailedLoginAlert();
      console.error("Supabase student sign-in failed:", result.error.message);
      throw new Error("Username or password is incorrect.");
    }
    const role = resolveAppRole(result.data.user.app_metadata.role);
    await recordOperationalEvent({
      category: "authentication", eventType: "login.succeeded", outcome: "success",
      route: "/api/auth/login", subject: result.data.user.id, ip: requestIp(request),
      durationMs: performance.now() - startedAt, metadata: { role }
    });
    return NextResponse.json({ ok: true, role });
  } catch (error) {
    if (!(error instanceof Error && /incorrect/.test(error.message))) {
      await recordOperationalEvent({
        category: "application", eventType: "api.error", outcome: "failure", severity: "medium",
        route: "/api/auth/login", subject: loginSubject, ip: requestIp(request),
        durationMs: performance.now() - startedAt, metadata: { requestedRole }
      });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sign in." }, { status: 400 });
  }
}
