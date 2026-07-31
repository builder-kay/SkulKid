"use client";

import { fetchWithRetry } from "@/lib/network/fetch-retry";
import { idbDelete, idbGetAll, idbPutRecord, QUEUE_STORE } from "@/lib/network/idb";
import {
  markIdle,
  markQueued,
  markSaved,
  markSaving,
  markSyncError
} from "@/lib/network/sync-status";

export type GameStateQueueItem = {
  id: string;
  kind: "game-state";
  idempotencyKey: string;
  createdAt: string;
  body: unknown;
};

export type ClassQuizQueueItem = {
  id: string;
  kind: "class-quiz";
  idempotencyKey: string;
  createdAt: string;
  classId: string;
  quizId: string;
  clientAttemptId: string;
  answers: Array<{ questionId: string; selectedIndex: number }>;
};

export type OfflineQueueItem = GameStateQueueItem | ClassQuizQueueItem;

const GAME_STATE_QUEUE_ID = "game-state:latest";
let flushPromise: Promise<void> | null = null;
let listenersInstalled = false;

export const OFFLINE_QUEUE_FLUSHED_EVENT = "skulkid:offline-queue-flushed";

export async function listOfflineQueue(): Promise<OfflineQueueItem[]> {
  const rows = await idbGetAll<OfflineQueueItem>(QUEUE_STORE);
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function offlineQueueCount() {
  return (await listOfflineQueue()).length;
}

export async function enqueueGameStateWrite(body: unknown) {
  const item: GameStateQueueItem = {
    id: GAME_STATE_QUEUE_ID,
    kind: "game-state",
    idempotencyKey: GAME_STATE_QUEUE_ID,
    createdAt: new Date().toISOString(),
    body
  };
  await idbPutRecord(QUEUE_STORE, item);
  markQueued(await offlineQueueCount());
  return item;
}

export async function enqueueClassQuizWrite(input: {
  classId: string;
  quizId: string;
  clientAttemptId: string;
  answers: Array<{ questionId: string; selectedIndex: number }>;
}) {
  const idempotencyKey = `class-quiz:${input.classId}:${input.quizId}:${input.clientAttemptId}`;
  const item: ClassQuizQueueItem = {
    id: idempotencyKey,
    kind: "class-quiz",
    idempotencyKey,
    createdAt: new Date().toISOString(),
    classId: input.classId,
    quizId: input.quizId,
    clientAttemptId: input.clientAttemptId,
    answers: input.answers
  };
  await idbPutRecord(QUEUE_STORE, item);
  markQueued(await offlineQueueCount());
  return item;
}

async function flushGameState(item: GameStateQueueItem) {
  const response = await fetchWithRetry("/api/student/game-state", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Idempotency-Key": item.idempotencyKey
    },
    body: JSON.stringify(item.body)
  });
  if (!response.ok) throw new Error("Student progress could not be saved.");
  await idbDelete(QUEUE_STORE, item.id);
}

async function flushClassQuiz(item: ClassQuizQueueItem) {
  const response = await fetchWithRetry(
    `/api/student/classes/${encodeURIComponent(item.classId)}/quizzes/${encodeURIComponent(item.quizId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": item.idempotencyKey
      },
      body: JSON.stringify({
        clientAttemptId: item.clientAttemptId,
        answers: item.answers
      })
    }
  );
  const data = await response.json() as Record<string, unknown> & { error?: string };
  if (!response.ok) throw new Error(data.error || "Unable to submit quiz.");
  await idbDelete(QUEUE_STORE, item.id);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(OFFLINE_QUEUE_FLUSHED_EVENT, {
        detail: { kind: "class-quiz", classId: item.classId, quizId: item.quizId, result: data }
      })
    );
  }
  return data;
}

export async function flushOfflineQueue(): Promise<void> {
  if (flushPromise) return flushPromise;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    markQueued(await offlineQueueCount());
    return;
  }

  flushPromise = (async () => {
    const items = await listOfflineQueue();
    if (!items.length) {
      markIdle();
      return;
    }

    markSaving();
    const gameStateItems = items.filter((item): item is GameStateQueueItem => item.kind === "game-state");
    const quizItems = items.filter((item): item is ClassQuizQueueItem => item.kind === "class-quiz");

    try {
      // Persist local lesson XP first, then server-graded class quizzes.
      for (const item of gameStateItems) {
        await flushGameState(item);
      }
      for (const item of quizItems) {
        await flushClassQuiz(item);
      }
      const remaining = await offlineQueueCount();
      if (remaining > 0) markQueued(remaining);
      else markSaved();
    } catch (error) {
      const remaining = await offlineQueueCount();
      if (remaining > 0) {
        markSyncError(
          error instanceof Error ? error.message : "Could not sync saved work.",
          true
        );
      } else {
        markSyncError(
          error instanceof Error ? error.message : "Could not sync saved work.",
          true
        );
      }
    }
  })().finally(() => {
    flushPromise = null;
  });

  return flushPromise;
}

export function installOfflineQueueListeners() {
  if (typeof window === "undefined" || listenersInstalled) return;
  listenersInstalled = true;

  window.addEventListener("online", () => {
    void flushOfflineQueue();
  });
  window.addEventListener("focus", () => {
    if (navigator.onLine) void flushOfflineQueue();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      void flushOfflineQueue();
    }
  });

  void offlineQueueCount().then((count) => {
    if (count > 0) {
      if (!navigator.onLine) markQueued(count);
      else void flushOfflineQueue();
    }
  });
}

export function createClientAttemptId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isBrowserOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
