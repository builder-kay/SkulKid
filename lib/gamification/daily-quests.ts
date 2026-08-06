export type DailyQuestId = "finish_lesson" | "beat_yesterday" | "kind_message" | "keep_streak";

export type DailyQuestDefinition = {
  id: DailyQuestId;
  title: string;
  detail: string;
  rewardXp: number;
  ctaLabel: string;
  ctaHref: string;
};

export const DAILY_QUESTS: Record<DailyQuestId, DailyQuestDefinition> = {
  finish_lesson: {
    id: "finish_lesson",
    title: "Finish 1 lesson",
    detail: "Complete any lesson mission today and claim your after-school reward.",
    rewardXp: 25,
    ctaLabel: "Explore lessons",
    ctaHref: "/courses"
  },
  beat_yesterday: {
    id: "beat_yesterday",
    title: "Beat yesterday’s XP",
    detail: "Earn more learning XP today than you did yesterday.",
    rewardXp: 20,
    ctaLabel: "Start earning XP",
    ctaHref: "/courses"
  },
  kind_message: {
    id: "kind_message",
    title: "Send a kind class message",
    detail: "Say something helpful or friendly in a class chat today.",
    rewardXp: 15,
    ctaLabel: "Open chats",
    ctaHref: "/messages"
  },
  keep_streak: {
    id: "keep_streak",
    title: "Keep your streak",
    detail: "Earn today’s learning XP goal so your streak flame stays lit.",
    rewardXp: 20,
    ctaLabel: "Keep streak going",
    ctaHref: "/courses"
  }
};

const QUEST_ORDER: DailyQuestId[] = ["finish_lesson", "beat_yesterday", "kind_message", "keep_streak"];

export function accraDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const part = (type: "year" | "month" | "day") =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function pickDailyQuestId(dateKey: string, studentId = ""): DailyQuestId {
  const seed = `${studentId}:${dateKey}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return QUEST_ORDER[hash % QUEST_ORDER.length];
}

export function getDailyQuest(id: DailyQuestId | null | undefined): DailyQuestDefinition {
  return DAILY_QUESTS[id && id in DAILY_QUESTS ? id : "finish_lesson"];
}

/** Monday (Accra) as YYYY-MM-DD for the week containing `now`. */
export function accraWeekStart(now = new Date()) {
  const dateKey = accraDateKey(now);
  const noonUtc = new Date(`${dateKey}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Accra",
    weekday: "short"
  }).format(noonUtc);
  const offset: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const daysFromMonday = offset[weekday] ?? 0;
  const monday = new Date(noonUtc.getTime() - daysFromMonday * 86_400_000);
  return accraDateKey(monday);
}
