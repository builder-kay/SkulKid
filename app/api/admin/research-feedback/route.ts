import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/classes/classroom-server";
import { buildFeedbackAnalytics, type FeedbackRow } from "@/lib/research/feedback-analytics";
import { isFormType, type FormType } from "@/lib/research/questionnaire";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const formParam = url.searchParams.get("formType") ?? "all";
    const formType = formParam === "all" ? "all" : isFormType(formParam) ? formParam : "all";
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("PlatformFeedbackResponse")
      .select("id,formType,instrumentVersion,answers,sectionMeans,meta,createdAt")
      .order("createdAt", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as FeedbackRow[];
    const analytics = buildFeedbackAnalytics(rows, {
      formType: formType as FormType | "all",
      from,
      to
    });

    return NextResponse.json({ analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load research feedback.";
    return NextResponse.json({ error: message }, { status: message.includes("Administrator") ? 403 : 400 });
  }
}
