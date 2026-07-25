import { describe, expect, it } from "vitest";
import {
  matchStudentAgeAndGrade,
  matchStudentName,
  normalizeLearnerName
} from "@/lib/auth/username-recovery-matching";

const students = [
  { id: "ama", user_metadata: { age: 10, grade: 4, display_name: "Ama Mensah" } },
  { id: "esi", user_metadata: { age: 10, grade: 4, display_name: "Esi Mensah" } },
  { id: "kojo", user_metadata: { age: 8, grade: 2, display_name: "Kojo Mensah" } }
];

describe("username recovery identity matching", () => {
  it("matches exact stored age and Primary level", () => {
    expect(matchStudentAgeAndGrade(students, 10, 4).map((student) => student.id))
      .toEqual(["ama", "esi"]);
    expect(matchStudentAgeAndGrade(students, 11, 4)).toEqual([]);
  });

  it("normalizes capitalization and repeated whitespace in names", () => {
    expect(normalizeLearnerName("  AMA   Mensah ")).toBe("ama mensah");
    expect(matchStudentName(students, "  AMA   Mensah ").map((student) => student.id))
      .toEqual(["ama"]);
  });

  it("does not use partial or fuzzy name matching", () => {
    expect(matchStudentName(students, "Ama")).toEqual([]);
    expect(matchStudentName(students, "Ana Mensah")).toEqual([]);
  });

  it("leaves indistinguishable twins unresolved", () => {
    const twins = [
      ...students,
      { id: "ama-2", user_metadata: { age: 10, grade: 4, display_name: "Ama Mensah" } }
    ];
    const ageMatches = matchStudentAgeAndGrade(twins, 10, 4);
    expect(matchStudentName(ageMatches, "ama mensah").map((student) => student.id))
      .toEqual(["ama", "ama-2"]);
  });
});
