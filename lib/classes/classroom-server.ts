import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveAppRole } from "@/lib/auth/roles";
import { calculateStars } from "@/lib/gamification/calculate-stars";
import { calculateLevel } from "@/lib/gamification/calculate-level";
import { classJoinPath, generateJoinCode, normalizeJoinCode } from "@/lib/classes/join-code";
import { analyseClassChatMessage, childFriendlyChatRules } from "@/lib/classes/class-chat-safety";
import type {
  AdviceSuggestionType,
  ClassAdviceView,
  ClassCourseAssignmentView,
  ClassLeaderboardEntry,
  ClassQuizAttemptSummary,
  ClassQuizQuestion,
  ClassQuizView,
  ClassRosterMember,
  ClassStatus,
  CourseVisibility,
  PointDeductionView,
  QuizStatus,
  StudentClassSummary,
  StudentDashboardActivity,
  TeacherClassSummary
} from "@/lib/classes/types";

type AuthUser = { id: string; app_metadata?: { role?: unknown }; user_metadata?: Record<string, unknown> };

function displayNameFrom(user: { user_metadata?: Record<string, unknown> } | null | undefined, fallback = "Learner") {
  const metadata = user?.user_metadata ?? {};
  if (typeof metadata.display_name === "string" && metadata.display_name.trim()) return metadata.display_name.trim();
  return fallback;
}

function gradeFrom(user: { user_metadata?: Record<string, unknown> } | null | undefined) {
  const grade = user?.user_metadata?.grade;
  return typeof grade === "number" ? `Basic ${grade}` : "Learner";
}

function slugifyCourseName(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "course";
}

function quizPotentialXp(baseXp: number, scorePercentage: number, passingScore: number) {
  const passed = scorePercentage >= passingScore;
  const stars = calculateStars(true, scorePercentage);
  return passed ? baseXp + stars * 5 : Math.max(5, Math.round(baseXp * 0.25));
}

function mapAttemptSummary(row: {
  attemptNumber?: number | null;
  scorePercentage: number;
  passed: boolean;
  starsAwarded: number;
  xpAwarded: number;
  submittedAt: string;
}): ClassQuizAttemptSummary {
  return {
    attemptNumber: Number(row.attemptNumber ?? 1),
    scorePercentage: Number(row.scorePercentage),
    passed: Boolean(row.passed),
    starsAwarded: Number(row.starsAwarded),
    xpAwarded: Number(row.xpAwarded),
    submittedAt: row.submittedAt
  };
}

function bestAttemptFrom(attempts: ClassQuizAttemptSummary[]): ClassQuizAttemptSummary | null {
  if (!attempts.length) return null;
  return attempts.reduce((best, attempt) => (attempt.scorePercentage > best.scorePercentage ? attempt : best));
}

function canRetakeQuiz(input: {
  status: QuizStatus;
  startAt?: string | null;
  deadline: string | null;
  attemptsUsed: number;
  maxAttempts: number;
}) {
  if (input.status !== "published") return false;
  if (input.startAt && new Date(input.startAt).getTime() > Date.now()) return false;
  if (input.deadline && new Date(input.deadline).getTime() < Date.now()) return false;
  return input.attemptsUsed < input.maxAttempts;
}

function courseVisibility(value: unknown): CourseVisibility {
  return value === "class" ? "class" : "platform";
}

export async function requireAuthUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");
  return user as AuthUser;
}

export async function requireTeacher() {
  const user = await requireAuthUser();
  const role = resolveAppRole(user.app_metadata?.role);
  if (role !== "teacher" && role !== "admin") throw new Error("Teacher access required.");
  if (role === "teacher") {
    const admin = createAdminClient();
    const { data, error } = await admin.from("TeacherTrustProfile").select("status").eq("teacherId", user.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.status === "banned") throw new Error("This teacher account is suspended. Use the moderation appeal page if you believe this is a mistake.");
  }
  return user;
}

export async function requireStudent() {
  const user = await requireAuthUser();
  const role = resolveAppRole(user.app_metadata?.role);
  if (role !== "student") throw new Error("Student access required.");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuthUser();
  if (resolveAppRole(user.app_metadata?.role) !== "admin") throw new Error("Administrator access required.");
  return user;
}

async function assertOwnsClass(teacherId: string, classId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("TeacherClass").select("id,teacherId,status").eq("id", classId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Class not found.");
  if (data.teacherId !== teacherId) throw new Error("You do not own this class.");
  return data as { id: string; teacherId: string; status: ClassStatus };
}

async function assertActiveMember(studentId: string, classId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ClassMembership")
    .select("id,status")
    .eq("classId", classId)
    .eq("studentId", studentId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Join this class first.");
  return data;
}

export async function listTeacherClasses(teacherId: string): Promise<TeacherClassSummary[]> {
  const admin = createAdminClient();
  const { data: classes, error } = await admin
    .from("TeacherClass")
    .select("id,name,description,joinCode,gradeLevel,status,createdAt")
    .eq("teacherId", teacherId)
    .order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  if (!classes?.length) return [];

  const ids = classes.map((item) => item.id as string);
  const [members, quizzes, courses] = await Promise.all([
    admin.from("ClassMembership").select("classId").in("classId", ids).eq("status", "active"),
    admin.from("ClassQuiz").select("classId").in("classId", ids),
    admin.from("ClassCourseAssignment").select("classId").in("classId", ids)
  ]);

  const countBy = (rows: Array<{ classId: string }> | null) => {
    const map = new Map<string, number>();
    for (const row of rows ?? []) map.set(row.classId, (map.get(row.classId) ?? 0) + 1);
    return map;
  };
  const memberCounts = countBy(members.data);
  const quizCounts = countBy(quizzes.data);
  const courseCounts = countBy(courses.data);

  return classes.map((classroom) => ({
    id: classroom.id as string,
    name: classroom.name as string,
    description: (classroom.description as string) ?? "",
    joinCode: classroom.joinCode as string,
    joinUrl: classJoinPath(classroom.joinCode as string),
    gradeLevel: Number(classroom.gradeLevel),
    status: classroom.status as ClassStatus,
    memberCount: memberCounts.get(classroom.id as string) ?? 0,
    quizCount: quizCounts.get(classroom.id as string) ?? 0,
    courseCount: courseCounts.get(classroom.id as string) ?? 0,
    createdAt: classroom.createdAt as string
  }));
}

export async function createTeacherClass(input: {
  teacherId: string;
  name: string;
  description?: string;
  gradeLevel: number;
}): Promise<TeacherClassSummary> {
  const admin = createAdminClient();
  let joinCode = generateJoinCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await admin
      .from("TeacherClass")
      .insert({
        teacherId: input.teacherId,
        name: input.name.trim(),
        description: (input.description ?? "").trim(),
        gradeLevel: input.gradeLevel,
        joinCode
      })
      .select("id,name,description,joinCode,gradeLevel,status,createdAt")
      .single();
    if (!error && data) {
      return {
        id: data.id as string,
        name: data.name as string,
        description: (data.description as string) ?? "",
        joinCode: data.joinCode as string,
        joinUrl: classJoinPath(data.joinCode as string),
        gradeLevel: Number(data.gradeLevel),
        status: data.status as ClassStatus,
        memberCount: 0,
        quizCount: 0,
        courseCount: 0,
        createdAt: data.createdAt as string
      };
    }
    if (error?.code !== "23505") throw new Error(error?.message || "Unable to create class.");
    joinCode = generateJoinCode();
  }
  throw new Error("Unable to generate a unique join code. Please try again.");
}

export async function getTeacherClassDetail(teacherId: string, classId: string) {
  await assertOwnsClass(teacherId, classId);
  const classes = await listTeacherClasses(teacherId);
  const classroom = classes.find((item) => item.id === classId);
  if (!classroom) throw new Error("Class not found.");
  const [roster, courseAssignments, quizzes, leaderboard, pointReports] = await Promise.all([
    listClassRoster(teacherId, classId),
    listClassCourses(teacherId, classId),
    listClassQuizzes(teacherId, classId),
    getClassLeaderboard(classId),
    listTeacherClassPointReports(teacherId, classId)
  ]);
  return { classroom, roster, courseAssignments, quizzes, leaderboard, pointReports };
}

async function listTeacherClassPointReports(teacherId: string, classId: string) {
  await assertOwnsClass(teacherId, classId);
  const admin = createAdminClient();
  const { data: deductions, error } = await admin
    .from("PointDeduction")
    .select("id,studentId,amount,reason,createdAt")
    .eq("classId", classId)
    .eq("teacherId", teacherId)
    .order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  const ids = (deductions ?? []).map((item) => item.id as string);
  const { data: disputes } = ids.length
    ? await admin.from("PointDeductionDispute").select("id,deductionId,message,status,createdAt,resolutionNote").in("deductionId", ids)
    : { data: [] };
  const reported = new Map((disputes ?? []).map((item) => [item.deductionId as string, item]));
  const studentIds = [...new Set((deductions ?? []).map((item) => item.studentId as string))];
  const profiles = await Promise.all(studentIds.map(async (id) => (await admin.auth.admin.getUserById(id)).data.user));
  const nameById = new Map(profiles.filter(Boolean).map((user) => [user!.id, displayNameFrom(user)]));
  return (deductions ?? []).flatMap((deduction) => {
    const report = reported.get(deduction.id as string);
    return report ? [{
      id: report.id as string,
      deductionId: deduction.id as string,
      studentName: nameById.get(deduction.studentId as string) ?? "Student",
      amount: Number(deduction.amount),
      reason: deduction.reason as string,
      message: report.message as string,
      status: report.status as string,
      createdAt: report.createdAt as string,
      resolutionNote: (report.resolutionNote as string | null) ?? null
    }] : [];
  });
}

export async function deductStudentPoints(input: {
  teacherId: string;
  classId: string;
  studentId: string;
  amount: number;
  reason: string;
}) {
  await assertOwnsClass(input.teacherId, input.classId);
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("apply_teacher_point_deduction", {
    p_teacher_id: input.teacherId,
    p_class_id: input.classId,
    p_student_id: input.studentId,
    p_amount: input.amount,
    p_reason: input.reason
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function listClassRoster(teacherId: string, classId: string): Promise<ClassRosterMember[]> {
  await assertOwnsClass(teacherId, classId);
  const admin = createAdminClient();
  const { data: memberships, error } = await admin
    .from("ClassMembership")
    .select("studentId,joinedAt")
    .eq("classId", classId)
    .eq("status", "active")
    .order("joinedAt", { ascending: true });
  if (error) throw new Error(error.message);
  if (!memberships?.length) return [];

  const studentIds = memberships.map((row) => row.studentId as string);
  const [{ data: profiles }, { data: gameStates }, { data: attempts }] = await Promise.all([
    admin.from("StudentProfile").select("userId,profile").in("userId", studentIds),
    admin.from("StudentGameState").select("userId,state").in("userId", studentIds),
    admin.from("ClassQuizAttempt").select("studentId,scorePercentage,passed,quizId,xpAwarded").in("studentId", studentIds)
  ]);

  const classQuizIds = new Set(
    ((await admin.from("ClassQuiz").select("id").eq("classId", classId)).data ?? []).map((row) => row.id as string)
  );

  const users = await Promise.all(studentIds.map(async (id) => {
    const { data } = await admin.auth.admin.getUserById(id);
    return data.user;
  }));
  const userById = new Map(users.filter(Boolean).map((user) => [user!.id, user!]));

  return memberships.map((membership) => {
    const studentId = membership.studentId as string;
    const user = userById.get(studentId);
    const profile = profiles?.find((row) => row.userId === studentId)?.profile as { displayName?: string; grade?: string } | undefined;
    const state = (gameStates?.find((row) => row.userId === studentId)?.state ?? {}) as {
      xp?: number;
      stars?: number;
      streak?: number;
      completedLessonIds?: string[];
    };
    const studentAttempts = (attempts ?? []).filter(
      (attempt) => attempt.studentId === studentId && classQuizIds.has(attempt.quizId as string)
    );
    const bestByQuiz = new Map<string, number>();
    const passedQuizzes = new Set<string>();
    let classXp = 0;
    for (const attempt of studentAttempts) {
      const quizId = attempt.quizId as string;
      const score = Number(attempt.scorePercentage);
      classXp += Number(attempt.xpAwarded ?? 0);
      bestByQuiz.set(quizId, Math.max(bestByQuiz.get(quizId) ?? 0, score));
      if (attempt.passed) passedQuizzes.add(quizId);
    }
    const bestScores = [...bestByQuiz.values()];
    const averageQuizScore = bestScores.length
      ? Math.round(bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length)
      : null;
    return {
      studentId,
      displayName: profile?.displayName || displayNameFrom(user),
      grade: profile?.grade || gradeFrom(user),
      joinedAt: membership.joinedAt as string,
      xp: Number(state.xp ?? 0),
      stars: Number(state.stars ?? 0),
      streak: Number(state.streak ?? 0),
      completedLessons: Array.isArray(state.completedLessonIds) ? state.completedLessonIds.length : 0,
      quizzesTaken: bestByQuiz.size,
      quizzesPassed: passedQuizzes.size,
      averageQuizScore,
      classXp
    };
  });
}

export async function listClassCourses(teacherId: string, classId: string): Promise<ClassCourseAssignmentView[]> {
  await assertOwnsClass(teacherId, classId);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ClassCourseAssignment")
    .select("id,courseId,note,assignedAt")
    .eq("classId", classId)
    .order("assignedAt", { ascending: false });
  if (error) throw new Error(error.message);
  const { data: ownedSubjects, error: ownedError } = await admin
    .from("Subject")
    .select("id")
    .eq("visibility", "class")
    .eq("ownerClassId", classId);
  if (ownedError) throw new Error(ownedError.message);
  const courseIds = [...new Set([
    ...(data ?? []).map((row) => row.courseId as string),
    ...(ownedSubjects ?? []).map((row) => row.id as string)
  ])];
  if (!courseIds.length) return [];
  const { data: subjects } = await admin.from("Subject").select("id,name,slug,description,visibility,ownerClassId,createdAt").in("id", courseIds);
  const [{ data: units }, { data: lessons }] = await Promise.all([
    admin.from("Unit").select("subjectId").in("subjectId", courseIds),
    admin.from("AdminLessonRecord").select("courseId").in("courseId", courseIds)
  ]);
  const countByCourse = (rows: Array<{ subjectId?: unknown; courseId?: unknown }> | null, key: "subjectId" | "courseId") => {
    const counts = new Map<string, number>();
    for (const row of rows ?? []) {
      const id = String(row[key] ?? "");
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  };
  const moduleCounts = countByCourse(units, "subjectId");
  const lessonCounts = countByCourse(lessons, "courseId");
  const subjectById = new Map((subjects ?? []).map((subject) => [subject.id as string, subject]));
  const rows = [...(data ?? [])];
  for (const subject of subjects ?? []) {
    if (subject.visibility === "class" && !rows.some((row) => row.courseId === subject.id)) {
      rows.push({
        id: `owned-${subject.id}`,
        courseId: subject.id,
        note: "",
        assignedAt: subject.createdAt
      });
    }
  }
  return rows.map((row) => {
    const subject = subjectById.get(row.courseId as string);
    const visibility = courseVisibility(subject?.visibility);
    return {
      id: row.id as string,
      courseId: row.courseId as string,
      courseName: (subject?.name as string) ?? "Course",
      courseSlug: (subject?.slug as string) ?? "",
      note: (row.note as string) ?? "",
      assignedAt: row.assignedAt as string,
      visibility,
      isClassOnly: visibility === "class",
      description: (subject?.description as string) ?? "",
      moduleCount: moduleCounts.get(row.courseId as string) ?? 0,
      lessonCount: lessonCounts.get(row.courseId as string) ?? 0
    };
  });
}

export async function createClassOnlyCourse(
  teacherId: string,
  classId: string,
  input: { name: string; description?: string; gradeLevel?: number; note?: string }
): Promise<ClassCourseAssignmentView[]> {
  await assertOwnsClass(teacherId, classId);
  const admin = createAdminClient();
  const { data: classroom, error: classError } = await admin
    .from("TeacherClass")
    .select("id,gradeLevel")
    .eq("id", classId)
    .maybeSingle();
  if (classError) throw new Error(classError.message);
  if (!classroom) throw new Error("Class not found.");

  const gradeLevel = input.gradeLevel ?? Number(classroom.gradeLevel);
  const baseSlug = slugifyCourseName(input.name);
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const slug = `class-${suffix}-${baseSlug}`.slice(0, 80);
  const courseId = `course-${crypto.randomUUID()}`;

  const { count } = await admin
    .from("Subject")
    .select("id", { count: "exact", head: true })
    .eq("visibility", "class")
    .eq("ownerClassId", classId);
  const order = 1000 + (count ?? 0);

  const { error: subjectError } = await admin.from("Subject").insert({
    id: courseId,
    name: input.name.trim(),
    slug,
    description: (input.description ?? "").trim(),
    icon: "users",
    colourToken: "#7C3AED",
    gradeLevels: [gradeLevel],
    order,
    status: "ACTIVE",
    visibility: "class",
    ownerClassId: classId,
    createdBy: teacherId,
    updatedAt: new Date().toISOString()
  });
  if (subjectError) throw new Error(subjectError.message);

  const { error: assignError } = await admin.from("ClassCourseAssignment").upsert(
    { classId, courseId, note: (input.note ?? "").trim() },
    { onConflict: "classId,courseId" }
  );
  if (assignError) throw new Error(assignError.message);
  return listClassCourses(teacherId, classId);
}

export async function assignCourseToClass(teacherId: string, classId: string, courseId: string, note = "") {
  await assertOwnsClass(teacherId, classId);
  const admin = createAdminClient();
  const { data: course, error: courseError } = await admin.from("Subject").select("id,visibility,ownerClassId").eq("id", courseId).maybeSingle();
  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error("Course not found.");
  if (course.visibility === "class" && course.ownerClassId !== classId) {
    throw new Error("That class-only subject belongs to a different class.");
  }
  const { error } = await admin.from("ClassCourseAssignment").upsert(
    { classId, courseId, note: note.trim() },
    { onConflict: "classId,courseId" }
  );
  if (error) throw new Error(error.message);
}

export async function removeCourseFromClass(teacherId: string, classId: string, assignmentId: string) {
  await assertOwnsClass(teacherId, classId);
  const admin = createAdminClient();
  const { error } = await admin.from("ClassCourseAssignment").delete().eq("id", assignmentId).eq("classId", classId);
  if (error) throw new Error(error.message);
}

function normalizeQuestions(questions: ClassQuizQuestion[]): ClassQuizQuestion[] {
  return questions.map((question, index) => ({
    id: question.id || `q-${index + 1}`,
    prompt: question.prompt.trim(),
    type: question.type,
    options: question.type === "true_false" ? ["True", "False"] : question.options.map((option) => option.trim()).filter(Boolean),
    correctIndex: question.correctIndex
  })).filter((question) => question.prompt && question.options.length >= 2);
}

export async function listClassQuizzes(teacherId: string, classId: string): Promise<ClassQuizView[]> {
  await assertOwnsClass(teacherId, classId);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ClassQuiz")
    .select("id,classId,title,description,questions,startAt,deadline,offPlatformReward,baseXpReward,passingScore,maxAttempts,status,createdAt")
    .eq("classId", classId)
    .order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  if (!data?.length) return [];
  const quizIds = data.map((row) => row.id as string);
  const { data: attempts } = await admin.from("ClassQuizAttempt").select("quizId").in("quizId", quizIds);
  const attemptCounts = new Map<string, number>();
  for (const attempt of attempts ?? []) {
    attemptCounts.set(attempt.quizId as string, (attemptCounts.get(attempt.quizId as string) ?? 0) + 1);
  }
  return data.map((row) => ({
    id: row.id as string,
    classId: row.classId as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    questions: (row.questions as ClassQuizQuestion[]) ?? [],
    startAt: (row.startAt as string | null) ?? null,
    deadline: (row.deadline as string | null) ?? null,
    offPlatformReward: (row.offPlatformReward as string) ?? "",
    baseXpReward: Number(row.baseXpReward),
    passingScore: Number(row.passingScore),
    maxAttempts: Number(row.maxAttempts ?? 3),
    status: row.status as QuizStatus,
    attemptCount: attemptCounts.get(row.id as string) ?? 0,
    createdAt: row.createdAt as string
  }));
}

export async function createClassQuiz(input: {
  id?: string;
  teacherId: string;
  classId: string;
  title: string;
  description?: string;
  questions: ClassQuizQuestion[];
  startAt?: string | null;
  deadline?: string | null;
  offPlatformReward?: string;
  baseXpReward?: number;
  passingScore?: number;
  maxAttempts?: number;
  status?: QuizStatus;
}) {
  await assertOwnsClass(input.teacherId, input.classId);
  const questions = normalizeQuestions(input.questions);
  if (!questions.length) throw new Error("Add at least one quiz question.");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ClassQuiz")
    .insert({
      ...(input.id ? { id: input.id } : {}),
      classId: input.classId,
      createdBy: input.teacherId,
      title: input.title.trim(),
      description: (input.description ?? "").trim(),
      questions,
      startAt: input.startAt || null,
      deadline: input.deadline || null,
      offPlatformReward: input.offPlatformReward?.trim() || "",
      baseXpReward: input.baseXpReward ?? 40,
      passingScore: input.passingScore ?? 70,
      maxAttempts: input.maxAttempts ?? 3,
      status: input.status ?? "draft"
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message || "Unable to create quiz.");
  return data.id as string;
}

export async function updateClassQuiz(
  teacherId: string,
  classId: string,
  quizId: string,
  patch: Partial<{
    title: string;
    description: string;
    questions: ClassQuizQuestion[];
    startAt: string | null;
    deadline: string | null;
    offPlatformReward: string;
    baseXpReward: number;
    passingScore: number;
    maxAttempts: number;
    status: QuizStatus;
  }>
) {
  await assertOwnsClass(teacherId, classId);
  const updates: Record<string, unknown> = {};
  if (patch.title !== undefined) updates.title = patch.title.trim();
  if (patch.description !== undefined) updates.description = patch.description.trim();
  if (patch.questions !== undefined) updates.questions = normalizeQuestions(patch.questions);
  if (patch.startAt !== undefined) updates.startAt = patch.startAt;
  if (patch.deadline !== undefined) updates.deadline = patch.deadline;
  if (patch.offPlatformReward !== undefined) updates.offPlatformReward = patch.offPlatformReward.trim();
  if (patch.baseXpReward !== undefined) updates.baseXpReward = patch.baseXpReward;
  if (patch.passingScore !== undefined) updates.passingScore = patch.passingScore;
  if (patch.maxAttempts !== undefined) updates.maxAttempts = patch.maxAttempts;
  if (patch.status !== undefined) updates.status = patch.status;
  const admin = createAdminClient();
  const { error } = await admin.from("ClassQuiz").update(updates).eq("id", quizId).eq("classId", classId);
  if (error) throw new Error(error.message);
}

export async function getClassLeaderboard(classId: string, viewerStudentId?: string): Promise<ClassLeaderboardEntry[]> {
  const admin = createAdminClient();
  const { data: memberships, error } = await admin
    .from("ClassMembership")
    .select("studentId")
    .eq("classId", classId)
    .eq("status", "active");
  if (error) throw new Error(error.message);
  if (!memberships?.length) return [];

  const studentIds = memberships.map((row) => row.studentId as string);
  const [{ data: quizzes }, { data: attempts }, { data: gameStates }, { data: profiles }] = await Promise.all([
    admin.from("ClassQuiz").select("id").eq("classId", classId),
    admin.from("ClassQuizAttempt").select("studentId,quizId,scorePercentage,passed,xpAwarded,starsAwarded").in("studentId", studentIds),
    admin.from("StudentGameState").select("userId,state").in("userId", studentIds),
    admin.from("StudentProfile").select("userId,profile").in("userId", studentIds)
  ]);
  const classQuizIds = new Set((quizzes ?? []).map((row) => row.id as string));
  const users = await Promise.all(studentIds.map(async (id) => {
    const { data } = await admin.auth.admin.getUserById(id);
    return data.user;
  }));
  const userById = new Map(users.filter(Boolean).map((user) => [user!.id, user!]));

  const entries = studentIds.map((studentId) => {
    const studentAttempts = (attempts ?? []).filter(
      (attempt) => attempt.studentId === studentId && classQuizIds.has(attempt.quizId as string)
    );
    let classXp = 0;
    let classStars = 0;
    const bestByQuiz = new Map<string, number>();
    const passedQuizzes = new Set<string>();
    for (const attempt of studentAttempts) {
      const quizId = attempt.quizId as string;
      classXp += Number(attempt.xpAwarded ?? 0);
      classStars += Number(attempt.starsAwarded ?? 0);
      bestByQuiz.set(quizId, Math.max(bestByQuiz.get(quizId) ?? 0, Number(attempt.scorePercentage)));
      if (attempt.passed) passedQuizzes.add(quizId);
    }
    const bestScores = [...bestByQuiz.values()];
    const bestQuizAverage = bestScores.length
      ? Math.round(bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length)
      : null;
    const state = (gameStates?.find((row) => row.userId === studentId)?.state ?? {}) as { xp?: number; streak?: number };
    const profile = profiles?.find((row) => row.userId === studentId)?.profile as { displayName?: string } | undefined;
    const user = userById.get(studentId);
    return {
      studentId,
      displayName: profile?.displayName || displayNameFrom(user),
      classXp,
      classStars,
      bestQuizAverage,
      quizzesPassed: passedQuizzes.size,
      quizzesAttempted: bestByQuiz.size,
      platformXp: Number(state.xp ?? 0),
      streak: Number(state.streak ?? 0),
      isCurrentUser: viewerStudentId ? studentId === viewerStudentId : undefined
    };
  });

  entries.sort((a, b) => {
    if (b.classXp !== a.classXp) return b.classXp - a.classXp;
    const avgA = a.bestQuizAverage ?? -1;
    const avgB = b.bestQuizAverage ?? -1;
    if (avgB !== avgA) return avgB - avgA;
    return b.platformXp - a.platformXp;
  });

  return entries.map((entry, index) => ({
    rank: index + 1,
    studentId: entry.studentId,
    displayName: entry.displayName,
    classXp: entry.classXp,
    classStars: entry.classStars,
    bestQuizAverage: entry.bestQuizAverage,
    quizzesPassed: entry.quizzesPassed,
    quizzesAttempted: entry.quizzesAttempted,
    platformXp: entry.platformXp,
    streak: entry.streak,
    ...(entry.isCurrentUser !== undefined ? { isCurrentUser: entry.isCurrentUser } : {})
  }));
}

export async function createClassAdvice(input: {
  teacherId: string;
  classId: string;
  studentId: string;
  message: string;
  suggestionType: AdviceSuggestionType;
  title?: string | null;
  feedbackCategory?: "celebration" | "practice" | "intervention" | null;
  priority?: "low" | "normal" | "high" | null;
  recommendedActions?: Array<{ label: string; href?: string }>;
  evidenceSnapshot?: Record<string, unknown>;
  followUpStatus?: "not_required" | "open";
  dueAt?: string | null;
}) {
  await assertOwnsClass(input.teacherId, input.classId);
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("ClassMembership")
    .select("id")
    .eq("classId", input.classId)
    .eq("studentId", input.studentId)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) throw new Error("That student is not in this class.");
  const { error } = await admin.from("ClassAdvice").insert({
    classId: input.classId,
    teacherId: input.teacherId,
    studentId: input.studentId,
    message: input.message.trim(),
    suggestionType: input.suggestionType,
    title: input.title ?? null,
    feedbackCategory: input.feedbackCategory ?? null,
    priority: input.priority ?? null,
    recommendedActions: input.recommendedActions ?? [],
    evidenceSnapshot: input.evidenceSnapshot ?? {},
    followUpStatus: input.followUpStatus ?? "not_required",
    dueAt: input.dueAt ?? null
  });
  if (error) throw new Error(error.message);
}

export async function createStudentTeacherMessage(input: {
  studentId: string;
  classId: string;
  body: string;
}) {
  await assertActiveMember(input.studentId, input.classId);
  const admin = createAdminClient();
  const { data: classroom, error } = await admin
    .from("TeacherClass")
    .select("teacherId")
    .eq("id", input.classId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!classroom) throw new Error("Class not found.");
  const { data: setting } = await admin.from("ClassChatSetting")
    .select("enabled,locked,postingStartsAt,postingEndsAt,timezone,guardianConsentRequired,rulesVersion")
    .eq("classId", input.classId)
    .maybeSingle();
  if (setting?.enabled === false) throw new Error("Class discussion is not enabled.");
  if (setting?.locked) throw new Error("Your teacher has paused this class discussion.");
  if (setting?.postingStartsAt && setting?.postingEndsAt) {
    const localTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: (setting.timezone as string) || "Africa/Accra",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date());
    if (localTime < setting.postingStartsAt || localTime > setting.postingEndsAt) {
      throw new Error(`Messages can be sent between ${setting.postingStartsAt} and ${setting.postingEndsAt}.`);
    }
  }
  if (setting?.guardianConsentRequired !== false) {
    const { data: consent } = await admin.from("ClassChatConsent")
      .select("active,guardianConfirmedAt,rulesAcceptedAt,rulesVersion")
      .eq("classId", input.classId)
      .eq("studentId", input.studentId)
      .maybeSingle();
    if (!consent?.active || !consent.guardianConfirmedAt || !consent.rulesAcceptedAt || consent.rulesVersion !== setting?.rulesVersion) {
      throw new Error("Guardian consent and acceptance of the class-chat rules are required before posting.");
    }
  }
  const safety = analyseClassChatMessage(input.body);
  const { data: inserted, error: insertError } = await admin.from("ClassMessage").insert({
    classId: input.classId,
    teacherId: classroom.teacherId,
    studentId: input.studentId,
    senderId: input.studentId,
    senderRole: "student",
    scope: "class_room",
    kind: "discussion",
    body: input.body.trim(),
    moderationStatus: safety.allowed ? "allowed" : "blocked",
    moderationCategories: safety.categories,
    moderationReason: safety.reason
  }).select("id,body,createdAt").single();
  if (insertError) throw new Error(insertError.message);
  await admin.from("ClassMessageAudit").insert({
    messageId: inserted.id,
    classId: input.classId,
    actorId: input.studentId,
    action: safety.allowed ? "created" : "blocked",
    bodySnapshot: input.body.trim(),
    metadata: { categories: safety.categories, severity: safety.severity }
  });
  if (!safety.allowed) {
    await Promise.all([
      admin.from("ChildSafetyCase").insert({
        classId: input.classId,
        messageId: inserted.id,
        studentId: input.studentId,
        source: "automatic",
        categories: safety.categories,
        severity: safety.severity,
        summary: safety.reason ?? "A class-chat message was held for safety review."
      }),
      admin.from("TeacherNotification").insert({
        teacherId: classroom.teacherId,
        classId: input.classId,
        title: "Class-chat safety review",
        body: `A learner message was held automatically (${safety.categories.join(", ")}).`,
        audience: "class"
      })
    ]);
    throw new Error(safety.reason ?? "This message was held for safety review.");
  }
  return {
    id: String(inserted.id),
    body: String(inserted.body),
    createdAt: String(inserted.createdAt)
  };
}

export async function reportClassMessage(input: {
  studentId: string;
  classId: string;
  messageId: string;
  reason: "bullying" | "threat" | "sexual_content" | "personal_information" | "spam" | "other";
  details?: string;
  muteSender?: boolean;
}) {
  await assertActiveMember(input.studentId, input.classId);
  const admin = createAdminClient();
  const { data: message, error } = await admin.from("ClassMessage")
    .select("id,senderId,teacherId,moderationCategories")
    .eq("id", input.messageId)
    .eq("classId", input.classId)
    .eq("scope", "class_room")
    .is("deletedAt", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!message || message.senderId === input.studentId) throw new Error("That message cannot be reported.");

  const { error: reportError } = await admin.from("ClassMessageReport").upsert({
    messageId: input.messageId,
    classId: input.classId,
    reportedBy: input.studentId,
    reason: input.reason,
    details: input.details?.trim() ?? "",
    status: "open"
  }, { onConflict: "messageId,reportedBy" });
  if (reportError) throw new Error(reportError.message);
  const { count: senderReportCount } = await admin.from("ClassMessageReport")
    .select("id", { count: "exact", head: true })
    .eq("messageId", input.messageId);

  const categories = [...new Set([input.reason, ...((message.moderationCategories as string[] | null) ?? [])])];
  await Promise.all([
    admin.from("ClassMessageAudit").insert({
      messageId: input.messageId,
      classId: input.classId,
      actorId: input.studentId,
      action: "reported",
      metadata: { reason: input.reason }
    }),
    admin.from("ChildSafetyCase").insert({
      classId: input.classId,
      messageId: input.messageId,
      studentId: message.senderId,
      source: "student_report",
      categories,
      severity: ["threat", "sexual_content"].includes(input.reason) ? "high" : "medium",
      summary: `A learner reported a class-room message for ${input.reason.replaceAll("_", " ")}.`
    }),
    admin.from("TeacherNotification").insert({
      teacherId: message.teacherId,
      classId: input.classId,
      title: (senderReportCount ?? 0) >= 2 ? "Repeated class-chat reports" : "Class-chat message reported",
      body: `A learner reported a message for ${input.reason.replaceAll("_", " ")}. Review it in Class chat safety.`,
      audience: "class"
    }),
    input.muteSender
      ? admin.from("ClassChatMute").upsert({
        classId: input.classId,
        studentId: input.studentId,
        mutedStudentId: message.senderId
      }, { onConflict: "classId,studentId,mutedStudentId" })
      : Promise.resolve()
  ]);
}

export async function getTeacherMessagingData(teacherId: string) {
  const admin = createAdminClient();
  const classes = await listTeacherClasses(teacherId);
  const rosters = await Promise.all(classes.map(async (item) => ({
    classId: item.id,
    className: item.name,
    students: await listClassRoster(teacherId, item.id)
  })));
  const [{ data: messages, error }, { data: notifications, error: notificationError }] = await Promise.all([
    admin.from("ClassMessage")
      .select("id,classId,studentId,body,createdAt,readAt")
      .eq("teacherId", teacherId)
      .order("createdAt", { ascending: false })
      .limit(300),
    admin.from("TeacherNotification")
      .select("id,classId,title,body,createdAt")
      .eq("teacherId", teacherId)
      .order("createdAt", { ascending: false })
      .limit(200)
  ]);
  if (error) throw new Error(error.message);
  if (notificationError) throw new Error(notificationError.message);
  const notificationIds = (notifications ?? []).map((notification) => notification.id as string);
  const { data: notificationRecipients, error: recipientError } = notificationIds.length
    ? await admin.from("TeacherNotificationRecipient")
        .select("notificationId,studentId")
        .in("notificationId", notificationIds)
    : { data: [], error: null };
  if (recipientError) throw new Error(recipientError.message);
  const studentById = new Map(rosters.flatMap((group) => group.students.map((student) => [student.studentId, student])));
  const classById = new Map(classes.map((item) => [item.id, item.name]));
  const firstClassByStudent = new Map(
    rosters.flatMap((group) => group.students.map((student) => [
      student.studentId,
      { id: group.classId, name: group.className }
    ]))
  );
  const notificationById = new Map((notifications ?? []).map((notification) => [notification.id as string, notification]));
  const incoming = (messages ?? []).map((message) => ({
    id: message.id as string,
    classId: message.classId as string,
    className: classById.get(message.classId as string) ?? "Class",
    studentId: message.studentId as string,
    studentName: studentById.get(message.studentId as string)?.displayName ?? "Student",
    title: null,
    body: message.body as string,
    direction: "incoming" as const,
    createdAt: message.createdAt as string,
    readAt: (message.readAt as string | null) ?? null
  }));
  const outgoing = (notificationRecipients ?? []).flatMap((recipient) => {
    const notification = notificationById.get(recipient.notificationId as string);
    if (!notification) return [];
    const fallbackClass = firstClassByStudent.get(recipient.studentId as string);
    const notificationClassId = notification.classId as string | null;
    return [{
      id: `${notification.id as string}:${recipient.studentId as string}`,
      classId: notificationClassId ?? fallbackClass?.id ?? "",
      className: notificationClassId ? classById.get(notificationClassId) ?? "Class" : fallbackClass?.name ?? "Learner",
      studentId: recipient.studentId as string,
      studentName: studentById.get(recipient.studentId as string)?.displayName ?? "Student",
      title: notification.title as string,
      body: notification.body as string,
      direction: "outgoing" as const,
      createdAt: notification.createdAt as string,
      readAt: notification.createdAt as string
    }];
  });
  const unreadIds = incoming.filter((message) => !message.readAt).map((message) => message.id);
  if (unreadIds.length) {
    const { error: readError } = await admin.from("ClassMessage")
      .update({ readAt: new Date().toISOString() })
      .in("id", unreadIds);
    if (readError) throw new Error(readError.message);
  }
  return {
    classes: rosters.map((group) => ({
      id: group.classId,
      name: group.className,
      students: group.students.map((student) => ({ id: student.studentId, name: student.displayName }))
    })),
    messages: [...incoming, ...outgoing].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  };
}

export async function createTeacherNotification(input: {
  teacherId: string;
  audience: "all" | "class" | "selected" | "student";
  classId?: string;
  studentIds?: string[];
  title: string;
  body: string;
}) {
  const data = await getTeacherMessagingData(input.teacherId);
  const allowedAll = new Set(data.classes.flatMap((item) => item.students.map((student) => student.id)));
  const allowedClass = new Set(data.classes.find((item) => item.id === input.classId)?.students.map((student) => student.id) ?? []);
  let recipients: string[] = [];
  if (input.audience === "all") recipients = [...allowedAll];
  else if (input.audience === "class") {
    if (!input.classId || !data.classes.some((item) => item.id === input.classId)) throw new Error("Choose one of your classes.");
    recipients = [...allowedClass];
  } else {
    recipients = [...new Set(input.studentIds ?? [])];
    if (!recipients.length) throw new Error("Choose at least one student.");
    if (recipients.some((id) => !allowedAll.has(id))) throw new Error("You can only notify students in your classes.");
    if (input.audience === "student" && recipients.length !== 1) throw new Error("Choose one student.");
  }
  if (!recipients.length) throw new Error("There are no students in this audience.");
  const admin = createAdminClient();
  const { data: notification, error } = await admin.from("TeacherNotification").insert({
    teacherId: input.teacherId,
    classId: input.audience === "class" ? input.classId : null,
    title: input.title.trim(),
    body: input.body.trim(),
    audience: input.audience
  }).select("id").single();
  if (error) throw new Error(error.message);
  const { error: recipientError } = await admin.from("TeacherNotificationRecipient").insert(
    recipients.map((studentId) => ({ notificationId: notification.id, studentId }))
  );
  if (recipientError) {
    await admin.from("TeacherNotification").delete().eq("id", notification.id);
    throw new Error(recipientError.message);
  }
  return recipients.length;
}

export async function previewJoinClass(code: string) {
  const joinCode = normalizeJoinCode(code);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("TeacherClass")
    .select("id,name,description,gradeLevel,joinCode,teacherId,status")
    .eq("joinCode", joinCode)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No active class was found for that link.");
  const { data: teacher } = await admin.auth.admin.getUserById(data.teacherId as string);
  return {
    id: data.id as string,
    name: data.name as string,
    description: (data.description as string) ?? "",
    gradeLevel: Number(data.gradeLevel),
    joinCode: data.joinCode as string,
    teacherName: displayNameFrom(teacher.user, "Teacher")
  };
}

export async function joinClassByCode(studentId: string, code: string) {
  const preview = await previewJoinClass(code);
  const admin = createAdminClient();
  const { error } = await admin.from("ClassMembership").upsert(
    { classId: preview.id, studentId, status: "active", joinedAt: new Date().toISOString() },
    { onConflict: "classId,studentId" }
  );
  if (error) throw new Error(error.message);
  return preview;
}

export async function listStudentClasses(studentId: string): Promise<StudentClassSummary[]> {
  const admin = createAdminClient();
  const { data: memberships, error } = await admin
    .from("ClassMembership")
    .select("classId,joinedAt")
    .eq("studentId", studentId)
    .eq("status", "active")
    .order("joinedAt", { ascending: false });
  if (error) throw new Error(error.message);
  if (!memberships?.length) return [];

  const classIds = memberships.map((row) => row.classId as string);
  const [{ data: classes }, { data: courses }, { data: quizzes }, { data: advice }] = await Promise.all([
    admin.from("TeacherClass").select("id,name,description,gradeLevel,teacherId,status").in("id", classIds).eq("status", "active"),
    admin.from("ClassCourseAssignment").select("classId").in("classId", classIds),
    admin.from("ClassQuiz").select("id,classId,status,deadline").in("classId", classIds).eq("status", "published"),
    admin.from("ClassAdvice").select("classId,readAt").in("classId", classIds).eq("studentId", studentId)
  ]);

  const now = Date.now();
  const openQuizCount = new Map<string, number>();
  for (const quiz of quizzes ?? []) {
    const deadline = quiz.deadline ? new Date(quiz.deadline as string).getTime() : null;
    if (deadline && deadline < now) continue;
    openQuizCount.set(quiz.classId as string, (openQuizCount.get(quiz.classId as string) ?? 0) + 1);
  }
  const courseCount = new Map<string, number>();
  for (const course of courses ?? []) courseCount.set(course.classId as string, (courseCount.get(course.classId as string) ?? 0) + 1);
  const unreadAdvice = new Map<string, number>();
  for (const item of advice ?? []) {
    if (item.readAt) continue;
    unreadAdvice.set(item.classId as string, (unreadAdvice.get(item.classId as string) ?? 0) + 1);
  }

  const teachers = await Promise.all((classes ?? []).map(async (classroom) => {
    const { data } = await admin.auth.admin.getUserById(classroom.teacherId as string);
    return [classroom.id as string, displayNameFrom(data.user, "Teacher")] as const;
  }));
  const teacherNameByClass = new Map(teachers);

  return (classes ?? []).map((classroom) => {
    const membership = memberships.find((row) => row.classId === classroom.id);
    return {
      id: classroom.id as string,
      name: classroom.name as string,
      description: (classroom.description as string) ?? "",
      gradeLevel: Number(classroom.gradeLevel),
      teacherName: teacherNameByClass.get(classroom.id as string) ?? "Teacher",
      joinedAt: (membership?.joinedAt as string) ?? new Date().toISOString(),
      courseCount: courseCount.get(classroom.id as string) ?? 0,
      openQuizCount: openQuizCount.get(classroom.id as string) ?? 0,
      unreadAdviceCount: unreadAdvice.get(classroom.id as string) ?? 0
    };
  });
}

export async function getStudentDashboardActivity(studentId: string): Promise<StudentDashboardActivity> {
  const classes = await listStudentClasses(studentId);
  if (!classes.length) return { classes: [], quizzes: [], subjects: [] };

  const admin = createAdminClient();
  const classIds = classes.map((classroom) => classroom.id);
  const classNameById = new Map(classes.map((classroom) => [classroom.id, classroom.name]));
  const [{ data: assignments, error: assignmentError }, { data: quizRows, error: quizError }] = await Promise.all([
    admin.from("ClassCourseAssignment").select("id,classId,courseId,note,assignedAt").in("classId", classIds).order("assignedAt", { ascending: false }),
    admin.from("ClassQuiz").select("id,classId,title,questions,startAt,deadline,baseXpReward,maxAttempts,status,createdAt").in("classId", classIds).eq("status", "published").order("createdAt", { ascending: false })
  ]);
  if (assignmentError) throw new Error(assignmentError.message);
  if (quizError) throw new Error(quizError.message);

  const courseIds = [...new Set((assignments ?? []).map((row) => row.courseId as string))];
  const quizIds = (quizRows ?? []).map((row) => row.id as string);
  const [{ data: subjectRows, error: subjectError }, { data: attemptRows, error: attemptError }] = await Promise.all([
    courseIds.length
      ? admin.from("Subject").select("id,name,slug,visibility").in("id", courseIds)
      : Promise.resolve({ data: [], error: null }),
    quizIds.length
      ? admin.from("ClassQuizAttempt").select("quizId").eq("studentId", studentId).in("quizId", quizIds)
      : Promise.resolve({ data: [], error: null })
  ]);
  if (subjectError) throw new Error(subjectError.message);
  if (attemptError) throw new Error(attemptError.message);

  const subjectById = new Map((subjectRows ?? []).map((subject) => [subject.id as string, subject]));
  const attemptsByQuiz = new Map<string, number>();
  for (const attempt of attemptRows ?? []) {
    const quizId = attempt.quizId as string;
    attemptsByQuiz.set(quizId, (attemptsByQuiz.get(quizId) ?? 0) + 1);
  }

  const now = Date.now();
  const quizzes: StudentDashboardActivity["quizzes"] = (quizRows ?? [])
    .filter((row) => !row.deadline || new Date(row.deadline as string).getTime() > now)
    .map((row) => {
      const startAt = (row.startAt as string | null) ?? null;
      const attemptsUsed = attemptsByQuiz.get(row.id as string) ?? 0;
      const maxAttempts = Number(row.maxAttempts ?? 3);
      const upcoming = Boolean(startAt && new Date(startAt).getTime() > now);
      return {
        id: row.id as string,
        classId: row.classId as string,
        className: classNameById.get(row.classId as string) ?? "Class",
        title: row.title as string,
        questionCount: Array.isArray(row.questions) ? row.questions.length : 0,
        startAt,
        deadline: (row.deadline as string | null) ?? null,
        baseXpReward: Number(row.baseXpReward ?? 0),
        attemptsUsed,
        maxAttempts,
        state: upcoming ? "upcoming" as const : attemptsUsed >= maxAttempts ? "completed" as const : "open" as const
      };
    })
    .sort((first, second) => {
      const priority = { open: 0, upcoming: 1, completed: 2 };
      const stateOrder = priority[first.state] - priority[second.state];
      if (stateOrder) return stateOrder;
      const firstTime = first.deadline ? new Date(first.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      const secondTime = second.deadline ? new Date(second.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      return firstTime - secondTime;
    });

  const subjects: StudentDashboardActivity["subjects"] = (assignments ?? []).map((row) => {
    const subject = subjectById.get(row.courseId as string);
    return {
      id: row.id as string,
      classId: row.classId as string,
      className: classNameById.get(row.classId as string) ?? "Class",
      courseId: row.courseId as string,
      courseName: (subject?.name as string) ?? "Subject",
      courseSlug: (subject?.slug as string) ?? "",
      note: (row.note as string) ?? "",
      assignedAt: row.assignedAt as string,
      isClassOnly: courseVisibility(subject?.visibility) === "class"
    };
  });

  return { classes, quizzes, subjects };
}

export async function getStudentClassDetail(studentId: string, classId: string) {
  await assertActiveMember(studentId, classId);
  const admin = createAdminClient();
  const { data: classroom, error } = await admin
    .from("TeacherClass")
    .select("id,name,description,gradeLevel,teacherId")
    .eq("id", classId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!classroom) throw new Error("Class not found.");

  const { data: teacher } = await admin.auth.admin.getUserById(classroom.teacherId as string);
  const [{ data: courses }, { data: quizzes }, { data: attempts }, { data: adviceRows }, { data: deductionRows }, { data: messageRows }, { data: chatSetting }, { data: chatConsent }, { data: mutedRows }, leaderboard] = await Promise.all([
    admin.from("ClassCourseAssignment").select("id,courseId,note,assignedAt").eq("classId", classId),
    admin.from("ClassQuiz").select("id,classId,title,description,questions,startAt,deadline,offPlatformReward,baseXpReward,passingScore,maxAttempts,status,createdAt").eq("classId", classId).in("status", ["published", "closed"]).order("createdAt", { ascending: false }),
    admin.from("ClassQuizAttempt").select("quizId,attemptNumber,scorePercentage,passed,starsAwarded,xpAwarded,submittedAt").eq("studentId", studentId).order("attemptNumber", { ascending: true }),
    admin.from("ClassAdvice").select("id,classId,message,suggestionType,createdAt,readAt,teacherId,title,feedbackCategory,priority,recommendedActions,evidenceSnapshot,followUpStatus,dueAt,acknowledgedAt,resolvedAt,resolutionNote").eq("classId", classId).eq("studentId", studentId).order("createdAt", { ascending: false }),
    admin.from("PointDeduction").select("id,classId,amount,reason,balanceBefore,balanceAfter,status,createdAt,teacherId").eq("classId", classId).eq("studentId", studentId).order("createdAt", { ascending: false }),
    admin.from("ClassMessage").select("id,body,createdAt,senderId,senderRole,kind,editedAt").eq("classId", classId).eq("scope", "class_room").eq("moderationStatus", "allowed").is("deletedAt", null).order("createdAt", { ascending: true }).limit(500),
    admin.from("ClassChatSetting").select("enabled,locked,postingStartsAt,postingEndsAt,timezone,guardianConsentRequired,rulesVersion").eq("classId", classId).maybeSingle(),
    admin.from("ClassChatConsent").select("active,guardianConfirmedAt,rulesAcceptedAt,rulesVersion").eq("classId", classId).eq("studentId", studentId).maybeSingle(),
    admin.from("ClassChatMute").select("mutedStudentId").eq("classId", classId).eq("studentId", studentId),
    getClassLeaderboard(classId, studentId)
  ]);
  const mutedIds = new Set((mutedRows ?? []).map((row) => row.mutedStudentId as string));
  const visibleMessageRows = (messageRows ?? []).filter((row) => !mutedIds.has(row.senderId as string));
  const senderIds = [...new Set(visibleMessageRows.map((row) => row.senderId as string))];
  const senderUsers = await Promise.all(senderIds.map(async (id) => (await admin.auth.admin.getUserById(id)).data.user));
  const senderNameById = new Map(senderUsers.filter(Boolean).map((user) => [user!.id, displayNameFrom(user!, "Learner")]));
  const consentReady = chatSetting?.guardianConsentRequired === false || Boolean(
    chatConsent?.active
    && chatConsent.guardianConfirmedAt
    && chatConsent.rulesAcceptedAt
    && chatConsent.rulesVersion === chatSetting?.rulesVersion
  );
  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: (chatSetting?.timezone as string) || "Africa/Accra",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());
  const withinHours = !chatSetting?.postingStartsAt || !chatSetting?.postingEndsAt
    || (localTime >= chatSetting.postingStartsAt && localTime <= chatSetting.postingEndsAt);
  const { data: receiptRows } = await admin
    .from("TeacherNotificationRecipient")
    .select("notificationId,readAt")
    .eq("studentId", studentId);
  const notificationIds = (receiptRows ?? []).map((row) => row.notificationId as string);
  const { data: notificationRows } = notificationIds.length
    ? await admin.from("TeacherNotification").select("id,teacherId,classId,title,body,audience,createdAt").in("id", notificationIds).eq("teacherId", classroom.teacherId)
    : { data: [] };
  const deductionIds = (deductionRows ?? []).map((row) => row.id as string);
  const { data: disputeRows } = deductionIds.length
    ? await admin.from("PointDeductionDispute").select("id,deductionId,message,status,createdAt,resolutionNote").in("deductionId", deductionIds)
    : { data: [] };
  const disputeByDeduction = new Map((disputeRows ?? []).map((row) => [row.deductionId as string, row]));

  const courseIds = (courses ?? []).map((row) => row.courseId as string);
  const [{ data: subjects }, { data: courseUnits }, { data: courseLessons }] = courseIds.length
    ? await Promise.all([
      admin.from("Subject").select("id,name,slug,description,colourToken,coverUrl,gradeLevels,visibility,ownerClassId").in("id", courseIds),
      admin.from("Unit").select("id,subjectId").in("subjectId", courseIds),
      admin.from("AdminLessonRecord").select("id,courseId,status").in("courseId", courseIds).eq("status", "published")
    ])
    : [
      { data: [] as Array<{ id: string; name: string; slug: string; description?: string; colourToken?: string; coverUrl?: string | null; gradeLevels?: number[]; visibility?: string; ownerClassId?: string | null }> },
      { data: [] as Array<{ id: string; subjectId: string }> },
      { data: [] as Array<{ id: string; courseId: string; status: string }> }
    ];
  const subjectById = new Map((subjects ?? []).map((subject) => [subject.id as string, subject]));
  const moduleCountByCourse = new Map<string, number>();
  for (const unit of courseUnits ?? []) {
    const courseId = String(unit.subjectId);
    moduleCountByCourse.set(courseId, (moduleCountByCourse.get(courseId) ?? 0) + 1);
  }
  const lessonCountByCourse = new Map<string, number>();
  for (const lesson of courseLessons ?? []) {
    const courseId = String(lesson.courseId);
    lessonCountByCourse.set(courseId, (lessonCountByCourse.get(courseId) ?? 0) + 1);
  }

  const attemptsByQuiz = new Map<string, ClassQuizAttemptSummary[]>();
  for (const attempt of attempts ?? []) {
    const quizId = attempt.quizId as string;
    const list = attemptsByQuiz.get(quizId) ?? [];
    list.push(mapAttemptSummary({
      attemptNumber: attempt.attemptNumber as number | null,
      scorePercentage: Number(attempt.scorePercentage),
      passed: Boolean(attempt.passed),
      starsAwarded: Number(attempt.starsAwarded),
      xpAwarded: Number(attempt.xpAwarded),
      submittedAt: attempt.submittedAt as string
    }));
    attemptsByQuiz.set(quizId, list);
  }

  return {
    classroom: {
      id: classroom.id as string,
      name: classroom.name as string,
      description: (classroom.description as string) ?? "",
      gradeLevel: Number(classroom.gradeLevel),
      teacherName: displayNameFrom(teacher.user, "Teacher")
    },
    pastQuizCount: (quizzes ?? []).filter((row) =>
      row.status === "closed"
      || (row.status === "published" && row.deadline && new Date(row.deadline as string).getTime() <= Date.now())
    ).length,
    courses: (courses ?? []).map((row) => {
      const subject = subjectById.get(row.courseId as string);
      const visibility = courseVisibility(subject?.visibility);
      return {
        id: row.id as string,
        courseId: row.courseId as string,
        courseName: subject?.name ?? "Course",
        courseSlug: subject?.slug ?? "",
        description: (subject?.description as string) ?? "",
        colourToken: (subject?.colourToken as string) ?? "",
        coverUrl: (subject?.coverUrl as string | null) ?? null,
        gradeLevels: Array.isArray(subject?.gradeLevels) ? subject.gradeLevels.map(Number) : [],
        moduleCount: moduleCountByCourse.get(row.courseId as string) ?? 0,
        lessonCount: lessonCountByCourse.get(row.courseId as string) ?? 0,
        note: (row.note as string) ?? "",
        assignedAt: row.assignedAt as string,
        visibility,
        isClassOnly: visibility === "class"
      };
    }),
    quizzes: (quizzes ?? []).filter((row) =>
      row.status === "published"
      && (!row.deadline || new Date(row.deadline as string).getTime() > Date.now())
    ).map((row) => {
      const quizAttempts = attemptsByQuiz.get(row.id as string) ?? [];
      const bestAttempt = bestAttemptFrom(quizAttempts);
      const maxAttempts = Number(row.maxAttempts ?? 3);
      const attemptsUsed = quizAttempts.length;
      const status = row.status as QuizStatus;
      const startAt = (row.startAt as string | null) ?? null;
      const deadline = (row.deadline as string | null) ?? null;
      return {
        id: row.id as string,
        classId: row.classId as string,
        title: row.title as string,
        description: (row.description as string) ?? "",
        questionCount: Array.isArray(row.questions) ? row.questions.length : 0,
        startAt,
        deadline,
        offPlatformReward: (row.offPlatformReward as string) ?? "",
        baseXpReward: Number(row.baseXpReward),
        passingScore: Number(row.passingScore),
        maxAttempts,
        status,
        attemptsUsed,
        canRetake: canRetakeQuiz({ status, startAt, deadline, attemptsUsed, maxAttempts }),
        bestAttempt,
        attempts: quizAttempts,
        attempt: bestAttempt
          ? {
              scorePercentage: bestAttempt.scorePercentage,
              passed: bestAttempt.passed,
              starsAwarded: bestAttempt.starsAwarded,
              xpAwarded: bestAttempt.xpAwarded,
              submittedAt: bestAttempt.submittedAt
            }
          : null
      };
    }),
    advice: (adviceRows ?? []).map((row) => ({
      id: row.id as string,
      classId: row.classId as string,
      className: classroom.name as string,
      message: row.message as string,
      suggestionType: row.suggestionType as AdviceSuggestionType,
      createdAt: row.createdAt as string,
      readAt: (row.readAt as string | null) ?? null,
      teacherName: displayNameFrom(teacher.user, "Teacher"),
      title: (row.title as string | null) ?? null,
      feedbackCategory: (row.feedbackCategory as ClassAdviceView["feedbackCategory"]) ?? null,
      priority: (row.priority as ClassAdviceView["priority"]) ?? null,
      recommendedActions: Array.isArray(row.recommendedActions) ? row.recommendedActions as Array<{ label: string; href?: string }> : [],
      evidenceSnapshot: (row.evidenceSnapshot ?? {}) as Record<string, unknown>,
      followUpStatus: (row.followUpStatus as ClassAdviceView["followUpStatus"]) ?? "not_required",
      dueAt: (row.dueAt as string | null) ?? null,
      acknowledgedAt: (row.acknowledgedAt as string | null) ?? null,
      resolvedAt: (row.resolvedAt as string | null) ?? null,
      resolutionNote: (row.resolutionNote as string | null) ?? null
    })),
    deductions: (deductionRows ?? []).map((row): PointDeductionView => {
      const dispute = disputeByDeduction.get(row.id as string);
      return {
        id: row.id as string,
        classId: row.classId as string,
        amount: Number(row.amount),
        reason: row.reason as string,
        balanceBefore: Number(row.balanceBefore),
        balanceAfter: Number(row.balanceAfter),
        status: row.status as PointDeductionView["status"],
        createdAt: row.createdAt as string,
        teacherName: displayNameFrom(teacher.user, "Teacher"),
        dispute: dispute ? {
          id: dispute.id as string,
          message: dispute.message as string,
          status: dispute.status as "open" | "upheld" | "reversed",
          createdAt: dispute.createdAt as string,
          resolutionNote: (dispute.resolutionNote as string | null) ?? null
        } : null
      };
    }),
    messages: visibleMessageRows.map((row) => ({
      id: row.id as string,
      body: row.body as string,
      createdAt: row.createdAt as string,
      fromStudent: row.senderId === studentId,
      senderId: row.senderId as string,
      senderName: row.senderId === studentId ? "You" : (senderNameById.get(row.senderId as string) ?? (row.senderRole === "teacher" ? "Teacher" : "Learner")),
      senderRole: row.senderRole as "student" | "teacher" | "admin",
      kind: row.kind as "discussion" | "announcement",
      editedAt: (row.editedAt as string | null) ?? null
    })),
    chat: {
      enabled: chatSetting?.enabled !== false,
      locked: Boolean(chatSetting?.locked),
      postingStartsAt: (chatSetting?.postingStartsAt as string | null) ?? null,
      postingEndsAt: (chatSetting?.postingEndsAt as string | null) ?? null,
      timezone: (chatSetting?.timezone as string) || "Africa/Accra",
      guardianConsentRequired: chatSetting?.guardianConsentRequired !== false,
      consentReady,
      withinHours,
      canPost: chatSetting?.enabled !== false && !chatSetting?.locked && consentReady && withinHours,
      rules: childFriendlyChatRules
    },
    notifications: (notificationRows ?? [])
      .filter((row) => row.classId == null || row.classId === classId)
      .map((row) => ({
        id: row.id as string,
        title: row.title as string,
        body: row.body as string,
        audience: row.audience as string,
        createdAt: row.createdAt as string
      })),
    leaderboard
  };
}

export async function disputePointDeduction(input: { studentId: string; deductionId: string; message: string }) {
  const admin = createAdminClient();
  const { data: deduction, error } = await admin
    .from("PointDeduction")
    .select("id,studentId,status")
    .eq("id", input.deductionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!deduction || deduction.studentId !== input.studentId) throw new Error("Deduction not found.");
  if (deduction.status === "reversed") throw new Error("This deduction has already been reversed.");
  const { error: insertError } = await admin.from("PointDeductionDispute").insert({
    deductionId: input.deductionId,
    studentId: input.studentId,
    message: input.message.trim()
  });
  if (insertError?.code === "23505") throw new Error("You have already reported this deduction.");
  if (insertError) throw new Error(insertError.message);
}

export async function listPointDeductionDisputes() {
  const admin = createAdminClient();
  const { data: disputes, error } = await admin
    .from("PointDeductionDispute")
    .select("id,deductionId,studentId,message,status,createdAt,resolvedAt,resolutionNote")
    .order("createdAt", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  const deductionIds = (disputes ?? []).map((item) => item.deductionId as string);
  const { data: deductions } = deductionIds.length
    ? await admin.from("PointDeduction").select("id,classId,teacherId,studentId,amount,reason,balanceBefore,balanceAfter,createdAt").in("id", deductionIds)
    : { data: [] };
  const classIds = [...new Set((deductions ?? []).map((item) => item.classId as string))];
  const { data: classes } = classIds.length
    ? await admin.from("TeacherClass").select("id,name").in("id", classIds)
    : { data: [] };
  const deductionById = new Map((deductions ?? []).map((item) => [item.id as string, item]));
  const classById = new Map((classes ?? []).map((item) => [item.id as string, item.name as string]));
  const userIds = [...new Set((deductions ?? []).flatMap((item) => [item.studentId as string, item.teacherId as string]))];
  const users = await Promise.all(userIds.map(async (id) => (await admin.auth.admin.getUserById(id)).data.user));
  const nameById = new Map(users.filter(Boolean).map((user) => [user!.id, displayNameFrom(user)]));
  return (disputes ?? []).map((dispute) => {
    const deduction = deductionById.get(dispute.deductionId as string);
    return {
      id: dispute.id as string,
      status: dispute.status as string,
      message: dispute.message as string,
      createdAt: dispute.createdAt as string,
      resolvedAt: (dispute.resolvedAt as string | null) ?? null,
      resolutionNote: (dispute.resolutionNote as string | null) ?? null,
      amount: Number(deduction?.amount ?? 0),
      reason: (deduction?.reason as string) ?? "",
      balanceBefore: Number(deduction?.balanceBefore ?? 0),
      balanceAfter: Number(deduction?.balanceAfter ?? 0),
      className: classById.get(deduction?.classId as string) ?? "Class",
      studentName: nameById.get(deduction?.studentId as string) ?? "Student",
      teacherName: nameById.get(deduction?.teacherId as string) ?? "Teacher"
    };
  });
}

export async function resolvePointDeductionDispute(input: {
  adminId: string;
  disputeId: string;
  resolution: "upheld" | "reversed";
  note: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("resolve_point_deduction_dispute", {
    p_admin_id: input.adminId,
    p_dispute_id: input.disputeId,
    p_resolution: input.resolution,
    p_note: input.note
  });
  if (error) throw new Error(error.message);
}

export async function getStudentQuizForAttempt(studentId: string, classId: string, quizId: string) {
  await assertActiveMember(studentId, classId);
  const admin = createAdminClient();
  const { data: quiz, error } = await admin
    .from("ClassQuiz")
    .select("id,classId,title,description,questions,startAt,deadline,offPlatformReward,baseXpReward,passingScore,maxAttempts,status")
    .eq("id", quizId)
    .eq("classId", classId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!quiz || quiz.status === "draft") throw new Error("Quiz not found.");
  if (quiz.status === "closed") throw new Error("Quiz Ended");
  const startAt = (quiz.startAt as string | null) ?? null;
  const deadline = (quiz.deadline as string | null) ?? null;
  if (startAt && new Date(startAt).getTime() > Date.now()) throw new Error(`Quiz Not Started. It opens ${new Date(startAt).toLocaleString()}.`);
  if (deadline && new Date(deadline).getTime() <= Date.now()) throw new Error("Quiz Ended");
  const { data: attemptRows } = await admin
    .from("ClassQuizAttempt")
    .select("attemptNumber,scorePercentage,passed,starsAwarded,xpAwarded,submittedAt")
    .eq("quizId", quizId)
    .eq("studentId", studentId)
    .order("attemptNumber", { ascending: true });

  const attempts = (attemptRows ?? []).map((row) => mapAttemptSummary({
    attemptNumber: row.attemptNumber as number | null,
    scorePercentage: Number(row.scorePercentage),
    passed: Boolean(row.passed),
    starsAwarded: Number(row.starsAwarded),
    xpAwarded: Number(row.xpAwarded),
    submittedAt: row.submittedAt as string
  }));
  const bestAttempt = bestAttemptFrom(attempts);
  const maxAttempts = Number(quiz.maxAttempts ?? 3);
  const attemptsUsed = attempts.length;
  const status = quiz.status as QuizStatus;
  const canRetake = canRetakeQuiz({ status, startAt, deadline, attemptsUsed, maxAttempts });

  const questions = ((quiz.questions as ClassQuizQuestion[]) ?? []).map(({ correctIndex: _correctIndex, ...question }) => question);
  return {
    quiz: {
      id: quiz.id as string,
      classId: quiz.classId as string,
      title: quiz.title as string,
      description: (quiz.description as string) ?? "",
      startAt,
      deadline,
      offPlatformReward: (quiz.offPlatformReward as string) ?? "",
      baseXpReward: Number(quiz.baseXpReward),
      passingScore: Number(quiz.passingScore),
      maxAttempts,
      status,
      questions
    },
    attempts,
    bestAttempt,
    attemptsUsed,
    canRetake,
    attempt: bestAttempt
      ? {
          scorePercentage: bestAttempt.scorePercentage,
          passed: bestAttempt.passed,
          starsAwarded: bestAttempt.starsAwarded,
          xpAwarded: bestAttempt.xpAwarded,
          submittedAt: bestAttempt.submittedAt
        }
      : null
  };
}

function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayDifference(from: string, to: string) {
  return Math.round((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86400000);
}

export async function submitClassQuiz(input: {
  studentId: string;
  classId: string;
  quizId: string;
  answers: Array<{ questionId: string; selectedIndex: number }>;
}) {
  await assertActiveMember(input.studentId, input.classId);
  const admin = createAdminClient();
  const { data: quiz, error } = await admin
    .from("ClassQuiz")
    .select("id,questions,startAt,deadline,offPlatformReward,baseXpReward,passingScore,maxAttempts,status,title")
    .eq("id", input.quizId)
    .eq("classId", input.classId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!quiz || quiz.status !== "published") throw new Error("This quiz is not open for attempts.");
  if (quiz.startAt && new Date(quiz.startAt as string).getTime() > Date.now()) {
    throw new Error("This quiz has not started yet.");
  }
  if (quiz.deadline && new Date(quiz.deadline as string).getTime() <= Date.now()) {
    throw new Error("Quiz Ended");
  }

  const maxAttempts = Number(quiz.maxAttempts ?? 3);
  const { data: priorAttempts } = await admin
    .from("ClassQuizAttempt")
    .select("attemptNumber,scorePercentage,starsAwarded,xpAwarded")
    .eq("quizId", input.quizId)
    .eq("studentId", input.studentId)
    .order("attemptNumber", { ascending: true });
  const attemptsUsed = priorAttempts?.length ?? 0;
  if (attemptsUsed >= maxAttempts) throw new Error("You have used all attempts for this quiz.");

  const questions = (quiz.questions as ClassQuizQuestion[]) ?? [];
  const answerMap = new Map(input.answers.map((answer) => [answer.questionId, answer.selectedIndex]));
  let correct = 0;
  const graded = questions.map((question) => {
    const selectedIndex = answerMap.get(question.id) ?? -1;
    const isCorrect = selectedIndex === question.correctIndex;
    if (isCorrect) correct += 1;
    return { questionId: question.id, selectedIndex, correct: isCorrect };
  });
  const scorePercentage = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  const passingScore = Number(quiz.passingScore);
  const baseXp = Number(quiz.baseXpReward);
  const passed = scorePercentage >= passingScore;
  const potentialStars = calculateStars(true, scorePercentage);
  const potentialXp = quizPotentialXp(baseXp, scorePercentage, passingScore);
  const bestPriorPotential = (priorAttempts ?? []).reduce(
    (max, attempt) => Math.max(max, quizPotentialXp(baseXp, Number(attempt.scorePercentage), passingScore)),
    0
  );
  const bestPriorStars = (priorAttempts ?? []).reduce(
    (max, attempt) => Math.max(max, calculateStars(true, Number(attempt.scorePercentage))),
    0
  );
  const xpAwarded = Math.max(0, potentialXp - bestPriorPotential);
  const starsAwarded = Math.max(0, potentialStars - bestPriorStars);
  const attemptNumber = attemptsUsed + 1;

  const { error: attemptError } = await admin.from("ClassQuizAttempt").insert({
    quizId: input.quizId,
    studentId: input.studentId,
    attemptNumber,
    answers: graded,
    scorePercentage,
    starsAwarded,
    xpAwarded,
    passed
  });
  if (attemptError) throw new Error(attemptError.message);

  const nextAttemptsUsed = attemptsUsed + 1;
  const bestScore = Math.max(
    scorePercentage,
    ...(priorAttempts ?? []).map((attempt) => Number(attempt.scorePercentage))
  );
  const canRetake = canRetakeQuiz({
    status: "published",
    startAt: (quiz.startAt as string | null) ?? null,
    deadline: (quiz.deadline as string | null) ?? null,
    attemptsUsed: nextAttemptsUsed,
    maxAttempts
  });
  const review = passed || !canRetake ? questions.map((question) => ({
    questionId: question.id,
    prompt: question.prompt,
    correctIndex: question.correctIndex,
    correctAnswer: question.options[question.correctIndex],
    explanation: question.explanation ?? ""
  })) : undefined;

  if (xpAwarded > 0 || starsAwarded > 0) {
    const { data: gameRow } = await admin.from("StudentGameState").select("state").eq("userId", input.studentId).maybeSingle();
    const state = {
      xp: 0,
      avatarPoints: 0,
      stars: 0,
      streak: 0,
      completedLessonIds: [] as string[],
      completedVideoPromptIds: [] as string[],
      claimedDailyReward: null as string | null,
      surpriseCount: 0,
      lastReward: null as null | { title: string; detail: string; xp: number; stars: number },
      dailyLearningDate: null as string | null,
      dailyLearningXp: 0,
      lastStreakDate: null as string | null,
      quizRecords: {} as Record<string, unknown>,
      history: [] as Array<Record<string, unknown>>,
      unlockedAvatarAssetIds: [] as string[],
      ...((gameRow?.state as Record<string, unknown> | undefined) ?? {})
    };

    const today = localDate();
    const dailyXp = state.dailyLearningDate === today ? Number(state.dailyLearningXp) + xpAwarded : xpAwarded;
    let streak = Number(state.streak);
    let lastStreakDate = state.lastStreakDate as string | null;
    if (dailyXp >= 30 && lastStreakDate !== today) {
      streak = lastStreakDate && dayDifference(lastStreakDate, today) === 1 ? streak + 1 : 1;
      lastStreakDate = today;
    }

    const nextXp = Number(state.xp) + xpAwarded;
    const rewardEventId = `history-class-quiz-${input.quizId}-${attemptNumber}`;
    const rewardCreatedAt = new Date().toISOString();
    const rewardTitle = passed ? "Class quiz passed!" : "Class quiz reward earned!";
    const rewardDetail = passed
      ? `You scored ${scorePercentage}% on ${quiz.title as string}.`
      : `Your practice on ${quiz.title as string} earned a new reward.`;
    const nextState = {
      ...state,
      xp: nextXp,
      avatarPoints: Number(state.avatarPoints) + xpAwarded,
      stars: Number(state.stars) + starsAwarded,
      streak,
      lastStreakDate,
      dailyLearningDate: today,
      dailyLearningXp: dailyXp,
      lastReward: {
        title: rewardTitle,
        detail: `You scored ${scorePercentage}% on ${quiz.title as string}. These points count on the whole platform.`,
        xp: xpAwarded,
        stars: starsAwarded
      },
      history: [
        {
          id: rewardEventId,
          type: "quiz",
          title: passed ? "Passed a class quiz" : "Finished a class quiz",
          detail: `${quiz.title as string} · ${scorePercentage}% · counts toward platform XP`,
          xp: xpAwarded,
          stars: starsAwarded,
          rank: 1,
          createdAt: rewardCreatedAt
        },
        ...(Array.isArray(state.history) ? state.history : [])
      ]
    };

    const { error: gameError } = await admin
      .from("StudentGameState")
      .upsert({ userId: input.studentId, state: nextState }, { onConflict: "userId" });
    if (gameError) throw new Error(gameError.message);

    // Keep the normalized Student cache in sync so platform leaderboards stay accurate.
    await admin.from("Student").update({
      totalXpCache: nextXp,
      currentStreakDays: streak,
      currentLevelCache: calculateLevel(nextXp),
      updatedAt: new Date().toISOString()
    }).eq("id", input.studentId);

    return {
      scorePercentage,
      passed,
      starsAwarded,
      xpAwarded,
      attemptNumber,
      attemptsUsed: nextAttemptsUsed,
      maxAttempts,
      canRetake,
      bestScore,
      gameState: nextState,
      appliesToPlatform: true as const,
      celebration: {
        id: rewardEventId,
        source: "class_quiz" as const,
        title: rewardTitle,
        detail: rewardDetail,
        xp: xpAwarded,
        stars: starsAwarded,
        createdAt: rewardCreatedAt
      },
      review
    };
  }

  return {
    scorePercentage,
    passed,
    starsAwarded,
    xpAwarded,
    attemptNumber,
    attemptsUsed: nextAttemptsUsed,
    maxAttempts,
    canRetake,
    bestScore,
    appliesToPlatform: true as const
    ,review
  };
}

export async function markAdviceRead(studentId: string, adviceId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("ClassAdvice")
    .update({ readAt: new Date().toISOString() })
    .eq("id", adviceId)
    .eq("studentId", studentId)
    .is("readAt", null);
  if (error) throw new Error(error.message);
}

export async function acknowledgeAdvice(studentId: string, adviceId: string) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("ClassAdvice")
    .update({ followUpStatus: "acknowledged", acknowledgedAt: now, readAt: now })
    .eq("id", adviceId)
    .eq("studentId", studentId)
    .eq("followUpStatus", "open")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This feedback cannot be acknowledged.");
}

export async function listStudentAdvice(studentId: string): Promise<ClassAdviceView[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ClassAdvice")
    .select("id,classId,message,suggestionType,createdAt,readAt,teacherId,title,feedbackCategory,priority,recommendedActions,evidenceSnapshot,followUpStatus,dueAt,acknowledgedAt,resolvedAt,resolutionNote")
    .eq("studentId", studentId)
    .order("createdAt", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  if (!data?.length) return [];
  const classIds = [...new Set(data.map((row) => row.classId as string))];
  const { data: classes } = await admin.from("TeacherClass").select("id,name").in("id", classIds);
  const classNameById = new Map((classes ?? []).map((row) => [row.id as string, row.name as string]));
  const teachers = await Promise.all(
    [...new Set(data.map((row) => row.teacherId as string))].map(async (teacherId) => {
      const { data: teacher } = await admin.auth.admin.getUserById(teacherId);
      return [teacherId, displayNameFrom(teacher.user, "Teacher")] as const;
    })
  );
  const teacherNameById = new Map(teachers);
  return data.map((row) => ({
    id: row.id as string,
    classId: row.classId as string,
    className: classNameById.get(row.classId as string) ?? "Class",
    message: row.message as string,
    suggestionType: row.suggestionType as AdviceSuggestionType,
    createdAt: row.createdAt as string,
    readAt: (row.readAt as string | null) ?? null,
    teacherName: teacherNameById.get(row.teacherId as string) ?? "Teacher",
    title: (row.title as string | null) ?? null,
    feedbackCategory: (row.feedbackCategory as ClassAdviceView["feedbackCategory"]) ?? null,
    priority: (row.priority as ClassAdviceView["priority"]) ?? null,
    recommendedActions: Array.isArray(row.recommendedActions) ? row.recommendedActions as Array<{ label: string; href?: string }> : [],
    evidenceSnapshot: (row.evidenceSnapshot ?? {}) as Record<string, unknown>,
    followUpStatus: (row.followUpStatus as ClassAdviceView["followUpStatus"]) ?? "not_required",
    dueAt: (row.dueAt as string | null) ?? null,
    acknowledgedAt: (row.acknowledgedAt as string | null) ?? null,
    resolvedAt: (row.resolvedAt as string | null) ?? null,
    resolutionNote: (row.resolutionNote as string | null) ?? null
  }));
}
