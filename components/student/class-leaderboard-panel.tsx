"use client";

import { Crown, Medal, Shield, Sparkles, Star, Trophy, Users, Zap } from "lucide-react";
import type { ClassLeaderboardEntry } from "@/lib/classes/types";
import { cn } from "@/lib/utils";

export function ClassLeaderboardPanel({
  entries,
  loading = false,
  idPrefix = "",
  className
}: {
  entries: ClassLeaderboardEntry[];
  loading?: boolean;
  idPrefix?: string;
  className?: string;
}) {
  const topThree = entries.slice(0, 3);
  const you = entries.find((entry) => entry.isCurrentUser);

  return (
    <aside className={cn("grid gap-4", className)} aria-labelledby={`${idPrefix}class-board-title`}>
      <section className="overflow-hidden rounded-[2rem] border border-sky-200 bg-white shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-sky-700 via-cyan-700 to-blue-700 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-sky-100">Class rewards</p>
              <h2 className="mt-1 text-2xl font-black" id={`${idPrefix}class-board-title`}>Class board</h2>
            </div>
            <Trophy className="size-8 text-amber-300" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <BoardMetric value={entries.length} label="Learners" />
            <BoardMetric value={you ? `#${you.rank}` : "—"} label="Class rank" />
            <BoardMetric value={you?.classXp ?? 0} label="Class XP" />
            <BoardMetric value={you?.platformXp ?? 0} label="Platform XP" />
          </div>
        </div>

        <div className="grid gap-5 p-5">
          <section id={`${idPrefix}class-leaderboard`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black">Live class leaderboard</p>
                <p className="text-xs text-text-secondary">Ranked by XP earned in this class</p>
              </div>
              <Crown className="size-5 text-amber-500" />
            </div>

            {loading ? (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-center text-xs font-bold text-text-secondary">Loading standings…</p>
            ) : entries.length ? (
              <>
                <div className="mt-4 grid grid-cols-3 items-end gap-2">
                  {[topThree[1], topThree[0], topThree[2]].map((player, index) =>
                    player ? (
                      <div className="text-center" key={player.studentId}>
                        <div
                          className={cn(
                            "mx-auto grid place-items-center rounded-full font-black shadow-sm",
                            index === 1
                              ? "size-14 bg-amber-100 text-amber-800 ring-2 ring-amber-400"
                              : "size-11 bg-slate-100 text-slate-700"
                          )}
                        >
                          {index === 1 ? <Crown className="size-6" /> : initials(player.displayName)}
                        </div>
                        <p className="mt-2 truncate text-xs font-black">{player.displayName}</p>
                        <p className="text-[11px] text-muted">{player.classXp} XP</p>
                      </div>
                    ) : null
                  )}
                </div>
                <ol className="mt-4 grid gap-1.5">
                  {entries.slice(0, 8).map((player) => (
                    <li
                      className={cn(
                        "flex min-h-9 items-center rounded-lg px-2 text-xs",
                        player.isCurrentUser ? "bg-sky-50 font-black text-sky-900" : "bg-slate-50"
                      )}
                      key={player.studentId}
                    >
                      <span className="w-7 font-black">#{player.rank}</span>
                      <span className="flex-1 truncate">
                        {player.displayName}
                        {player.isCurrentUser ? " (you)" : ""}
                      </span>
                      <span className="font-black">{player.classXp}</span>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-center text-xs font-bold text-text-secondary">
                No class scores yet. Take a quiz to climb the board.
              </p>
            )}
          </section>
        </div>
      </section>

      <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-950">
        <Sparkles className="size-5 shrink-0 text-sky-700" />
        <p>
          <span className="font-black">One XP pool.</span> Class quiz rewards add to your platform XP, stars, streak and the main SkulKid leaderboard.
        </p>
      </div>
    </aside>
  );
}

export function ClassLeaderboardStandings({
  entries,
  loading = false
}: {
  entries: ClassLeaderboardEntry[];
  loading?: boolean;
}) {
  const you = entries.find((entry) => entry.isCurrentUser);
  const podium = [entries[3], entries[1], entries[0], entries[2], entries[4]];

  return (
    <div className="grid gap-5">
      <section
        aria-labelledby="class-podium-heading"
        className="overflow-hidden rounded-[2rem] border border-sky-200 bg-gradient-to-b from-sky-50 via-white to-amber-50 p-4 shadow-[var(--shadow-card)] sm:p-6"
      >
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-wider text-sky-700">Hall of champions</p>
          <h2 className="mt-1 text-3xl font-black" id="class-podium-heading">Top class learners</h2>
          <p className="mt-2 text-text-secondary">Highest XP earned from quizzes in this classroom — those points also count on the platform board.</p>
        </div>
        {loading ? (
          <p className="mt-8 text-center font-bold text-text-secondary">Loading standings…</p>
        ) : entries.length ? (
          <div className="mt-8 overflow-x-auto pb-2">
            <div className="mx-auto grid min-w-[44rem] max-w-4xl grid-cols-5 items-end gap-3">
              {podium.map((learner, visualIndex) =>
                learner ? <PodiumLearner learner={learner} key={learner.studentId} visualIndex={visualIndex} /> : null
              )}
            </div>
          </div>
        ) : (
          <p className="mt-8 rounded-2xl bg-white/80 p-6 text-center font-bold text-text-secondary">
            No class scores yet. Finish a quiz to appear here.
          </p>
        )}
      </section>

      <section
        aria-labelledby="class-ranking-heading"
        className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[var(--shadow-card)]"
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-2xl font-black" id="class-ranking-heading">All class rankings</h2>
            <p className="mt-1 text-sm text-text-secondary">Ranked by XP earned here. The same points raise your platform total.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-black text-sky-800">
              <Shield className="size-4" /> Live standings
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-sm font-black text-violet-800">
              <Users className="size-4" /> {entries.length} learners
            </span>
            {you ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-black text-amber-900">
                <Zap className="size-4" /> You · #{you.rank}
              </span>
            ) : null}
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <p className="p-8 text-center font-bold text-text-secondary">Loading live standings…</p>
          ) : entries.length ? (
            entries.map((learner) => <RankingRow key={learner.studentId} learner={learner} />)
          ) : (
            <p className="p-8 text-center font-bold text-text-secondary">No learner results yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function PodiumLearner({ learner, visualIndex }: { learner: ClassLeaderboardEntry; visualIndex: number }) {
  const first = learner.rank === 1;
  const heights = ["h-24", "h-36", "h-48", "h-30", "h-20"];
  return (
    <article className="text-center">
      <div
        className={cn(
          "relative mx-auto grid place-items-center overflow-visible rounded-full bg-gradient-to-br from-sky-600 to-cyan-700 font-black text-white shadow-xl ring-4 ring-white",
          first ? "size-24 text-2xl" : "size-[4.5rem] text-lg"
        )}
      >
        {first ? <Crown className="size-10 text-amber-200" /> : initials(learner.displayName)}
        <span className={cn("absolute -bottom-2 rounded-full px-2 py-0.5 text-xs font-black text-white", first ? "bg-amber-500" : "bg-sky-800")}>
          #{learner.rank}
        </span>
      </div>
      <p className="mt-4 truncate text-sm font-black">{learner.displayName}</p>
      <p className="text-xs font-bold text-sky-700">{learner.classXp} XP</p>
      <div
        className={cn(
          "mt-3 flex flex-col items-center justify-start rounded-t-2xl bg-gradient-to-b pt-3 text-white shadow-inner",
          heights[visualIndex],
          first ? "from-amber-300 to-amber-500" : "from-sky-300 to-sky-600"
        )}
      >
        <span className="text-2xl font-black">{learner.rank}</span>
        <span className="mt-1 flex items-center gap-1 text-xs font-bold">
          <Star className="size-3 fill-current" />
          {learner.classStars}
        </span>
      </div>
    </article>
  );
}

function RankingRow({ learner }: { learner: ClassLeaderboardEntry }) {
  const rankIcon =
    learner.rank === 1 ? (
      <Crown className="size-5 text-amber-500" />
    ) : learner.rank <= 3 ? (
      <Medal className="size-5 text-sky-600" />
    ) : (
      <span className="font-black text-muted">{learner.rank}</span>
    );

  return (
    <article
      className={cn(
        "grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[3rem_1fr_repeat(3,minmax(4rem,auto))] sm:px-6",
        learner.isCurrentUser ? "bg-sky-50 ring-1 ring-inset ring-sky-200" : "hover:bg-slate-50"
      )}
    >
      <div className="grid size-9 place-items-center">{rankIcon}</div>
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sky-600 to-cyan-700 font-black text-white">
          {initials(learner.displayName)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-black">
            {learner.displayName}
            {learner.isCurrentUser ? " (you)" : ""}
          </p>
          <p className="text-xs text-muted">
            Quiz avg {learner.bestQuizAverage == null ? "—" : `${learner.bestQuizAverage}%`}
          </p>
        </div>
      </div>
      <MetricCell className="hidden sm:flex" icon={Star} value={learner.classStars} label="Stars" />
      <MetricCell className="hidden sm:flex" icon={Trophy} value={learner.quizzesPassed} label="Passed" />
      <div className="rounded-xl bg-sky-50 px-3 py-2 text-right">
        <p className="font-black text-sky-800">{learner.classXp}</p>
        <p className="text-[10px] font-bold uppercase text-sky-600">XP</p>
      </div>
    </article>
  );
}

function MetricCell({
  icon: Icon,
  value,
  label,
  className = ""
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("items-center gap-2 text-sm", className)}>
      <Icon className="size-4 text-amber-500" />
      <div>
        <p className="font-black">{value}</p>
        <p className="text-[10px] uppercase text-muted">{label}</p>
      </div>
    </div>
  );
}

function BoardMetric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-2">
      <p className="text-xl font-black">{value}</p>
      <p className="text-[11px] font-bold text-sky-100">{label}</p>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
