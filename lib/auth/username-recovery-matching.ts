export type RecoverableStudent = {
  id: string;
  user_metadata?: Record<string, unknown>;
};

export function normalizeLearnerName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export function matchStudentAgeAndGrade(
  students: RecoverableStudent[],
  age: number,
  grade: number
) {
  return students.filter((student) =>
    student.user_metadata?.age === age && student.user_metadata?.grade === grade
  );
}

export function matchStudentName(students: RecoverableStudent[], learnerName: string) {
  const expected = normalizeLearnerName(learnerName);
  return students.filter((student) => {
    const displayName = student.user_metadata?.display_name;
    return typeof displayName === "string" && normalizeLearnerName(displayName) === expected;
  });
}
