import { levelDefinitions } from "@/domains/gamification/config/reward-rules";
import type { LevelDefinition, LevelProgress } from "@/domains/gamification/types";

export function getLevelFromXp(totalXp: number, definitions: LevelDefinition[] = levelDefinitions): number {
  return getCurrentDefinition(totalXp, definitions).level;
}

export function getLevelTitle(level: number): string {
  if (level <= 3) return "Beginner Explorer";
  if (level <= 6) return "Curious Learner";
  if (level <= 10) return "Knowledge Explorer";
  if (level <= 15) return "Rising Scholar";
  if (level <= 20) return "Learning Champion";
  return "Master Scholar";
}

export function getXpRequiredForNextLevel(totalXp: number): number {
  const progress = getLevelProgress(totalXp);
  return progress.xpNeededForNextLevel;
}

export function getLevelProgress(totalXp: number, definitions: LevelDefinition[] = levelDefinitions): LevelProgress {
  const current = getCurrentDefinition(totalXp, definitions);
  const next = getNextDefinition(current, definitions);
  const xpIntoCurrentLevel = totalXp - current.minimumXp;
  const levelSpan = next.minimumXp - current.minimumXp;

  return {
    currentLevel: current.level,
    title: getLevelTitle(current.level),
    currentLevelMinimumXp: current.minimumXp,
    nextLevelMinimumXp: next.minimumXp,
    xpIntoCurrentLevel,
    xpNeededForNextLevel: Math.max(0, next.minimumXp - totalXp),
    progressPercentage: levelSpan === 0 ? 100 : Math.round((xpIntoCurrentLevel / levelSpan) * 100)
  };
}

function getCurrentDefinition(totalXp: number, definitions: LevelDefinition[]): LevelDefinition {
  const sorted = [...definitions].sort((first, second) => first.minimumXp - second.minimumXp);
  const configured = sorted.filter((definition) => definition.minimumXp <= totalXp).at(-1);

  if (configured) {
    const lastConfigured = sorted.at(-1);
    if (lastConfigured && configured.level === lastConfigured.level && totalXp >= lastConfigured.minimumXp) {
      const extraLevels = Math.floor((totalXp - lastConfigured.minimumXp) / 1500);
      return {
        level: lastConfigured.level + extraLevels,
        minimumXp: lastConfigured.minimumXp + extraLevels * 1500,
        title: getLevelTitle(lastConfigured.level + extraLevels)
      };
    }
    return configured;
  }

  return sorted[0];
}

function getNextDefinition(current: LevelDefinition, definitions: LevelDefinition[]): LevelDefinition {
  const configuredNext = definitions.find((definition) => definition.level === current.level + 1);
  return (
    configuredNext ?? {
      level: current.level + 1,
      minimumXp: current.minimumXp + 1500,
      title: getLevelTitle(current.level + 1)
    }
  );
}
