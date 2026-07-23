import { NextResponse } from "next/server";
import { calculateLevel } from "@/lib/gamification/calculate-level";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AvatarConfig } from "@/lib/student/student-profile";
import type { LeaderboardEntry } from "@/lib/student/leaderboard";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function wholeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : fallback;
}

function avatar(value: unknown): AvatarConfig | null {
  const candidate = record(value);
  return typeof candidate.bodyStyle === "string" && typeof candidate.skinColor === "string"
    ? candidate as AvatarConfig
    : null;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const admin = createAdminClient();
  const [studentsResult, gameStatesResult, profilesResult] = await Promise.all([
    admin.from("Student").select("id,displayName,totalXpCache,currentStreakDays"),
    admin.from("StudentGameState").select("userId,state"),
    admin.from("StudentProfile").select("userId,profile")
  ]);

  const queryError = studentsResult.error ?? gameStatesResult.error ?? profilesResult.error;
  if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });

  const gameStates = new Map(
    (gameStatesResult.data ?? []).map((row) => [String(row.userId), record(row.state)])
  );
  const profiles = new Map(
    (profilesResult.data ?? []).map((row) => [String(row.userId), record(row.profile)])
  );

  const ranked: LeaderboardEntry[] = (studentsResult.data ?? []).map((student) => {
    const id = String(student.id);
    const state = gameStates.get(id) ?? {};
    const profile = profiles.get(id) ?? {};
    const xp = wholeNumber(state.xp, wholeNumber(student.totalXpCache));
    const profileName = typeof profile.displayName === "string" ? profile.displayName.trim() : "";
    const databaseName = typeof student.displayName === "string" ? student.displayName.trim() : "";

    return {
      id,
      name: profileName || databaseName || "Learner",
      xp,
      stars: wholeNumber(state.stars),
      streak: wholeNumber(state.streak, wholeNumber(student.currentStreakDays)),
      level: calculateLevel(xp),
      rank: 0,
      avatar: avatar(profile.avatar),
      isCurrentUser: id === user.id
    };
  }).sort((first, second) =>
    second.xp - first.xp
    || second.stars - first.stars
    || second.streak - first.streak
    || first.name.localeCompare(second.name)
    || first.id.localeCompare(second.id)
  ).map((entry, index) => ({ ...entry, rank: index + 1 }));

  const currentUser = ranked.find((entry) => entry.isCurrentUser) ?? null;
  return NextResponse.json(
    { entries: ranked, currentUser, totalLearners: ranked.length },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}
