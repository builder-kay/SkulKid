/** Fetch with bounded retries and exponential backoff. */

export type FetchRetryOptions = {
  retries?: number;
  backoffMs?: number;
  /** Retry on these HTTP statuses. Defaults cover flaky gateways. */
  retryStatuses?: number[];
  signal?: AbortSignal;
};

const DEFAULT_RETRY_STATUSES = [408, 425, 429, 500, 502, 503, 504];

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

export function isRetryableNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (error instanceof TypeError) return true;
  const name = "name" in error ? String(error.name) : "";
  return name === "AbortError" ? false : name === "NetworkError";
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const retries = options.retries ?? 2;
  const backoffMs = options.backoffMs ?? 400;
  const retryStatuses = options.retryStatuses ?? DEFAULT_RETRY_STATUSES;
  const signal = options.signal ?? init?.signal;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      const response = await fetch(input, { ...init, signal });
      if (response.ok || !retryStatuses.includes(response.status) || attempt === retries) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (!isRetryableNetworkError(error) || attempt === retries) throw error;
    }

    const delay = backoffMs * 2 ** attempt;
    attempt += 1;
    await sleep(delay, signal ?? undefined);
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed after retries.");
}

export function computeBackoffMs(attempt: number, baseMs = 400) {
  return baseMs * 2 ** Math.max(0, attempt);
}
