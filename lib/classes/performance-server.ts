import { createAdminClient } from "@/lib/supabase/admin";
import { listClassRoster } from "@/lib/classes/classroom-server";
import type {
  ClassAdviceView,
  ClassPerformanceData,
  PerformanceAttempt,
  PerformanceBreakdown,
  PerformanceMetric,
  PerformanceRange
} from "@/lib/classes/types";

type Event = {
  id: string;
  itemId: string;
  studentId: string;
  kind: "class_quiz" | "lesson";
  title: string;
  courseId: string | null;
  subject: string;
  unitId: string | null;
  strand: string;
  topicId: string | null;
  substrand: string;
  score: number;
  passed: boolean;
  xp: number;
  attemptNumber: number;
  at: string;
};

const completeStatuses = new Set(["COMPLETED", "MASTERED", "completed", "mastered"]);

export async function getTeacherClassPerformance(input: {
  teacherId: string;
  classId: string;
  range: PerformanceRange;
  metric: PerformanceMetric;
  subjectId?: string;
  strandId?: string;
}): Promise<ClassPerformanceData> {
  const admin = createAdminClient();
  const { data: classroom, error: classError } = await admin
    .from("TeacherClass")
    .select("id,name,teacherId,createdAt")
    .eq("id", input.classId)
    .eq("teacherId", input.teacherId)
    .maybeSingle();
  if (classError) throw new Error(classError.message);
  if (!classroom) throw new Error("Class not found or you do not own it.");

  const roster = await listClassRoster(input.teacherId, input.classId);
  const studentIds = roster.map((item) => item.studentId);
  const now = new Date();
  const requestedStart = input.range === "30d"
    ? new Date(now.getTime() - 29 * 86400000)
    : input.range === "90d"
      ? new Date(now.getTime() - 89 * 86400000)
      : new Date(classroom.createdAt as string);
  const rangeStart = requestedStart > now ? now : requestedStart;

  const [{ data: assignments }, { data: quizRows }, { data: gameRows }] = await Promise.all([
    admin.from("ClassCourseAssignment").select("courseId").eq("classId", input.classId),
    admin.from("ClassQuiz").select("id,title,passingScore").eq("classId", input.classId),
    studentIds.length
      ? admin.from("StudentGameState").select("userId,state").in("userId", studentIds)
      : Promise.resolve({ data: [] })
  ]);
  const courseIds = (assignments ?? []).map((row) => String(row.courseId));
  const quizIds = (quizRows ?? []).map((row) => String(row.id));

  const [{ data: subjectRows }, { data: unitRows }, { data: topicRows }, { data: lessonRows }] = courseIds.length
    ? await Promise.all([
      admin.from("Subject").select("id,name").in("id", courseIds),
      admin.from("Unit").select("id,subjectId,name").in("subjectId", courseIds),
      admin.from("Topic").select("id,unitId,name"),
      admin.from("AdminLessonRecord").select("id,courseId,unitId,topicId,record").in("courseId", courseIds).eq("status", "published")
    ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];
  const subjectById = new Map((subjectRows ?? []).map((row) => [String(row.id), String(row.name)]));
  const unitById = new Map((unitRows ?? []).map((row) => [String(row.id), row]));
  const allowedUnitIds = new Set((unitRows ?? []).map((row) => String(row.id)));
  const topicById = new Map((topicRows ?? []).filter((row) => allowedUnitIds.has(String(row.unitId))).map((row) => [String(row.id), row]));
  const filteredLessons = (lessonRows ?? []).filter((row) =>
    (!input.subjectId || String(row.courseId) === input.subjectId)
    && (!input.strandId || String(row.unitId) === input.strandId)
  );
  const lessonIds = filteredLessons.map((row) => String(row.id));
  const lessonById = new Map(filteredLessons.map((row) => [String(row.id), row]));

  const [
    { data: classAttempts, error: classAttemptError },
    { data: lessonAttempts, error: lessonAttemptError },
    { data: progressRows, error: progressError },
    { data: sessionRows, error: sessionError },
    { data: feedbackRows, error: feedbackError }
  ] = await Promise.all([
    studentIds.length && quizIds.length && !input.subjectId && !input.strandId
      ? admin.from("ClassQuizAttempt").select("id,quizId,studentId,attemptNumber,scorePercentage,passed,xpAwarded,submittedAt").in("studentId", studentIds).in("quizId", quizIds)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length && lessonIds.length
      ? admin.from("LessonAttempt").select("id,studentId,lessonId,attemptNumber,scorePercentage,passed,xpAwarded,submittedAt").in("studentId", studentIds).in("lessonId", lessonIds)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length && lessonIds.length
      ? admin.from("StudentLessonProgress").select("studentId,lessonId,status,firstCompletedAt,masteredAt,lastAccessedAt").in("studentId", studentIds).in("lessonId", lessonIds)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length && lessonIds.length
      ? admin.from("LessonSession").select("id,studentId,lessonId,durationSeconds,lastActivityAt,completedAt").in("studentId", studentIds).in("lessonId", lessonIds)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length
      ? admin.from("ClassAdvice").select("id,classId,studentId,message,suggestionType,createdAt,readAt,title,feedbackCategory,priority,recommendedActions,evidenceSnapshot,followUpStatus,dueAt,acknowledgedAt,resolvedAt,resolutionNote").eq("classId", input.classId).in("studentId", studentIds).order("createdAt", { ascending: false })
      : Promise.resolve({ data: [], error: null })
  ]);
  for (const error of [classAttemptError, lessonAttemptError, progressError, sessionError, feedbackError]) {
    if (error) throw new Error(error.message);
  }

  const quizById = new Map((quizRows ?? []).map((row) => [String(row.id), row]));
  const gameByStudent = new Map((gameRows ?? []).map((row) => [String(row.userId), (row.state ?? {}) as {
    xp?: number;
    streak?: number;
    completedLessonIds?: string[];
    quizRecords?: Record<string, { bestScore?: number; latestScore?: number; passed?: boolean; attemptCount?: number; lastAttemptAt?: string }>;
    history?: Array<{ createdAt?: string; xp?: number; type?: string }>;
  }]));
  const events: Event[] = [
    ...(classAttempts ?? []).map((row): Event => {
      const quiz = quizById.get(String(row.quizId));
      return {
        id: String(row.id), itemId: `quiz:${row.quizId}`, studentId: String(row.studentId), kind: "class_quiz",
        title: String(quiz?.title ?? "Class quiz"), courseId: null, subject: "Class quizzes",
        unitId: null, strand: "Class quizzes", topicId: null, substrand: "General",
        score: Number(row.scorePercentage), passed: Boolean(row.passed), xp: Number(row.xpAwarded ?? 0),
        attemptNumber: Number(row.attemptNumber ?? 1), at: String(row.submittedAt)
      };
    }),
    ...(lessonAttempts ?? []).map((row): Event => {
      const lesson = lessonById.get(String(row.lessonId));
      const record = (lesson?.record ?? {}) as { title?: string };
      const unit = unitById.get(String(lesson?.unitId));
      const topic = topicById.get(String(lesson?.topicId));
      return {
        id: String(row.id), itemId: `lesson:${row.lessonId}`, studentId: String(row.studentId), kind: "lesson",
        title: record.title || "Lesson assessment", courseId: lesson?.courseId ? String(lesson.courseId) : null,
        subject: subjectById.get(String(lesson?.courseId)) ?? "Assigned subject",
        unitId: lesson?.unitId ? String(lesson.unitId) : null, strand: String(unit?.name ?? "Unplaced strand"),
        topicId: lesson?.topicId ? String(lesson.topicId) : null, substrand: String(topic?.name ?? "Unplaced sub-strand"),
        score: Number(row.scorePercentage), passed: Boolean(row.passed), xp: Number(row.xpAwarded ?? 0),
        attemptNumber: Number(row.attemptNumber ?? 1), at: String(row.submittedAt)
      };
    })
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  // The current lesson player persists its durable progress in StudentGameState.
  // Add snapshot assessment evidence only when no normalized LessonAttempt exists.
  for (const studentId of studentIds) {
    const state = gameByStudent.get(studentId);
    for (const [lessonId, record] of Object.entries(state?.quizRecords ?? {})) {
      const lesson = lessonById.get(lessonId);
      if (!lesson || !record.lastAttemptAt || events.some((event) => event.studentId === studentId && event.itemId === `lesson:${lessonId}`)) continue;
      const lessonRecord = (lesson.record ?? {}) as { title?: string };
      const unit = unitById.get(String(lesson.unitId));
      const topic = topicById.get(String(lesson.topicId));
      events.push({
        id: `snapshot-${studentId}-${lessonId}`, itemId: `lesson:${lessonId}`, studentId, kind: "lesson",
        title: lessonRecord.title || "Lesson assessment", courseId: String(lesson.courseId),
        subject: subjectById.get(String(lesson.courseId)) ?? "Assigned subject",
        unitId: lesson.unitId ? String(lesson.unitId) : null, strand: String(unit?.name ?? "Unplaced strand"),
        topicId: lesson.topicId ? String(lesson.topicId) : null, substrand: String(topic?.name ?? "Unplaced sub-strand"),
        score: Number(record.latestScore ?? record.bestScore ?? 0), passed: Boolean(record.passed), xp: 0,
        attemptNumber: Number(record.attemptCount ?? 1), at: record.lastAttemptAt
      });
    }
  }
  events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  const bucketDates = buildBuckets(rangeStart, now, input.range === "30d" ? "day" : "week");
  const timeline = bucketDates.map((bucket, index) => {
    const end = index === bucketDates.length - 1 ? now : new Date(bucketDates[index + 1].getTime() - 1);
    const values: Record<string, number | null> = {};
    for (const studentId of studentIds) {
      if (input.metric === "academic") {
        const latest = new Map<string, Event>();
        for (const event of events.filter((item) => item.studentId === studentId && new Date(item.at) <= end)) latest.set(event.itemId, event);
        values[studentId] = average([...latest.values()].map((item) => item.score));
      } else if (input.metric === "completion") {
        const normalizedCompleted = (progressRows ?? []).filter((row) => row.studentId === studentId && completeStatuses.has(String(row.status)) && new Date(String(row.firstCompletedAt ?? row.masteredAt ?? now)) <= end).map((row) => String(row.lessonId));
        const snapshotCompleted = index === bucketDates.length - 1
          ? (gameByStudent.get(studentId)?.completedLessonIds ?? []).filter((lessonId) => lessonById.has(lessonId))
          : [];
        const completed = new Set([...normalizedCompleted, ...snapshotCompleted]).size;
        values[studentId] = lessonIds.length ? Math.round(completed / lessonIds.length * 100) : null;
      } else if (input.metric === "activity") {
        values[studentId] = Math.round((sessionRows ?? []).filter((row) => row.studentId === studentId && inBucket(String(row.lastActivityAt), bucket, end)).reduce((sum, row) => sum + Number(row.durationSeconds ?? 0), 0) / 60);
      } else {
        values[studentId] = events.filter((item) => item.studentId === studentId && inBucket(item.at, bucket, end)).reduce((sum, item) => sum + item.xp, 0);
      }
    }
    return { date: bucket.toISOString(), classAverage: average(Object.values(values).filter((value): value is number => value !== null)), students: values };
  });

  const feedbackByStudent = new Map<string, ClassAdviceView[]>();
  for (const row of feedbackRows ?? []) {
    const list = feedbackByStudent.get(String(row.studentId)) ?? [];
    list.push(mapFeedback(row));
    feedbackByStudent.set(String(row.studentId), list);
  }
  const learners = roster.map((member) => {
    const studentEvents = events.filter((item) => item.studentId === member.studentId);
    const latest = latestByItem(studentEvents);
    const academicAverage = average([...latest.values()].map((item) => item.score));
    const trend = calculateTrend(studentEvents);
    const studentProgress = (progressRows ?? []).filter((row) => row.studentId === member.studentId);
    const completedLessons = new Set([
      ...studentProgress.filter((row) => completeStatuses.has(String(row.status))).map((row) => String(row.lessonId)),
      ...(gameByStudent.get(member.studentId)?.completedLessonIds ?? []).filter((lessonId) => lessonById.has(lessonId))
    ]).size;
    const quizLatest = [...latest.values()].filter((item) => item.kind === "class_quiz");
    const activityMinutes = Math.round((sessionRows ?? []).filter((row) => row.studentId === member.studentId && new Date(String(row.lastActivityAt)) >= rangeStart).reduce((sum, row) => sum + Number(row.durationSeconds ?? 0), 0) / 60);
    const lastActiveAt = maxDate([
      ...studentEvents.map((item) => item.at),
      ...studentProgress.map((row) => row.lastAccessedAt as string | null),
      ...(sessionRows ?? []).filter((row) => row.studentId === member.studentId).map((row) => row.lastActivityAt as string),
      ...(gameByStudent.get(member.studentId)?.history ?? []).map((row) => row.createdAt ?? null)
    ]);
    const feedback = feedbackByStudent.get(member.studentId) ?? [];
    const openInterventions = feedback.filter((item) => item.followUpStatus === "open" || item.followUpStatus === "acknowledged").length;
    const inactive = !lastActiveAt || Date.now() - Date.parse(lastActiveAt) > 7 * 86400000;
    const supportStatus = academicAverage === null && !completedLessons ? "no_data" as const
      : academicAverage !== null && academicAverage < 60 ? "needs_support" as const
        : inactive || (academicAverage !== null && academicAverage < 70) ? "watch" as const
          : "on_track" as const;
    const game = gameByStudent.get(member.studentId);
    return {
      studentId: member.studentId, displayName: member.displayName, grade: member.grade,
      academicAverage, trend, completedLessons, totalLessons: lessonIds.length,
      completionPercent: lessonIds.length ? Math.round(completedLessons / lessonIds.length * 100) : null,
      quizzesPassed: quizLatest.filter((item) => item.passed).length, quizzesAttempted: quizLatest.length,
      passRate: quizLatest.length ? Math.round(quizLatest.filter((item) => item.passed).length / quizLatest.length * 100) : null,
      attemptCount: studentEvents.length, activityMinutes,
      classXp: studentEvents.filter((item) => new Date(item.at) >= rangeStart).reduce((sum, item) => sum + item.xp, 0),
      platformXp: Number(game?.xp ?? member.xp), platformStreak: Number(game?.streak ?? member.streak),
      lastActiveAt, supportStatus, openInterventions
    };
  });

  const details: ClassPerformanceData["details"] = {};
  for (const learner of learners) {
    const studentEvents = events.filter((item) => item.studentId === learner.studentId);
    const bestByItem = new Map<string, number>();
    for (const event of studentEvents) bestByItem.set(event.itemId, Math.max(bestByItem.get(event.itemId) ?? 0, event.score));
    const attempts: PerformanceAttempt[] = studentEvents.slice().reverse().slice(0, 40).map((event) => ({
      id: event.id, kind: event.kind, title: event.title, subject: event.subject, strand: event.strand,
      substrand: event.substrand, attemptNumber: event.attemptNumber, score: event.score,
      bestScore: bestByItem.get(event.itemId) ?? event.score, passed: event.passed, xpAwarded: event.xp, submittedAt: event.at
    }));
    const groups = new Map<string, Event[]>();
    for (const event of studentEvents.filter((item) => item.kind === "lesson")) {
      const key = `${event.courseId}|${event.unitId}|${event.topicId}`;
      groups.set(key, [...(groups.get(key) ?? []), event]);
    }
    const breakdown: PerformanceBreakdown[] = [...groups.entries()].map(([id, group]) => ({
      id, label: group[0].substrand, subject: group[0].subject, strand: group[0].strand, substrand: group[0].substrand,
      average: average([...latestByItem(group).values()].map((item) => item.score)), attempts: group.length,
      completed: new Set([
        ...(progressRows ?? []).filter((row) => row.studentId === learner.studentId && completeStatuses.has(String(row.status)) && group.some((event) => event.itemId === `lesson:${row.lessonId}`)).map((row) => String(row.lessonId)),
        ...(gameByStudent.get(learner.studentId)?.completedLessonIds ?? []).filter((lessonId) => group.some((event) => event.itemId === `lesson:${lessonId}`))
      ]).size,
      total: new Set(group.map((item) => item.itemId)).size
    }));
    const strongest = breakdown.filter((item) => item.average !== null).sort((a, b) => Number(b.average) - Number(a.average))[0];
    const weakest = breakdown.filter((item) => item.average !== null).sort((a, b) => Number(a.average) - Number(b.average))[0];
    details[learner.studentId] = {
      attempts, breakdown, feedback: feedbackByStudent.get(learner.studentId) ?? [],
      strengths: [strongest ? `${strongest.label} is currently the strongest assessed area at ${strongest.average}%.` : "", learner.trend !== null && learner.trend >= 5 ? `Recent assessment performance improved by ${learner.trend} points.` : ""].filter(Boolean),
      concerns: [weakest && Number(weakest.average) < 70 ? `${weakest.label} may need more practice (${weakest.average}%).` : "", !learner.lastActiveAt ? "No assigned learning activity has been recorded yet." : Date.now() - Date.parse(learner.lastActiveAt) > 7 * 86400000 ? "No assigned learning activity has been recorded in the last seven days." : ""].filter(Boolean)
    };
  }

  const scored = learners.map((item) => item.academicAverage).filter((value): value is number => value !== null);
  const completionValues = learners.map((item) => item.completionPercent).filter((value): value is number => value !== null);
  return {
    generatedAt: now.toISOString(), range: input.range, metric: input.metric,
    rangeStart: rangeStart.toISOString(), rangeEnd: now.toISOString(),
    subjects: (subjectRows ?? []).map((subject) => ({
      id: String(subject.id), name: String(subject.name),
      strands: (unitRows ?? []).filter((unit) => unit.subjectId === subject.id).map((unit) => ({ id: String(unit.id), name: String(unit.name) }))
    })),
    summary: {
      academicAverage: average(scored), completionPercent: average(completionValues),
      activeLearners: learners.filter((item) => item.lastActiveAt && Date.now() - Date.parse(item.lastActiveAt) <= 7 * 86400000).length,
      needsSupport: learners.filter((item) => item.supportStatus === "needs_support" || item.supportStatus === "watch").length,
      improving: learners.filter((item) => item.trend !== null && item.trend >= 5).length,
      declining: learners.filter((item) => item.trend !== null && item.trend <= -5).length
    },
    learners, timeline, details
  };
}

function mapFeedback(row: Record<string, unknown>): ClassAdviceView {
  return {
    id: String(row.id), classId: String(row.classId), className: "", message: String(row.message),
    suggestionType: String(row.suggestionType) as ClassAdviceView["suggestionType"],
    createdAt: String(row.createdAt), readAt: row.readAt ? String(row.readAt) : null, teacherName: "Teacher",
    title: row.title ? String(row.title) : null,
    feedbackCategory: (row.feedbackCategory as ClassAdviceView["feedbackCategory"]) ?? null,
    priority: (row.priority as ClassAdviceView["priority"]) ?? null,
    recommendedActions: Array.isArray(row.recommendedActions) ? row.recommendedActions as Array<{ label: string; href?: string }> : [],
    evidenceSnapshot: (row.evidenceSnapshot ?? {}) as Record<string, unknown>,
    followUpStatus: (row.followUpStatus as ClassAdviceView["followUpStatus"]) ?? "not_required",
    dueAt: row.dueAt ? String(row.dueAt) : null, acknowledgedAt: row.acknowledgedAt ? String(row.acknowledgedAt) : null,
    resolvedAt: row.resolvedAt ? String(row.resolvedAt) : null, resolutionNote: row.resolutionNote ? String(row.resolutionNote) : null
  };
}

function buildBuckets(start: Date, end: Date, size: "day" | "week") {
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  if (size === "week") cursor.setDate(cursor.getDate() - cursor.getDay());
  const dates: Date[] = [];
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + (size === "day" ? 1 : 7));
  }
  return dates.length ? dates : [new Date(start)];
}

function inBucket(value: string, start: Date, end: Date) {
  const date = new Date(value);
  return date >= start && date <= end;
}

function average(values: number[]): number | null {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

function latestByItem(events: Event[]) {
  const map = new Map<string, Event>();
  for (const event of events) {
    const current = map.get(event.itemId);
    if (!current || Date.parse(event.at) >= Date.parse(current.at)) map.set(event.itemId, event);
  }
  return map;
}

function calculateTrend(events: Event[]) {
  if (events.length < 2) return null;
  const midpoint = Math.ceil(events.length / 2);
  const earlier = average(events.slice(0, midpoint).map((item) => item.score));
  const recent = average(events.slice(midpoint).map((item) => item.score));
  return earlier === null || recent === null ? null : recent - earlier;
}

function maxDate(values: Array<string | null | undefined>) {
  const valid = values.filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value!)));
  return valid.length ? valid.sort((a, b) => Date.parse(b) - Date.parse(a))[0] : null;
}
