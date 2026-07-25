import { NextResponse } from "next/server";
import { z } from "zod";
import { sendSms, verifyOtp } from "@/lib/auth/clifze";
import { listStudentsByPhone, normalizeUsername } from "@/lib/auth/student-identity";
import {
  matchStudentAgeAndGrade,
  matchStudentName,
  type RecoverableStudent
} from "@/lib/auth/username-recovery-matching";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRecoveryAttempt, updateRecoveryAttempt } from "@/lib/auth/username-recovery";

const schema = z.object({
  attemptId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/)
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const attempt = await getRecoveryAttempt(input.attemptId);
    if (attempt.stage !== "otp" || !attempt.selectedUserId) {
      throw new Error("Complete the identity checks before entering a verification code.");
    }
    if (attempt.otpAttempts >= 5) {
      return NextResponse.json({ error: "Too many incorrect codes. Please start again later." }, { status: 429 });
    }
    await updateRecoveryAttempt(attempt.id, { otpAttempts: attempt.otpAttempts + 1 });
    await verifyOtp(attempt.phone, input.otp);

    const students = await listStudentsByPhone(attempt.phone);
    let matches: RecoverableStudent[] = students;
    if (attempt.age != null && attempt.grade != null) {
      matches = matchStudentAgeAndGrade(matches, attempt.age, attempt.grade);
    }
    if (attempt.learnerName) {
      matches = matchStudentName(matches, attempt.learnerName);
    }
    if (matches.length !== 1 || matches[0].id !== attempt.selectedUserId) {
      throw new Error("The learner account details changed. Please start recovery again.");
    }
    const usernameRaw = matches[0].user_metadata?.username;
    if (typeof usernameRaw !== "string") {
      throw new Error("This learner account does not have a recoverable username. Please contact support.");
    }
    const username = normalizeUsername(usernameRaw);

    const admin = createAdminClient();
    const completedAt = new Date().toISOString();
    const { data: claimed, error: claimError } = await admin
      .from("UsernameRecoveryAttempt")
      .update({ stage: "completed", completedAt, updatedAt: completedAt })
      .eq("id", attempt.id)
      .eq("stage", "otp")
      .is("completedAt", null)
      .select("id")
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) throw new Error("This recovery request has already been used.");

    try {
      await sendSms(
        attempt.phone,
        `Your SkulKid username is: ${username}. Use it to sign in. Do not share this message.`
      );
    } catch (error) {
      await admin.from("UsernameRecoveryAttempt")
        .update({ stage: "otp", completedAt: null, updatedAt: new Date().toISOString() })
        .eq("id", attempt.id)
        .eq("completedAt", completedAt);
      throw error;
    }
    return NextResponse.json({
      ok: true,
      message: "Student username sent to the registered number. Please check your SMS."
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const message = rawMessage === "fetch failed"
      ? "We verified your code, but could not send the SMS. Please check your connection and try recovery again."
      : rawMessage || "Unable to verify the recovery code.";
    return NextResponse.json({
      error: message
    }, { status: 400 });
  }
}
