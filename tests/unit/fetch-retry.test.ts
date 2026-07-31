import { describe, expect, it, vi, afterEach } from "vitest";
import { computeBackoffMs, fetchWithRetry, isRetryableNetworkError } from "@/lib/network/fetch-retry";

describe("fetch-retry helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("computes exponential backoff", () => {
    expect(computeBackoffMs(0, 400)).toBe(400);
    expect(computeBackoffMs(1, 400)).toBe(800);
    expect(computeBackoffMs(2, 400)).toBe(1600);
  });

  it("treats TypeError as a retryable network failure", () => {
    expect(isRetryableNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isRetryableNetworkError(new DOMException("Aborted", "AbortError"))).toBe(false);
  });

  it("retries failed responses then succeeds", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("nope", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const pending = fetchWithRetry("/api/demo", undefined, { retries: 2, backoffMs: 10 });
    await vi.runAllTimersAsync();
    const response = await pending;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
