import { CONTENT_STORE, idbGet, idbSet } from "@/lib/network/idb";
import type {
  ClassCourseAssignmentView,
  ClassQuizView,
  ClassRosterMember,
  TeacherClassSummary
} from "@/lib/classes/types";

export type TeacherClassPack = {
  classId: string;
  savedAt: string;
  classroom: TeacherClassSummary;
  roster: ClassRosterMember[];
  courseAssignments: ClassCourseAssignmentView[];
  openQuizzes: ClassQuizView[];
  allQuizzes: ClassQuizView[];
  coursesCatalog: Array<{ id: string; name: string; slug: string }>;
};

export function classPackKey(classId: string) {
  return `teacher-pack:${classId}`;
}

export function isOpenQuizForPack(quiz: Pick<ClassQuizView, "status" | "deadline">, now = Date.now()) {
  if (quiz.status !== "published") return false;
  if (quiz.deadline && new Date(quiz.deadline).getTime() <= now) return false;
  return true;
}

export async function saveTeacherClassPack(pack: TeacherClassPack) {
  await idbSet(CONTENT_STORE, classPackKey(pack.classId), pack);
  return pack;
}

export async function readTeacherClassPack(classId: string) {
  return idbGet<TeacherClassPack>(CONTENT_STORE, classPackKey(classId));
}

export async function downloadTeacherClassPack(input: {
  classId: string;
  classroom: TeacherClassSummary;
  roster: ClassRosterMember[];
  courseAssignments: ClassCourseAssignmentView[];
  quizzes: ClassQuizView[];
  coursesCatalog: Array<{ id: string; name: string; slug: string }>;
}) {
  const pack: TeacherClassPack = {
    classId: input.classId,
    savedAt: new Date().toISOString(),
    classroom: input.classroom,
    roster: input.roster,
    courseAssignments: input.courseAssignments,
    openQuizzes: input.quizzes.filter((quiz) => isOpenQuizForPack(quiz)),
    allQuizzes: input.quizzes,
    coursesCatalog: input.coursesCatalog
  };
  await saveTeacherClassPack(pack);
  return pack;
}

export function formatPackSavedAt(iso: string | null | undefined) {
  if (!iso) return "Not downloaded yet";
  try {
    return `Saved ${new Date(iso).toLocaleString()}`;
  } catch {
    return `Saved ${iso}`;
  }
}
