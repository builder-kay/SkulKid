import { NextResponse } from "next/server";
import { z } from "zod";
import { generateStructuredTextWithGemini, resolveGeminiModel } from "@/domains/curriculum-ai/services/gemini";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { getTeacherClassPerformance } from "@/lib/classes/performance-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({ studentId: z.string().uuid(), range: z.enum(["30d", "90d", "term"]).default("30d"), subjectId: z.string().trim().max(160).optional() });
const draftSchema = z.object({
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(600),
  category: z.enum(["celebration", "practice", "intervention"]),
  priority: z.enum(["low", "normal", "high"]),
  actions: z.array(z.object({ label: z.string().trim().min(2).max(160) })).min(1).max(3)
});
const responseJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    message: { type: "string" },
    category: { type: "string", enum: ["celebration", "practice", "intervention"] },
    priority: { type: "string", enum: ["low", "normal", "high"] },
    actions: { type: "array", minItems: 1, maxItems: 3, items: { type: "object", properties: { label: { type: "string" } }, required: ["label"], additionalProperties: false } }
  },
  required: ["title", "message", "category", "priority", "actions"],
  additionalProperties: false
};

export async function POST(request: Request, context: { params: Promise<{ classId: string }> }) {
  try {
    const teacher = await requireTeacher();
    const { classId } = await context.params;
    const input = requestSchema.parse(await request.json());
    const performance = await getTeacherClassPerformance({ teacherId: teacher.id, classId, range: input.range, metric: "academic", subjectId: input.subjectId });
    const learner = performance.learners.find((item) => item.studentId === input.studentId);
    const detail = performance.details[input.studentId];
    if (!learner || !detail) return NextResponse.json({ error: "Learner not found in this class." }, { status: 404 });
    const evidence = {
      academicAverage: learner.academicAverage,
      trend: learner.trend,
      completionPercent: learner.completionPercent,
      quizzesPassed: learner.quizzesPassed,
      quizzesAttempted: learner.quizzesAttempted,
      activityMinutes: learner.activityMinutes,
      daysSinceActivity: learner.lastActiveAt ? Math.floor((Date.now() - Date.parse(learner.lastActiveAt)) / 86400000) : null,
      strengths: detail.strengths,
      concerns: detail.concerns,
      recentAssessments: detail.attempts.slice(0, 5).map((item) => ({ title: item.title, area: `${item.subject} / ${item.strand}`, score: item.score, passed: item.passed }))
    };
    const fallback = rulesDraft(evidence);
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ draft: fallback, evidence, source: "rules" });
    try {
      const result = await generateStructuredTextWithGemini({
        model: resolveGeminiModel(process.env.GEMINI_PERFORMANCE_MODEL ?? process.env.GEMINI_MODEL),
        schema: responseJsonSchema,
        prompt: `You draft private, constructive feedback for a Ghanaian Basic-school learner.
Use only the anonymised aggregate evidence below. Do not invent facts, diagnose ability, infer attendance, mention rankings, or use a learner name.
Write directly to the learner in warm, clear language. Include one evidenced positive observation, one improvement area, and one to three practical next actions. Avoid shame, pressure and comparisons with classmates.
EVIDENCE:
${JSON.stringify(evidence)}
Return the requested structured feedback.`
      });
      return NextResponse.json({ draft: draftSchema.parse(result.data), evidence, source: "gemini" });
    } catch {
      return NextResponse.json({ draft: fallback, evidence, source: "rules" });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to draft a recommendation." }, { status: 400 });
  }
}

function rulesDraft(evidence: {
  academicAverage: number | null;
  trend: number | null;
  completionPercent: number | null;
  concerns: string[];
  strengths: string[];
}) {
  const improving = evidence.trend !== null && evidence.trend >= 5;
  const needsSupport = evidence.academicAverage !== null && evidence.academicAverage < 70;
  return {
    title: improving ? "Your progress is growing" : needsSupport ? "Your next practice step" : "Keep building your progress",
    message: `${evidence.strengths[0] || (improving ? "Your recent results show improvement." : "You have started building useful learning evidence.")} ${evidence.concerns[0] || "Keep practising consistently so your teacher can see your progress clearly."}`,
    category: needsSupport ? "practice" as const : "celebration" as const,
    priority: needsSupport ? "normal" as const : "low" as const,
    actions: [
      { label: needsSupport ? "Review the most recent lesson and retry its practice questions." : "Continue with the next assigned lesson." },
      { label: "Ask your teacher about any step that is unclear." }
    ]
  };
}
