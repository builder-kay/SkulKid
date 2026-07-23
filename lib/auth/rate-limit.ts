type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();

export function allowOtpRequest(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 10 * 60_000 });
    return true;
  }
  if (current.count >= 3) return false;
  current.count += 1;
  return true;
}
