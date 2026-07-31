import { NextResponse } from "next/server";
import { z } from "zod";
import { allowFeedbackSubmit } from "@/lib/auth/rate-limit";
import { requestIp } from "@/lib/admin/operational-events";
import {
  INSTRUMENT_VERSION,
  computeSectionMeans,
  getForm,
  isFormType,
  validateAnswers
} from "@/lib/research/questionnaire";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const bodySchema = z.object({
  formType: z.enum(["student", "teacher"]),
  answers: z.record(z.string(), z.unknown()),
  website: z.string().max(0).optional(),
  meta: z
    .object({
      viewport: z.string().max(40).optional(),
      locale: z.string().max(20).optional()
    })
    .optional()
});

export async function POST(request: Request) {
  try {
    const ip = requestIp(request) || "local";
    if (!allowFeedbackSubmit(`feedback:${ip}`)) {
      return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
    }

    const input = bodySchema.parse(await request.json());
    if (input.website) {
      return NextResponse.json({ ok: true });
    }
    if (!isFormType(input.formType)) {
      return NextResponse.json({ error: "Unknown form." }, { status: 400 });
    }

    const form = getForm(input.formType);
    const validationError = validateAnswers(form, input.answers);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const sectionMeans = computeSectionMeans(form, input.answers);
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("PlatformFeedbackResponse")
      .insert({
        formType: input.formType,
        instrumentVersion: INSTRUMENT_VERSION,
        answers: input.answers,
        sectionMeans,
        meta: {
          userAgent: request.headers.get("user-agent")?.slice(0, 240) ?? null,
          viewport: input.meta?.viewport ?? null,
          locale: input.meta?.locale ?? null
        }
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save your responses.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
