"use client";

import { useEffect, useState } from "react";

const defaultMessage = "Your next small win is ready.";

export function DailyEncouragement() {
  const [message, setMessage] = useState(defaultMessage);

  useEffect(() => {
    let active = true;
    void fetch("/api/student/daily-encouragement", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ message?: string }>;
      })
      .then((payload) => {
        if (active && payload?.message) setMessage(payload.message);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return <p className="mt-1 text-sm text-text-secondary sm:text-base">{message}</p>;
}
