"use client";

import type { Achievement } from "@/lib/gamification/student-game";

export const studentCelebrationEvent = "skulkid:student-celebration";

export type StudentCelebrationSource =
  | "lesson"
  | "lesson_quiz"
  | "video"
  | "class_quiz"
  | "daily_gift"
  | "daily_quest"
  | "teacher_bonus";

export type CelebrationAchievement = Pick<Achievement, "id" | "name" | "description" | "icon">;

export type StudentCelebration = {
  id: string;
  source: StudentCelebrationSource;
  title: string;
  detail: string;
  xp: number;
  stars: number;
  achievements: CelebrationAchievement[];
  createdAt: string;
};

export type StudentCelebrationInput = Omit<StudentCelebration, "achievements"> & {
  achievements?: CelebrationAchievement[];
};

export function dispatchStudentCelebration(input: StudentCelebrationInput) {
  if (typeof window === "undefined") return;
  const celebration: StudentCelebration = {
    ...input,
    xp: Math.max(0, Math.round(input.xp)),
    stars: Math.max(0, Math.round(input.stars)),
    achievements: input.achievements ?? []
  };
  if (celebration.xp === 0 && celebration.stars === 0 && celebration.achievements.length === 0) return;
  window.dispatchEvent(new CustomEvent<StudentCelebration>(studentCelebrationEvent, {
    detail: celebration
  }));
}

export function mergeStudentCelebrations(celebrations: StudentCelebration[]): StudentCelebration {
  if (celebrations.length === 0) {
    throw new Error("At least one celebration is required.");
  }
  const achievements = new Map<string, CelebrationAchievement>();
  for (const celebration of celebrations) {
    for (const achievement of celebration.achievements) achievements.set(achievement.id, achievement);
  }
  const first = celebrations[0];
  const combined = celebrations.length > 1;
  return {
    id: celebrations.map((celebration) => celebration.id).join("+"),
    source: first.source,
    title: combined ? "Amazing work!" : first.title,
    detail: combined
      ? "Your learning rewards are ready."
      : first.detail,
    xp: celebrations.reduce((total, celebration) => total + celebration.xp, 0),
    stars: celebrations.reduce((total, celebration) => total + celebration.stars, 0),
    achievements: [...achievements.values()],
    createdAt: first.createdAt
  };
}
