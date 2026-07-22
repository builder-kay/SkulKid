import type { StarAward } from "@/domains/gamification/types";

export function calculateStars(isCompleted: boolean, score: number): number {
  if (!isCompleted) {
    return 0;
  }
  if (score >= 90) {
    return 3;
  }
  if (score >= 70) {
    return 2;
  }
  return 1;
}

export function mergeStarAward(currentStars: number, newAward: StarAward): number {
  return Math.max(currentStars, newAward.stars);
}
