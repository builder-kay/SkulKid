import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClassQuizQuestion } from "@/lib/classes/types";
import { markModerationPublished, moderateTeacherContent } from "@/lib/moderation/teacher-content-server";

export type TeacherQuizStatus = "draft" | "ready" | "archived";
export type TeacherQuizSubject = "mathematics" | "english-language" | "science" | "general";
export type TeacherQuizInput = {
  title: string; description?: string; subject: TeacherQuizSubject; gradeLevels: number[];
  questions: ClassQuizQuestion[]; baseXpReward: number; passingScore: number;
  maxAttempts: number; status: TeacherQuizStatus;
};

function cleanQuestions(questions: ClassQuizQuestion[]) {
  return questions.map((q, index) => ({
    id: q.id || `q-${index + 1}`, prompt: q.prompt.trim(), type: q.type,
    options: q.type === "true_false" ? ["True", "False"] : q.options.map((x) => x.trim()).filter(Boolean),
    correctIndex: q.correctIndex, explanation: q.explanation?.trim() || undefined
  })).filter((q) => q.prompt && q.options.length >= 2 && q.correctIndex < q.options.length);
}

function quizModerationSnapshot(value: {
  id: string; title: string; description?: string; subject: TeacherQuizSubject;
  gradeLevels: number[]; questions: ClassQuizQuestion[]; baseXpReward: number;
  passingScore: number; maxAttempts: number; version?: number;
}) {
  return {
    id: value.id,
    title: value.title,
    description: value.description ?? "",
    subject: value.subject,
    gradeLevels: value.gradeLevels,
    questions: value.questions,
    baseXpReward: value.baseXpReward,
    passingScore: value.passingScore,
    maxAttempts: value.maxAttempts,
    version: value.version ?? 1,
    status: "ready" as const
  };
}

export async function listTeacherQuizzes(teacherId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("TeacherQuiz").select("*").eq("createdBy", teacherId).order("updatedAt", { ascending: false });
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((q) => q.id as string);
  const { data: deployments } = ids.length
    ? await admin.from("ClassQuiz").select("id,sourceQuizId").in("sourceQuizId", ids)
    : { data: [] };
  const deploymentIds = (deployments ?? []).map((x) => x.id as string);
  const { data: attempts } = deploymentIds.length
    ? await admin.from("ClassQuizAttempt").select("quizId,scorePercentage,passed").in("quizId", deploymentIds)
    : { data: [] };
  return (data ?? []).map((row) => {
    const quizDeployments = (deployments ?? []).filter((x) => x.sourceQuizId === row.id);
    const deployedIds = new Set(quizDeployments.map((x) => x.id));
    const quizAttempts = (attempts ?? []).filter((x) => deployedIds.has(x.quizId));
    return {
      ...row,
      assignmentCount: quizDeployments.length,
      attemptCount: quizAttempts.length,
      averageScore: quizAttempts.length ? Math.round(quizAttempts.reduce((sum, x) => sum + Number(x.scorePercentage), 0) / quizAttempts.length) : null,
      passRate: quizAttempts.length ? Math.round(quizAttempts.filter((x) => x.passed).length / quizAttempts.length * 100) : null
    };
  });
}

export async function createTeacherQuiz(teacherId: string, input: TeacherQuizInput) {
  const questions = cleanQuestions(input.questions);
  if (input.status === "ready" && !questions.length) throw new Error("Add at least one valid question before marking the quiz ready.");
  const admin = createAdminClient();
  const id = crypto.randomUUID();
  const snapshot = quizModerationSnapshot({ ...input, id, questions, version: 1 });
  const moderation = input.status === "ready"
    ? await moderateTeacherContent({ teacherId, contentType: "teacher_quiz", contentId: id, snapshot })
    : null;
  const status = moderation && moderation.state !== "published" ? "draft" : input.status;
  const { data, error } = await admin.from("TeacherQuiz")
    .insert({ ...input, id, status, questions, createdBy: teacherId })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message || "Unable to create quiz.");
  if (moderation?.state === "published") await markModerationPublished(moderation.caseId);
  return { id: data.id as string, moderation };
}

export async function updateTeacherQuiz(teacherId: string, quizId: string, input: Partial<TeacherQuizInput>) {
  const admin = createAdminClient();
  const { data: current, error: readError } = await admin.from("TeacherQuiz").select("*").eq("id", quizId).eq("createdBy", teacherId).maybeSingle();
  if (readError || !current) throw new Error(readError?.message || "Quiz not found.");
  const questions = input.questions ? cleanQuestions(input.questions) : current.questions;
  if ((input.status ?? current.status) === "ready" && !(questions as unknown[]).length) throw new Error("Add at least one valid question before marking the quiz ready.");
  const snapshot = quizModerationSnapshot({ ...current, ...input, id: quizId, questions, version: Number(current.version) + 1 });
  const moderation = (input.status ?? current.status) === "ready"
    ? await moderateTeacherContent({ teacherId, contentType: "teacher_quiz", contentId: quizId, snapshot })
    : null;
  if (moderation && moderation.state !== "published") return { moderation };
  const { error } = await admin.from("TeacherQuiz").update({ ...input, ...(input.questions ? { questions } : {}), version: Number(current.version) + 1 }).eq("id", quizId).eq("createdBy", teacherId);
  if (error) throw new Error(error.message);
  if (moderation) await markModerationPublished(moderation.caseId);
  return { moderation };
}

export async function assignTeacherQuiz(
  teacherId: string,
  quizId: string,
  classIds: string[],
  schedule: { startAt: string | null; deadline: string | null; offPlatformReward: string }
) {
  const admin = createAdminClient();
  const [{ data: quiz }, { data: classes, error: classError }] = await Promise.all([
    admin.from("TeacherQuiz").select("*").eq("id", quizId).eq("createdBy", teacherId).maybeSingle(),
    admin.from("TeacherClass").select("id,name,status").in("id", classIds).eq("teacherId", teacherId)
  ]);
  if (!quiz || quiz.status !== "ready") throw new Error("Only a ready quiz can be assigned.");
  const moderation = await moderateTeacherContent({
    teacherId,
    contentType: "teacher_quiz",
    contentId: quizId,
    snapshot: quizModerationSnapshot({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      subject: quiz.subject,
      gradeLevels: quiz.gradeLevels,
      questions: quiz.questions,
      baseXpReward: quiz.baseXpReward,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      version: quiz.version
    })
  });
  if (moderation.state !== "published") throw new Error(moderation.message);
  if (classError || !classes || classes.length !== classIds.length || classes.some((x) => x.status !== "active")) throw new Error("Choose only your active classes.");
  const { data: duplicates } = await admin.from("ClassQuiz").select("classId").eq("sourceQuizId", quizId).in("classId", classIds).in("status", ["draft", "published"]);
  if (duplicates?.length) {
    const names = classes.filter((c) => duplicates.some((d) => d.classId === c.id)).map((c) => c.name).join(", ");
    throw new Error(`This quiz is already active in: ${names}. Close it before assigning again.`);
  }
  const rows = classes.map((classroom) => ({
    classId: classroom.id, createdBy: teacherId, sourceQuizId: quiz.id, sourceVersion: quiz.version,
    title: quiz.title, description: quiz.description, questions: quiz.questions,
    startAt: schedule.startAt, deadline: schedule.deadline, offPlatformReward: schedule.offPlatformReward,
    baseXpReward: quiz.baseXpReward, passingScore: quiz.passingScore, maxAttempts: quiz.maxAttempts, status: "published"
  }));
  const { data, error } = await admin.from("ClassQuiz").insert(rows).select("id,classId");
  if (error) throw new Error(error.message);
  return data ?? [];
}
