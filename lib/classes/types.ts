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
  deadline: string | null;
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
