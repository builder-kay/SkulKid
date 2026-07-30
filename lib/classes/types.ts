import type { Lesson } from "@/types/lesson";
import type { Subject } from "@/types/subject";

export type ClassStatus = "active" | "archived";
export type MembershipStatus = "active" | "left";
export type QuizStatus = "draft" | "published" | "closed";
export type AdviceSuggestionType = "class_adventure" | "platform_adventure" | "general";
export type CourseVisibility = "platform" | "class";

export type ClassQuizQuestion = {
  id: string;
  prompt: string;
  type: "multiple_choice" | "true_false";
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export type TeacherClassSummary = {
  id: string;
  name: string;
  description: string;
  joinCode: string;
  joinUrl: string;
  gradeLevel: number;
  status: ClassStatus;
  memberCount: number;
  quizCount: number;
  courseCount: number;
  createdAt: string;
};

export type ClassRosterMember = {
  studentId: string;
  displayName: string;
  grade: string;
  joinedAt: string;
  xp: number;
  stars: number;
  streak: number;
  completedLessons: number;
  quizzesTaken: number;
  quizzesPassed: number;
  averageQuizScore: number | null;
  classXp: number;
};

export type PointDeductionView = {
  id: string;
  classId: string;
  amount: number;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  status: "active" | "upheld" | "reversed";
  createdAt: string;
  teacherName: string;
  dispute: null | {
    id: string;
    message: string;
    status: "open" | "upheld" | "reversed";
    createdAt: string;
    resolutionNote: string | null;
  };
};

export type ClassCourseAssignmentView = {
  id: string;
  courseId: string;
  courseName: string;
  courseSlug: string;
  note: string;
  assignedAt: string;
  visibility: CourseVisibility;
  isClassOnly: boolean;
  description: string;
  moduleCount: number;
  lessonCount: number;
};

export type ClassQuizAttemptSummary = {
  attemptNumber: number;
  scorePercentage: number;
  passed: boolean;
  starsAwarded: number;
  xpAwarded: number;
  submittedAt: string;
};

export type ClassQuizView = {
  id: string;
  classId: string;
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
  attemptCount: number;
  createdAt: string;
};

export type ClassAdviceView = {
  id: string;
  classId: string;
  className: string;
  message: string;
  suggestionType: AdviceSuggestionType;
  createdAt: string;
  readAt: string | null;
  teacherName: string;
  title?: string | null;
  feedbackCategory?: "celebration" | "practice" | "intervention" | null;
  priority?: "low" | "normal" | "high" | null;
  recommendedActions?: Array<{ label: string; href?: string }>;
  evidenceSnapshot?: Record<string, unknown>;
  followUpStatus?: "not_required" | "open" | "acknowledged" | "resolved";
  dueAt?: string | null;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
};

export type PerformanceMetric = "academic" | "completion" | "activity" | "class_xp";
export type PerformanceRange = "30d" | "90d" | "term";

export type PerformanceTimelinePoint = {
  date: string;
  classAverage: number | null;
  students: Record<string, number | null>;
};

export type PerformanceLearner = {
  studentId: string;
  displayName: string;
  grade: string;
  academicAverage: number | null;
  trend: number | null;
  completedLessons: number;
  totalLessons: number;
  completionPercent: number | null;
  quizzesPassed: number;
  quizzesAttempted: number;
  passRate: number | null;
  attemptCount: number;
  activityMinutes: number;
  classXp: number;
  platformXp: number;
  platformStreak: number;
  lastActiveAt: string | null;
  supportStatus: "no_data" | "needs_support" | "watch" | "on_track";
  openInterventions: number;
};

export type PerformanceAttempt = {
  id: string;
  kind: "class_quiz" | "lesson";
  title: string;
  subject: string;
  strand: string;
  substrand: string;
  attemptNumber: number;
  score: number;
  bestScore: number;
  passed: boolean;
  xpAwarded: number;
  submittedAt: string;
};

export type PerformanceBreakdown = {
  id: string;
  label: string;
  subject: string;
  strand: string;
  substrand: string;
  average: number | null;
  attempts: number;
  completed: number;
  total: number;
};

export type ClassPerformanceData = {
  generatedAt: string;
  range: PerformanceRange;
  metric: PerformanceMetric;
  rangeStart: string;
  rangeEnd: string;
  subjects: Array<{ id: string; name: string; strands: Array<{ id: string; name: string }> }>;
  summary: {
    academicAverage: number | null;
    completionPercent: number | null;
    activeLearners: number;
    needsSupport: number;
    improving: number;
    declining: number;
  };
  learners: PerformanceLearner[];
  timeline: PerformanceTimelinePoint[];
  details: Record<string, {
    attempts: PerformanceAttempt[];
    breakdown: PerformanceBreakdown[];
    feedback: ClassAdviceView[];
    strengths: string[];
    concerns: string[];
  }>;
};

export type StudentClassSummary = {
  id: string;
  name: string;
  description: string;
  gradeLevel: number;
  teacherName: string;
  joinedAt: string;
  courseCount: number;
  openQuizCount: number;
  unreadAdviceCount: number;
};

export type StudentDashboardActivity = {
  classes: StudentClassSummary[];
  quizzes: Array<{
    id: string;
    classId: string;
    className: string;
    title: string;
    questionCount: number;
    startAt: string | null;
    deadline: string | null;
    baseXpReward: number;
    attemptsUsed: number;
    maxAttempts: number;
    state: "upcoming" | "open" | "completed";
  }>;
  subjects: Array<{
    id: string;
    classId: string;
    className: string;
    courseId: string;
    courseName: string;
    courseSlug: string;
    note: string;
    assignedAt: string;
    isClassOnly: boolean;
  }>;
};

export type StudentClassCourse = {
  classroom: {
    id: string;
    name: string;
  };
  course: Subject;
  lessons: Lesson[];
};

export type ClassLeaderboardEntry = {
  rank: number;
  studentId: string;
  displayName: string;
  classXp: number;
  classStars: number;
  bestQuizAverage: number | null;
  quizzesPassed: number;
  quizzesAttempted: number;
  platformXp: number;
  streak: number;
  isCurrentUser?: boolean;
};
