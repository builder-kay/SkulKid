type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();
const recoveryLookups = new Map<string, Attempt>();
const usernameChecks = new Map<string, Attempt>();
const teacherDirectorySearches = new Map<string, Attempt>();

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

export function allowUsernameRecoveryLookup(key: string) {
  const now = Date.now();
  const current = recoveryLookups.get(key);
  if (!current || current.resetAt <= now) {
    recoveryLookups.set(key, { count: 1, resetAt: now + 10 * 60_000 });
    return true;
  }
  if (current.count >= 10) return false;
  current.count += 1;
  return true;
}

export function allowUsernameAvailabilityCheck(key: string) {
  const now = Date.now();
  const current = usernameChecks.get(key);
  if (!current || current.resetAt <= now) {
    usernameChecks.set(key, { count: 1, resetAt: now + 10 * 60_000 });
    return true;
  }
  if (current.count >= 15) return false;
  current.count += 1;
  return true;
}

export function allowTeacherDirectorySearch(key: string) {
  const now = Date.now();
  const current = teacherDirectorySearches.get(key);
  if (!current || current.resetAt <= now) {
    teacherDirectorySearches.set(key, { count: 1, resetAt: now + 10 * 60_000 });
    return true;
  }
  if (current.count >= 60) return false;
  current.count += 1;
  return true;
}

const feedbackSubmits = new Map<string, Attempt>();

/** Public research questionnaire: max 8 submits / 10 minutes per IP. */
export function allowFeedbackSubmit(key: string) {
  const now = Date.now();
  const current = feedbackSubmits.get(key);
  if (!current || current.resetAt <= now) {
    feedbackSubmits.set(key, { count: 1, resetAt: now + 10 * 60_000 });
    return true;
  }
  if (current.count >= 8) return false;
  current.count += 1;
  return true;
}
