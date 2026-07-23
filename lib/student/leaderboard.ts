"use client";

import { useEffect, useState } from "react";
import { gameChangedEvent } from "@/lib/gamification/student-game";
import type { AvatarConfig } from "@/lib/student/student-profile";

export type LeaderboardEntry = {
  id: string;
  name: string;
  xp: number;
  stars: number;
  streak: number;
  level: number;
  rank: number;
  avatar: AvatarConfig | null;
  isCurrentUser: boolean;
};

type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
  totalLearners: number;
};

const emptyLeaderboard: LeaderboardResponse = {
  entries: [],
  currentUser: null,
  totalLearners: 0
};

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState(emptyLeaderboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const response = await fetch("/api/student/leaderboard", { cache: "no-store" });
        const payload = await response.json() as LeaderboardResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Could not load the leaderboard.");
        if (active) {
          setLeaderboard(payload);
          setError(null);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load the leaderboard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void refresh();
    const handleGameChange = () => { void refresh(); };
    window.addEventListener(gameChangedEvent, handleGameChange);
    return () => {
      active = false;
      window.removeEventListener(gameChangedEvent, handleGameChange);
    };
  }, []);

  return { ...leaderboard, loading, error };
}
