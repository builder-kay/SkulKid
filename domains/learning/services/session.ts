import type { LessonSession } from "@/domains/learning/types";

export function canResumeSession(session: LessonSession): boolean {
  return session.status === "active" || session.status === "paused";
}

export function recordSessionActivity(
  session: LessonSession,
  at: string,
  durationIncrementSeconds: number
): LessonSession {
  return {
    ...session,
    status: session.status === "paused" ? "active" : session.status,
    lastActivityAt: at,
    pausedAt: null,
    durationSeconds: session.durationSeconds + Math.max(0, durationIncrementSeconds),
    updatedAt: at
  };
}
