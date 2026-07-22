import type { StudentLevel } from "@/types/gamification";

const XP_PER_LEVEL = 500;

export function calculateLevel(totalXp: number): number {
  return Math.max(1, Math.floor(totalXp / XP_PER_LEVEL) + 1);
}

export function getLevelTitle(level: number): string {
  if (level <= 3) {
    return "Beginner Explorer";
  }

  if (level <= 6) {
    return "Curious Learner";
  }

  if (level <= 10) {
    return "Knowledge Explorer";
  }

  if (level <= 15) {
    return "Rising Scholar";
  }

  if (level <= 20) {
    return "Learning Champion";
  }

  return "Master Scholar";
}

export function getStudentLevel(totalXp: number): StudentLevel {
  const level = calculateLevel(totalXp);
  const currentLevelXp = totalXp % XP_PER_LEVEL;

  return {
    level,
    title: getLevelTitle(level),
    currentLevelXp,
    xpForNextLevel: XP_PER_LEVEL,
    progressToNextLevel: Math.round((currentLevelXp / XP_PER_LEVEL) * 100)
  };
}
