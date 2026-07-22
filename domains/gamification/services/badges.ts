import type { BadgeAward, BadgeDefinition } from "@/domains/gamification/types";

export function canAwardBadge(
  badge: BadgeDefinition,
  currentAwards: BadgeAward[]
): boolean {
  if (badge.repeatable) {
    return true;
  }

  return !currentAwards.some((award) => award.badgeId === badge.id);
}

export function createBadgeAward(
  badge: BadgeDefinition,
  input: {
    id: string;
    studentId: string;
    sourceEventId: string;
    awardedAt: string;
    metadataJson?: Record<string, unknown>;
  },
  currentAwards: BadgeAward[]
) {
  if (!canAwardBadge(badge, currentAwards)) {
    return { awarded: false, award: null, reason: "badge_already_awarded" };
  }

  return {
    awarded: true,
    reason: "awarded",
    award: {
      id: input.id,
      studentId: input.studentId,
      badgeId: badge.id,
      sourceEventId: input.sourceEventId,
      awardedAt: input.awardedAt,
      metadataJson: input.metadataJson ?? {}
    }
  };
}
