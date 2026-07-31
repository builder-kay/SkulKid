import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/classes/classroom-server";
import { buildFeedbackAnalytics, type FeedbackRow } from "@/lib/research/feedback-analytics";
import { FORMS, allQuestions, isFormType, type FormType } from "@/lib/research/questionnaire";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "xlsx";
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
    const analytics = buildFeedbackAnalytics(rows, { formType: formType as FormType | "all", from, to });

    const scoped = formType === "all" ? rows : rows.filter((row) => row.formType === formType);

    if (format === "csv") {
      const lines = [
        ["id", "formType", "createdAt", "instrumentVersion", "answers_json"].join(","),
        ...scoped.map((row) =>
          [row.id, row.formType, row.createdAt, row.instrumentVersion, JSON.stringify(row.answers).replaceAll('"', '""')]
            .map((cell) => `"${cell}"`)
            .join(",")
        )
      ];
      return new NextResponse(lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="skulkid-research-feedback.csv"`
        }
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SkulKid";
    workbook.created = new Date();

    const summary = workbook.addWorksheet("Summary");
    summary.addRow(["Metric", "Value"]);
    summary.addRow(["Total responses", analytics.totals.all]);
    summary.addRow(["Filtered responses", analytics.totals.filtered]);
    summary.addRow(["Last 7 days", analytics.totals.last7Days]);
    summary.addRow(["Student", analytics.totals.byForm.student]);
    summary.addRow(["Teacher", analytics.totals.byForm.teacher]);
    summary.addRow(["System", analytics.totals.byForm.system]);
    summary.addRow([]);
    summary.addRow(["Student section", "Mean", "n"]);
    for (const section of analytics.studentLikert.sections) {
      summary.addRow([section.title, section.mean?.toFixed(2) ?? "—", section.n]);
    }
    summary.addRow([]);
    summary.addRow(["Teacher section", "Mean", "n"]);
    for (const section of analytics.teacherLikert.sections) {
      summary.addRow([section.title, section.mean?.toFixed(2) ?? "—", section.n]);
    }

    for (const type of ["student", "teacher", "system"] as const) {
      const sheet = workbook.addWorksheet(type === "student" ? "Student raw" : type === "teacher" ? "Teacher raw" : "System raw");
      const subset = rows.filter((row) => row.formType === type);
      const questionIds = allQuestions(FORMS[type]).flatMap((q) => {
        if (q.kind === "metric") return [`${q.id}_observed`, `${q.id}_met`];
        if (q.kind === "uat") return [`${q.id}_completed`, `${q.id}_time`, `${q.id}_issues`];
        if (q.kind === "triad") return [q.id, q.noteId ?? `${q.id}_notes`];
        return [q.id];
      });
      const uniqueIds = [...new Set(questionIds)];
      sheet.addRow(["id", "createdAt", "instrumentVersion", ...uniqueIds]);
      for (const row of subset) {
        sheet.addRow([
          row.id,
          row.createdAt,
          row.instrumentVersion,
          ...uniqueIds.map((id) => {
            const value = row.answers[id];
            return value == null ? "" : String(value);
          })
        ]);
      }
    }

    const means = workbook.addWorksheet("Item means");
    means.addRow(["form", "questionId", "number", "prompt", "n", "mean", "sd"]);
    for (const item of analytics.studentLikert.items) {
      means.addRow(["student", item.id, item.number, item.prompt, item.n, item.mean?.toFixed(3) ?? "", item.sd?.toFixed(3) ?? ""]);
    }
    for (const item of analytics.teacherLikert.items) {
      means.addRow(["teacher", item.id, item.number, item.prompt, item.n, item.mean?.toFixed(3) ?? "", item.sd?.toFixed(3) ?? ""]);
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="skulkid-research-feedback.xlsx"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export research feedback.";
    return NextResponse.json({ error: message }, { status: message.includes("Administrator") ? 403 : 400 });
  }
}
