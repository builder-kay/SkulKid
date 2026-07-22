import type { BadgeDefinition, LevelDefinition, RewardRule } from "@/domains/gamification/types";

export const rewardRules: RewardRule[] = [
  { key: "answer_first_attempt", sourceType: "answer", xpAmount: 10, active: true },
  { key: "answer_retry", sourceType: "answer", xpAmount: 5, active: true },
  { key: "hint_modifier", sourceType: "answer", xpAmount: -2, active: true },
  { key: "lesson_completion", sourceType: "lesson_completion", xpAmount: 30, active: true },
  { key: "perfect_lesson", sourceType: "perfect_lesson", xpAmount: 20, active: true },
  { key: "score_improvement", sourceType: "score_improvement", xpAmount: 15, active: true },
  { key: "daily_goal", sourceType: "daily_goal", xpAmount: 25, active: true },
  { key: "seven_day_streak", sourceType: "streak", xpAmount: 50, active: true }
];

export const levelDefinitions: LevelDefinition[] = [
  { level: 1, minimumXp: 0, title: "Beginner Explorer" },
  { level: 2, minimumXp: 300, title: "Beginner Explorer" },
  { level: 3, minimumXp: 700, title: "Beginner Explorer" },
  { level: 4, minimumXp: 1200, title: "Curious Learner" },
  { level: 5, minimumXp: 1800, title: "Curious Learner" },
  { level: 6, minimumXp: 2500, title: "Curious Learner" },
  { level: 7, minimumXp: 3300, title: "Knowledge Explorer" },
  { level: 8, minimumXp: 4200, title: "Knowledge Explorer" },
  { level: 9, minimumXp: 5200, title: "Knowledge Explorer" },
  { level: 10, minimumXp: 6300, title: "Knowledge Explorer" }
];

const timestamp = "2026-07-21T00:00:00.000Z";

export const badgeDefinitions: BadgeDefinition[] = [
  badge("badge-first-lesson", "first_lesson", "First Lesson", "Complete your first lesson.", "book-open", "learning"),
  badge("badge-first-mastery", "first_mastery", "First Mastery", "Master your first lesson.", "trophy", "mastery"),
  badge("badge-perfect-score", "perfect_score", "Perfect Score", "Score 100% on a lesson.", "star", "mastery"),
  badge("badge-improvement-star", "improvement_star", "Improvement Star", "Beat your previous best score.", "trending-up", "improvement"),
  badge("badge-five-day-streak", "five_day_streak", "Five-Day Streak", "Learn meaningfully for five days.", "flame", "consistency"),
  badge("badge-ten-lessons", "ten_lessons_completed", "Ten Lessons", "Complete ten lessons.", "graduation-cap", "learning"),
  badge("badge-math-explorer", "mathematics_explorer", "Mathematics Explorer", "Complete a Mathematics lesson.", "calculator", "exploration"),
  badge("badge-science-explorer", "science_explorer", "Science Explorer", "Complete a Science lesson.", "microscope", "exploration"),
  badge("badge-english-explorer", "english_explorer", "English Explorer", "Complete an English lesson.", "book", "exploration")
];

function badge(
  id: string,
  key: string,
  name: string,
  description: string,
  iconKey: string,
  category: BadgeDefinition["category"]
): BadgeDefinition {
  return {
    id,
    key,
    name,
    description,
    iconKey,
    category,
    rarity: "common",
    criteriaType: key,
    criteriaJson: {},
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
