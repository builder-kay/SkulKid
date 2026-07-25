import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClassQuizQuestion } from "@/lib/classes/types";
import { quizHasEnded } from "@/lib/quizzes/pasco-rules";

export type PascoAttempt = {
  attemptNumber: number;
  scorePercentage: number;
  passed: boolean;
  starsAwarded: number;
  xpAwarded: number;
  submittedAt: string;
  answers: Array<{ questionId: string; selectedIndex: number; correct: boolean }>;
};

export async function listStudentPasco(studentId: string) {
  const admin = createAdminClient();
  const { data: memberships, error: membershipError } = await admin
    .from("ClassMembership")
    .select("classId")
    .eq("studentId", studentId)
    .eq("status", "active");
  if (membershipError) throw new Error(membershipError.message);
  const classIds = (memberships ?? []).map((row) => row.classId as string);
  if (!classIds.length) return { quizzes: [], classes: [] };

  const [{ data: classes, error: classError }, { data: quizRows, error: quizError }] = await Promise.all([
    admin.from("TeacherClass").select("id,name,gradeLevel").in("id", classIds).eq("status", "active"),
    admin.from("ClassQuiz")
      .select("id,classId,title,description,questions,deadline,offPlatformReward,baseXpReward,passingScore,status,updatedAt")
      .in("classId", classIds)
      .in("status", ["published", "closed"])
  ]);
  if (classError) throw new Error(classError.message);
  if (quizError) throw new Error(quizError.message);
  const activeClassIds = new Set((classes ?? []).map((row) => row.id as string));
  const ended = (quizRows ?? []).filter((row) =>
    activeClassIds.has(row.classId as string)
    && quizHasEnded({ status: row.status as string, deadline: row.deadline as string | null })
  );
  const quizIds = ended.map((row) => row.id as string);
  const { data: attempts, error: attemptError } = quizIds.length
    ? await admin.from("ClassQuizAttempt")
        .select("quizId,attemptNumber,scorePercentage,passed,starsAwarded,xpAwarded,submittedAt")
        .eq("studentId", studentId)
        .in("quizId", quizIds)
        .order("attemptNumber", { ascending: true })
    : { data: [], error: null };
  if (attemptError) throw new Error(attemptError.message);
  const classById = new Map((classes ?? []).map((row) => [row.id as string, row]));

  const quizzes = ended.map((row) => {
    const quizAttempts = (attempts ?? []).filter((attempt) => attempt.quizId === row.id);
    const best = quizAttempts.length
      ? quizAttempts.reduce((current, attempt) => Number(attempt.scorePercentage) > Number(current.scorePercentage) ? attempt : current)
      : null;
    const classroom = classById.get(row.classId as string);
    return {
      id: row.id as string,
      classId: row.classId as string,
      className: (classroom?.name as string) ?? "Class",
      gradeLevel: Number(classroom?.gradeLevel ?? 1),
      title: row.title as string,
      description: (row.description as string) ?? "",
      questionCount: Array.isArray(row.questions) ? row.questions.length : 0,
      endedAt: ((row.deadline as string | null) ?? row.updatedAt) as string,
      endedByTeacher: row.status === "closed",
      baseXpReward: Number(row.baseXpReward),
      passingScore: Number(row.passingScore),
      offPlatformReward: (row.offPlatformReward as string) ?? "",
      attempted: quizAttempts.length > 0,
      attemptCount: quizAttempts.length,
      bestScore: best ? Number(best.scorePercentage) : null,
      passed: best ? Boolean(best.passed) : false
    };
  }).sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());

  return {
    quizzes,
    classes: (classes ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      gradeLevel: Number(row.gradeLevel)
    })).sort((a, b) => a.name.localeCompare(b.name))
  };
}

export async function getStudentPascoQuiz(studentId: string, quizId: string) {
  const admin = createAdminClient();
  const { data: quiz, error: quizError } = await admin
    .from("ClassQuiz")
    .select("id,classId,title,description,questions,startAt,deadline,offPlatformReward,baseXpReward,passingScore,maxAttempts,status,updatedAt")
    .eq("id", quizId)
    .maybeSingle();
  if (quizError) throw new Error(quizError.message);
  if (!quiz) throw new Error("PASCO quiz not found.");

  const [{ data: membership }, { data: classroom }] = await Promise.all([
    admin.from("ClassMembership")
      .select("id")
      .eq("classId", quiz.classId)
      .eq("studentId", studentId)
      .eq("status", "active")
      .maybeSingle(),
    admin.from("TeacherClass").select("id,name,gradeLevel,status").eq("id", quiz.classId).maybeSingle()
  ]);
  if (!membership || !classroom || classroom.status !== "active") throw new Error("You do not have access to this PASCO quiz.");
  if (!quizHasEnded({ status: quiz.status as string, deadline: quiz.deadline as string | null })) {
    throw new Error("This quiz has not ended. Answers remain locked.");
  }

  const { data: attemptRows, error: attemptError } = await admin
    .from("ClassQuizAttempt")
    .select("attemptNumber,answers,scorePercentage,passed,starsAwarded,xpAwarded,submittedAt")
    .eq("quizId", quizId)
    .eq("studentId", studentId)
    .order("attemptNumber", { ascending: true });
  if (attemptError) throw new Error(attemptError.message);
  const attempts: PascoAttempt[] = (attemptRows ?? []).map((row) => ({
    attemptNumber: Number(row.attemptNumber),
    scorePercentage: Number(row.scorePercentage),
    passed: Boolean(row.passed),
    starsAwarded: Number(row.starsAwarded),
    xpAwarded: Number(row.xpAwarded),
    submittedAt: row.submittedAt as string,
    answers: Array.isArray(row.answers)
      ? (row.answers as PascoAttempt["answers"]).map((answer) => ({
          questionId: String(answer.questionId),
          selectedIndex: Number(answer.selectedIndex),
          correct: Boolean(answer.correct)
        }))
      : []
  }));
  const bestAttempt = attempts.length
    ? attempts.reduce((best, attempt) => attempt.scorePercentage > best.scorePercentage ? attempt : best)
    : null;
  const questions = ((quiz.questions as ClassQuizQuestion[]) ?? []).map((question) => ({
    id: question.id,
    prompt: question.prompt,
    type: question.type,
    options: question.options,
    correctIndex: question.correctIndex,
    correctAnswer: question.options[question.correctIndex] ?? "",
    explanation: question.explanation ?? ""
  }));

  return {
    quiz: {
      id: quiz.id as string,
      classId: quiz.classId as string,
      className: classroom.name as string,
      gradeLevel: Number(classroom.gradeLevel),
      title: quiz.title as string,
      description: (quiz.description as string) ?? "",
      questions,
      endedAt: ((quiz.deadline as string | null) ?? quiz.updatedAt) as string,
      endedByTeacher: quiz.status === "closed",
      startAt: (quiz.startAt as string | null) ?? null,
      deadline: (quiz.deadline as string | null) ?? null,
      baseXpReward: Number(quiz.baseXpReward),
      passingScore: Number(quiz.passingScore),
      maxAttempts: Number(quiz.maxAttempts),
      offPlatformReward: (quiz.offPlatformReward as string) ?? ""
    },
    attempts,
    bestAttempt
  };
}
