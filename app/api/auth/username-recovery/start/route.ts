import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/auth/clifze";
import { normalizeGhanaPhone } from "@/lib/auth/phone";
import { allowOtpRequest, allowUsernameRecoveryLookup } from "@/lib/auth/rate-limit";
import { listStudentsByPhone } from "@/lib/auth/student-identity";
import {
  matchStudentAgeAndGrade,
  matchStudentName,
  normalizeLearnerName
} from "@/lib/auth/username-recovery-matching";
import {
  createRecoveryAttempt,
  getRecoveryAttempt,
  updateRecoveryAttempt
} from "@/lib/auth/username-recovery";

const phoneSchema = z.object({
  action: z.literal("phone"),
  phone: z.string().min(9).max(20)
});
const identitySchema = z.object({
  action: z.literal("identity"),
  attemptId: z.string().uuid(),
  age: z.number().int().min(5).max(18),
  grade: z.number().int().min(1).max(6)
});
const nameSchema = z.object({
  action: z.literal("name"),
  attemptId: z.string().uuid(),
  learnerName: z.string().trim().min(2).max(50)
});
const schema = z.discriminatedUnion("action", [phoneSchema, identitySchema, nameSchema]);

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const requester = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

    if (input.action === "phone") {
      const phone = normalizeGhanaPhone(input.phone);
      if (!allowUsernameRecoveryLookup(`${requester}:${phone}`)) {
        return NextResponse.json({ error: "Too many recovery attempts. Please wait 10 minutes." }, { status: 429 });
      }
      const students = await listStudentsByPhone(phone);
      if (students.length === 0) {
        return NextResponse.json({
          error: "No learner account was found with this phone number.",
          code: "ACCOUNT_NOT_FOUND"
        }, { status: 404 });
      }
      if (students.length === 1) {
        const attempt = await createRecoveryAttempt({
          phone,
          stage: "otp",
          selectedUserId: students[0].id
        });
        await sendRecoveryOtp(phone, requester);
        return NextResponse.json({ ok: true, attemptId: attempt.id, nextStep: "otp" });
      }
      const attempt = await createRecoveryAttempt({ phone, stage: "identity" });
      return NextResponse.json({ ok: true, attemptId: attempt.id, nextStep: "identity" });
    }

    const attempt = await getRecoveryAttempt(input.attemptId);
    if (!allowUsernameRecoveryLookup(`${requester}:${attempt.phone}`)) {
      return NextResponse.json({ error: "Too many recovery attempts. Please wait 10 minutes." }, { status: 429 });
    }
    if (attempt.identityAttempts >= 5) {
      return NextResponse.json({ error: "Too many incorrect details. Please start again later." }, { status: 429 });
    }
    const students = await listStudentsByPhone(attempt.phone);

    if (input.action === "identity") {
      if (attempt.stage !== "identity") throw new Error("Please restart username recovery.");
      const matches = matchStudentAgeAndGrade(students, input.age, input.grade);
      if (matches.length === 0) {
        await updateRecoveryAttempt(attempt.id, { identityAttempts: attempt.identityAttempts + 1 });
        return NextResponse.json({
          error: "Those details do not match a learner registered with this phone number."
        }, { status: 400 });
      }
      if (matches.length > 1) {
        await updateRecoveryAttempt(attempt.id, {
          stage: "name",
          age: input.age,
          grade: input.grade,
          identityAttempts: attempt.identityAttempts + 1
        });
        return NextResponse.json({ ok: true, attemptId: attempt.id, nextStep: "name" });
      }
      await updateRecoveryAttempt(attempt.id, {
        stage: "otp",
        selectedUserId: matches[0].id,
        age: input.age,
        grade: input.grade,
        identityAttempts: attempt.identityAttempts + 1
      });
      await sendRecoveryOtp(attempt.phone, requester);
      return NextResponse.json({ ok: true, attemptId: attempt.id, nextStep: "otp" });
    }

    if (attempt.stage !== "name" || attempt.age == null || attempt.grade == null) {
      throw new Error("Please restart username recovery.");
    }
    const narrowed = matchStudentAgeAndGrade(students, attempt.age, attempt.grade);
    const matches = matchStudentName(narrowed, input.learnerName);
    if (matches.length === 0) {
      await updateRecoveryAttempt(attempt.id, { identityAttempts: attempt.identityAttempts + 1 });
      return NextResponse.json({
        error: "That name does not match a learner with the age and Primary level provided."
      }, { status: 400 });
    }
    if (matches.length > 1) {
      await updateRecoveryAttempt(attempt.id, {
        identityAttempts: attempt.identityAttempts + 1,
        learnerName: normalizeLearnerName(input.learnerName)
      });
      return NextResponse.json({
        error: "We could not identify one learner account. Please contact support@skulkid.app.",
        code: "SUPPORT_REQUIRED"
      }, { status: 409 });
    }
    await updateRecoveryAttempt(attempt.id, {
      stage: "otp",
      selectedUserId: matches[0].id,
      learnerName: normalizeLearnerName(input.learnerName),
      identityAttempts: attempt.identityAttempts + 1
    });
    await sendRecoveryOtp(attempt.phone, requester);
    return NextResponse.json({ ok: true, attemptId: attempt.id, nextStep: "otp" });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to start username recovery."
    }, { status: 400 });
  }
}

async function sendRecoveryOtp(phone: string, requester: string) {
  if (!allowOtpRequest(`username-recovery:${requester}:${phone}`)) {
    throw new Error("Too many codes requested. Please wait 10 minutes.");
  }
  await sendOtp(phone, "username-recovery");
}
