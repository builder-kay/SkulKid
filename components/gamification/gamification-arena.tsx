"use client";

import { Award, Check, Crown, Gift, Lock, Sparkles, Trophy } from "lucide-react";
import { ProgressBar } from "@/components/shared/progress-bar";
import { DAILY_LEARNING_XP_GOAL, useStudentGame } from "@/lib/gamification/student-game";

export function GamificationArena({ idPrefix = "" }: { idPrefix?: string }) {
  const { state, achievements, claimDailyReward, dailyGiftUnlocked, dailyLearningXp } = useStudentGame();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const claimed = state.claimedDailyReward === today;
  const board = [{ name: "Ama", xp: 460, avatar: "A" }, { name: "Kojo", xp: 340, avatar: "K" }, { name: "You", xp: state.xp, avatar: "Y", you: true }, { name: "Esi", xp: 180, avatar: "E" }, { name: "Yaw", xp: 120, avatar: "W" }].sort((a, b) => b.xp - a.xp);
  const topThree = board.slice(0, 3);
  const earned = achievements.filter((achievement) => achievement.earned).length;

  return <aside className="grid gap-4 xl:sticky xl:top-8" aria-labelledby={`${idPrefix}game-zone-title`}>
    <section className="overflow-hidden rounded-[2rem] border border-violet-200 bg-white shadow-[var(--shadow-card)]">
      <div className="bg-gradient-to-br from-violet-700 via-violet-700 to-blue-700 p-5 text-white">
        <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-200">Student rewards</p><h2 id={`${idPrefix}game-zone-title`} className="mt-1 text-2xl font-black">Your game zone</h2></div><Trophy className="size-8 text-amber-300" /></div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center"><Metric value={state.xp} label="XP" /><Metric value={state.stars} label="Stars" /><Metric value={state.streak} label="Streak" /></div>
        <div className="mt-4 rounded-2xl bg-white/10 p-3"><ProgressBar label="Next 100 XP" value={state.xp % 100} /></div>
      </div>

      <div className="grid gap-5 p-5">
        <section id="leaderboard"><div className="flex items-center justify-between"><div><p className="font-black">Weekly leaderboard</p><p className="text-xs text-text-secondary">Top learners this week</p></div><Crown className="size-5 text-amber-500" /></div>
          <div className="mt-4 grid grid-cols-3 items-end gap-2">{[topThree[1], topThree[0], topThree[2]].map((player, index) => player ? <div className="text-center" key={player.name}><div className={`mx-auto grid place-items-center rounded-full font-black shadow-sm ${index === 1 ? "size-14 bg-amber-100 text-amber-800 ring-2 ring-amber-400" : "size-11 bg-slate-100 text-slate-700"}`}>{index === 1 ? <Crown className="size-6" /> : player.avatar}</div><p className="mt-2 truncate text-xs font-black">{player.name}</p><p className="text-[11px] text-muted">{player.xp} XP</p></div> : null)}</div>
          <ol className="mt-4 grid gap-1.5">{board.map((player, index) => <li className={`flex min-h-9 items-center rounded-lg px-2 text-xs ${player.you ? "bg-blue-50 font-black text-blue-900" : "bg-slate-50"}`} key={player.name}><span className="w-7 font-black">#{index + 1}</span><span className="flex-1">{player.name}{player.you ? " (you)" : ""}</span><span className="font-black">{player.xp}</span></li>)}</ol>
        </section>

        <section className="border-t border-slate-200 pt-5" id="rewards"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700"><Gift className="size-5" /></span><div><p className="font-black">Daily mystery gift</p><p className="text-xs text-text-secondary">Earn {DAILY_LEARNING_XP_GOAL} learning XP to unlock</p></div></div><div className="mt-3"><ProgressBar label="Daily learning goal" value={Math.min(100, (dailyLearningXp / DAILY_LEARNING_XP_GOAL) * 100)} /></div><button className="mt-3 min-h-10 w-full rounded-xl bg-amber-400 px-3 text-sm font-black text-amber-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60" disabled={claimed || !dailyGiftUnlocked} onClick={claimDailyReward}>{claimed ? "Claimed · come back tomorrow" : dailyGiftUnlocked ? "Open today's gift" : `${dailyLearningXp}/${DAILY_LEARNING_XP_GOAL} XP earned`}</button></section>

        <section className="border-t border-slate-200 pt-5" id="achievements"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Award className="size-5 text-emerald-700" /><p className="font-black">Achievements</p></div><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-800">{earned}/{achievements.length}</span></div><div className="mt-3 grid grid-cols-5 gap-2">{achievements.map((badge) => <div className={`relative grid aspect-square place-items-center rounded-xl border text-xl ${badge.earned ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50 grayscale"}`} key={badge.id} title={`${badge.name}: ${badge.description}`}><span>{badge.icon}</span><span className="absolute right-1 top-1">{badge.earned ? <Check className="size-3 text-emerald-700" /> : <Lock className="size-3 text-muted" />}</span></div>)}</div></section>
      </div>
    </section>
    <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950"><Sparkles className="size-5 shrink-0" /><p><span className="font-black">Keep going!</span> Every lesson moves you up the league.</p></div>
  </aside>;
}

function Metric({ value, label }: { value: number; label: string }) { return <div className="rounded-xl bg-white/10 p-2"><p className="text-xl font-black">{value}</p><p className="text-[11px] font-bold text-violet-100">{label}</p></div>; }
