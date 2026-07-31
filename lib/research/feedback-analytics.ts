import {
  FORMS,
  LIKERT_FULL_LABELS,
  type FormType,
  getForm,
  allQuestions
} from "@/lib/research/questionnaire";

export type FeedbackRow = {
  id: string;
  formType: FormType;
  instrumentVersion: string;
  answers: Record<string, unknown>;
  sectionMeans: Record<string, number | null>;
  meta: Record<string, unknown>;
  createdAt: string;
};

function mean(values: number[]) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sd(values: number[]) {
  if (values.length < 2) return null;
  const m = mean(values)!;
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function countBy(rows: FeedbackRow[], key: string) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const raw = row.answers[key];
    if (raw == null || raw === "") continue;
    const label = String(raw);
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

function labelChoice(formType: FormType, questionId: string, value: string) {
  const question = allQuestions(getForm(formType)).find((q) => q.id === questionId);
  return question?.options?.find((opt) => opt.value === value)?.label ?? value;
}

export function buildFeedbackAnalytics(rows: FeedbackRow[], filters: { formType?: FormType | "all"; from?: string; to?: string }) {
  let filtered = rows;
  if (filters.formType && filters.formType !== "all") {
    filtered = filtered.filter((row) => row.formType === filters.formType);
  }
  if (filters.from) {
    const from = Date.parse(filters.from);
    if (Number.isFinite(from)) filtered = filtered.filter((row) => Date.parse(row.createdAt) >= from);
  }
  if (filters.to) {
    const to = Date.parse(filters.to);
    if (Number.isFinite(to)) filtered = filtered.filter((row) => Date.parse(row.createdAt) <= to + 86_400_000 - 1);
  }

  const byForm = {
    student: rows.filter((r) => r.formType === "student").length,
    teacher: rows.filter((r) => r.formType === "teacher").length
  };

  const last7 = (() => {
    const start = Date.now() - 7 * 86_400_000;
    return rows.filter((r) => Date.parse(r.createdAt) >= start).length;
  })();

  const trendMap = new Map<string, { student: number; teacher: number }>();
  for (const row of filtered) {
    const day = row.createdAt.slice(0, 10);
    const bucket = trendMap.get(day) ?? { student: 0, teacher: 0 };
    bucket[row.formType] += 1;
    trendMap.set(day, bucket);
  }
  const trend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  const formType = filters.formType && filters.formType !== "all" ? filters.formType : null;
  const focusRows = formType ? filtered.filter((r) => r.formType === formType) : filtered;

  const studentRows = filtered.filter((r) => r.formType === "student");
  const teacherRows = filtered.filter((r) => r.formType === "teacher");

  const demographics = {
    student: {
      class: countBy(studentRows, "s_q1").map((item) => ({ label: labelChoice("student", "s_q1", item.value), value: item.count })),
      gender: countBy(studentRows, "s_q2").map((item) => ({ label: labelChoice("student", "s_q2", item.value), value: item.count })),
      deviceUse: countBy(studentRows, "s_q3").map((item) => ({ label: labelChoice("student", "s_q3", item.value), value: item.count })),
      priorPlatform: countBy(studentRows, "s_q4").map((item) => ({ label: labelChoice("student", "s_q4", item.value), value: item.count }))
    },
    teacher: {
      level: countBy(teacherRows, "t_q1").map((item) => ({ label: labelChoice("teacher", "t_q1", item.value), value: item.count })),
      experience: countBy(teacherRows, "t_q2").map((item) => ({ label: labelChoice("teacher", "t_q2", item.value), value: item.count })),
      techComfort: countBy(teacherRows, "t_q3").map((item) => ({ label: labelChoice("teacher", "t_q3", item.value), value: item.count }))
    }
  };

  function likertStats(target: FormType) {
    const form = getForm(target);
    const subset = filtered.filter((r) => r.formType === target);
    const items = allQuestions(form)
      .filter((q) => q.kind === "likert")
      .map((q) => {
        const values = subset
          .map((row) => Number(row.answers[q.id]))
          .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);
        const distribution = [1, 2, 3, 4, 5].map((score) => ({
          score,
          label: LIKERT_FULL_LABELS[String(score)],
          count: values.filter((v) => v === score).length
        }));
        return {
          id: q.id,
          number: q.number,
          prompt: q.prompt,
          sectionId: form.sections.find((s) => s.questions.some((item) => item.id === q.id))?.id ?? "",
          n: values.length,
          mean: mean(values),
          sd: sd(values),
          distribution
        };
      });

    const sections = form.sections
      .filter((section) => section.questions.some((q) => q.kind === "likert"))
      .map((section) => {
        const values = subset
          .map((row) => Number(row.sectionMeans?.[section.id]))
          .filter((n) => Number.isFinite(n));
        return {
          id: section.id,
          title: section.title,
          n: values.length,
          mean: mean(values),
          sd: sd(values)
        };
      });

    const ranked = [...items].filter((item) => item.mean != null).sort((a, b) => (b.mean ?? 0) - (a.mean ?? 0));
    return {
      items,
      sections,
      top: ranked.slice(0, 5),
      bottom: ranked.slice(-5).reverse()
    };
  }

  const openEnded: Array<{
    id: string;
    responseId: string;
    formType: "student" | "teacher";
    questionId: string;
    number: number | string;
    prompt: string;
    text: string;
    createdAt: string;
  }> = [];
  for (const type of ["student", "teacher"] as const) {
    const form = getForm(type);
    const textQs = allQuestions(form).filter((q) => q.kind === "text");
    for (const row of filtered.filter((item) => item.formType === type)) {
      for (const q of textQs) {
        const text = String(row.answers[q.id] ?? "").trim();
        if (!text) continue;
        openEnded.push({
          id: `${row.id}:${q.id}`,
          responseId: row.id,
          formType: type,
          questionId: q.id,
          number: q.number,
          prompt: q.prompt,
          text,
          createdAt: row.createdAt
        });
      }
    }
  }

  const crossBreaks = (() => {
    if (studentRows.length < 5) return null;
    const byClass = new Map<string, number[]>();
    for (const row of studentRows) {
      const klass = String(row.answers.s_q1 ?? "");
      if (!klass) continue;
      const overall = mean(
        allQuestions(FORMS.student)
          .filter((q) => q.kind === "likert")
          .map((q) => Number(row.answers[q.id]))
          .filter((n) => Number.isFinite(n))
      );
      if (overall == null) continue;
      const list = byClass.get(klass) ?? [];
      list.push(overall);
      byClass.set(klass, list);
    }
    return {
      studentOverallByClass: [...byClass.entries()].map(([value, values]) => ({
        label: labelChoice("student", "s_q1", value),
        n: values.length,
        mean: mean(values)
      }))
    };
  })();

  return {
    totals: {
      all: rows.length,
      filtered: filtered.length,
      last7Days: last7,
      byForm
    },
    trend,
    demographics,
    studentLikert: likertStats("student"),
    teacherLikert: likertStats("teacher"),
    openEnded,
    crossBreaks,
    focusForm: formType,
    focusCount: focusRows.length
  };
}
