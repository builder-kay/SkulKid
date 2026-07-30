"use client";

import { useEffect, useState } from "react";

const defaultMessage = "Your next small win is ready.";
let cachedMessage = "";
let messageRequest: Promise<string | null> | null = null;

function loadMessage() {
  if (cachedMessage) return Promise.resolve(cachedMessage);
  if (messageRequest) return messageRequest;
  messageRequest = fetch("/api/student/daily-encouragement")
    .then(async (response) => {
      if (!response.ok) return null;
      const payload = await response.json() as { message?: string };
      if (payload.message) cachedMessage = payload.message;
      return payload.message ?? null;
    })
    .catch(() => null)
    .finally(() => {
      messageRequest = null;
    });
  return messageRequest;
}

export function DailyEncouragement() {
  const [message, setMessage] = useState(cachedMessage || defaultMessage);

  useEffect(() => {
    let active = true;
    const load = () => {
      void loadMessage().then((next) => {
        if (active && next) setMessage(next);
      });
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const idleHandle = idleWindow.requestIdleCallback?.(load, { timeout: 2500 });
    const timer = idleHandle === undefined ? window.setTimeout(load, 800) : undefined;
    return () => {
      active = false;
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  return <p className="mt-1 text-sm text-text-secondary sm:text-base">{message}</p>;
}
