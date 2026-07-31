/** True when a published quiz is live and ends within the next 48 hours. */
export function isTimedChallengeQuiz(input: {
  startAt?: string | null;
  deadline?: string | null;
  status?: string | null;
  now?: number;
}) {
  if (input.status && input.status !== "published") return false;
  const now = input.now ?? Date.now();
  if (input.startAt && new Date(input.startAt).getTime() > now) return false;
  if (!input.deadline) return false;
  const endsAt = new Date(input.deadline).getTime();
  if (Number.isNaN(endsAt) || endsAt <= now) return false;
  return endsAt - now <= 48 * 60 * 60 * 1000;
}

export function timedChallengeCountdown(deadline: string, now = Date.now()) {
  const ms = new Date(deadline).getTime() - now;
  if (ms <= 0) return "Ended";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${Math.max(1, minutes)}m left`;
}
