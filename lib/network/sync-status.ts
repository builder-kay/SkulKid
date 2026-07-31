/** Tiny event bus for Saving / Saved / Retry / Offline banners. */

export type SyncStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "queued"; count: number }
  | { kind: "offline" }
  | { kind: "error"; message: string; canRetry: boolean };

export const SYNC_STATUS_EVENT = "skulkid:sync-status";

let currentStatus: SyncStatus = { kind: "idle" };
let savedClearTimer: ReturnType<typeof setTimeout> | null = null;

export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

export function setSyncStatus(next: SyncStatus) {
  currentStatus = next;
  if (typeof window === "undefined") return;
  if (savedClearTimer) {
    clearTimeout(savedClearTimer);
    savedClearTimer = null;
  }
  window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: next }));
  if (next.kind === "saved") {
    savedClearTimer = setTimeout(() => {
      if (currentStatus.kind === "saved") setSyncStatus({ kind: "idle" });
    }, 2500);
  }
}

export function markSaving() {
  setSyncStatus({ kind: "saving" });
}

export function markSaved() {
  setSyncStatus({ kind: "saved", at: Date.now() });
}

export function markQueued(count: number) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setSyncStatus({ kind: "offline" });
    return;
  }
  setSyncStatus({ kind: "queued", count: Math.max(1, count) });
}

export function markSyncError(message: string, canRetry = true) {
  setSyncStatus({ kind: "error", message, canRetry });
}

export function markIdle() {
  setSyncStatus({ kind: "idle" });
}
