import type { StreakLearningEvent, StreakRecord } from "@/domains/gamification/types";

const qualifyingVerbs = new Set(["block_completed", "answer_submitted", "lesson_completed"]);

export function qualifiesForLearningDay(event: StreakLearningEvent): boolean {
  return qualifyingVerbs.has(event.verb);
}

export function updateStreak(record: StreakRecord, event: StreakLearningEvent): StreakRecord {
  if (!qualifiesForLearningDay(event)) {
    return record;
  }

  const eventDate = toLocalDateKey(event.occurredAt, record.timezone);

  if (record.lastQualifyingDate === eventDate) {
    return { ...record, updatedAt: event.occurredAt };
  }

  const previousDate = record.lastQualifyingDate;
  const consecutive = previousDate ? daysBetween(previousDate, eventDate) === 1 : false;
  const currentStreakDays = consecutive ? record.currentStreakDays + 1 : 1;

  return {
    ...record,
    currentStreakDays,
    longestStreakDays: Math.max(record.longestStreakDays, currentStreakDays),
    lastQualifyingDate: eventDate,
    updatedAt: event.occurredAt
  };
}

export function calculateStreakBonusEligibility(record: StreakRecord): boolean {
  return record.currentStreakDays > 0 && record.currentStreakDays % 7 === 0;
}

function toLocalDateKey(isoDate: string, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date(isoDate));
}

function daysBetween(firstDate: string, secondDate: string): number {
  const first = Date.parse(`${firstDate}T00:00:00Z`);
  const second = Date.parse(`${secondDate}T00:00:00Z`);
  return Math.round((second - first) / 86_400_000);
}
