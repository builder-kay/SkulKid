import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClassQuizQuestion } from "@/lib/classes/types";

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
  const { data, error } = await admin.from("TeacherQuiz").insert({ ...input, questions, createdBy: teacherId }).select("id").single();
  if (error || !data) throw new Error(error?.message || "Unable to create quiz.");
  return data.id as string;
}

export async function updateTeacherQuiz(teacherId: string, quizId: string, input: Partial<TeacherQuizInput>) {
  const admin = createAdminClient();
  const { data: current, error: readError } = await admin.from("TeacherQuiz").select("*").eq("id", quizId).eq("createdBy", teacherId).maybeSingle();
  if (readError || !current) throw new Error(readError?.message || "Quiz not found.");
  const questions = input.questions ? cleanQuestions(input.questions) : current.questions;
  if ((input.status ?? current.status) === "ready" && !(questions as unknown[]).length) throw new Error("Add at least one valid question before marking the quiz ready.");
  const { error } = await admin.from("TeacherQuiz").update({ ...input, ...(input.questions ? { questions } : {}), version: Number(current.version) + 1 }).eq("id", quizId).eq("createdBy", teacherId);
  if (error) throw new Error(error.message);
}

export async function assignTeacherQuiz(teacherId: string, quizId: string, classIds: string[], deadline: string | null) {
  const admin = createAdminClient();
  const [{ data: quiz }, { data: classes, error: classError }] = await Promise.all([
    admin.from("TeacherQuiz").select("*").eq("id", quizId).eq("createdBy", teacherId).maybeSingle(),
    admin.from("TeacherClass").select("id,name,status").in("id", classIds).eq("teacherId", teacherId)
  ]);
  if (!quiz || quiz.status !== "ready") throw new Error("Only a ready quiz can be assigned.");
  if (classError || !classes || classes.length !== classIds.length || classes.some((x) => x.status !== "active")) throw new Error("Choose only your active classes.");
  const { data: duplicates } = await admin.from("ClassQuiz").select("classId").eq("sourceQuizId", quizId).in("classId", classIds).in("status", ["draft", "published"]);
  if (duplicates?.length) {
    const names = classes.filter((c) => duplicates.some((d) => d.classId === c.id)).map((c) => c.name).join(", ");
    throw new Error(`This quiz is already active in: ${names}. Close it before assigning again.`);
  }
  const rows = classes.map((classroom) => ({
    classId: classroom.id, createdBy: teacherId, sourceQuizId: quiz.id, sourceVersion: quiz.version,
    title: quiz.title, description: quiz.description, questions: quiz.questions, deadline,
    baseXpReward: quiz.baseXpReward, passingScore: quiz.passingScore, maxAttempts: quiz.maxAttempts, status: "published"
  }));
  const { data, error } = await admin.from("ClassQuiz").insert(rows).select("id,classId");
  if (error) throw new Error(error.message);
  return data ?? [];
}
