"use client";

import { Award, ChevronDown, ChevronUp, Clock3, Crown, Flame, Gift, Lock, Medal, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { StudentShell } from "@/components/student/student-shell";
import { StudentPageNav } from "@/components/student/student-page-nav";
import { ProgressBar } from "@/components/shared/progress-bar";
import { getStudentLevel } from "@/lib/gamification/calculate-level";
import { useStudentGame, type GameHistoryEvent } from "@/lib/gamification/student-game";

export function RewardsAchievementsPage() {
  const { state, achievements, dailyGiftUnlocked, dailyLearningXp, claimDailyReward } = useStudentGame();
  const level = getStudentLevel(state.xp);
  const earned = achievements.filter((achievement) => achievement.earned);
  const claimedToday = state.claimedDailyReward === localDate();

  return <StudentShell activeItem="achievements"><main className="mx-auto grid w-full max-w-7xl gap-6">
    <StudentPageNav
      backHref="/dashboard"
      backLabel="Back to dashboard"
      crumbs={[
        { label: "Home", href: "/dashboard" },
        { label: "Rewards & Achievements" }
      ]}
    />
    <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-800 via-teal-700 to-blue-800 p-6 text-white shadow-[0_24px_70px_rgba(5,150,105,.2)] sm:p-8"><div className="absolute -right-16 -top-20 size-64 rounded-full bg-amber-300/20 blur-3xl" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-black ring-1 ring-white/20"><Sparkles className="size-4 text-amber-300" />Your lifetime collection</div><h1 className="mt-4 text-4xl font-black sm:text-5xl">Rewards & Achievements</h1><p className="mt-3 max-w-2xl text-lg leading-8 text-emerald-50">Every lesson, quiz, reward and ranking climb becomes part of your SkulKid story.</p></div><div className="grid grid-cols-3 gap-2"><HeroMetric icon={Trophy} value={level.level} label="Level" /><HeroMetric icon={Zap} value={state.xp} label="XP" /><HeroMetric icon={Star} value={state.stars} label="Stars" /></div></div></header>

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="grid gap-5">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6" aria-labelledby="achievement-heading"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-wider text-emerald-700">Recognition cabinet</p><h2 id="achievement-heading" className="mt-1 text-2xl font-black">All achievements</h2><p className="mt-1 text-text-secondary">{earned.length} of {achievements.length} achievements unlocked.</p></div><Award className="size-9 text-emerald-600" /></div><div className="mt-5"><ProgressBar label="Collection complete" value={(earned.length / achievements.length) * 100} /></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{achievements.map((achievement) => <article className={`relative overflow-hidden rounded-2xl border p-4 ${achievement.earned ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white" : "border-slate-200 bg-slate-50 text-muted"}`} key={achievement.id}><span className="text-4xl">{achievement.icon}</span><h3 className="mt-3 font-black">{achievement.name}</h3><p className="mt-1 text-sm leading-6">{achievement.description}</p><span className={`absolute right-3 top-3 grid size-7 place-items-center rounded-full ${achievement.earned ? "bg-emerald-600 text-white" : "bg-slate-200"}`}>{achievement.earned ? <Medal className="size-4" /> : <Lock className="size-3" />}</span></article>)}</div></section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[var(--shadow-card)]" aria-labelledby="history-heading"><div className="border-b border-slate-200 p-5 sm:p-6"><p className="text-sm font-black uppercase tracking-wider text-violet-700">Since you joined</p><h2 id="history-heading" className="mt-1 text-2xl font-black">Achievement and ranking history</h2><p className="mt-1 text-text-secondary">See how every activity changed your rewards and leaderboard position.</p></div><div className="p-4 sm:p-6">{state.history.length ? <ol className="relative grid gap-5 before:absolute before:bottom-3 before:left-[1.15rem] before:top-3 before:w-0.5 before:bg-slate-200">{state.history.map((event, index) => <HistoryItem event={event} previous={state.history[index + 1]} key={event.id} />)}</ol> : <p className="rounded-2xl bg-slate-50 p-6 text-center text-text-secondary">Your achievement story will appear here as you learn.</p>}</div></section>
      </div>

      <aside className="grid content-start gap-5 lg:sticky lg:top-8">
        <section className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-[var(--shadow-card)]"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-amber-400 text-amber-950"><Gift className="size-6" /></span><div><h2 className="font-black">Daily mystery gift</h2><p className="text-xs text-text-secondary">Unlock with 30 learning XP</p></div></div><div className="mt-5"><ProgressBar label="Today’s goal" value={Math.min(100, (dailyLearningXp / 30) * 100)} /></div><button className="mt-4 min-h-11 w-full rounded-xl bg-amber-400 px-4 font-black text-amber-950 disabled:cursor-not-allowed disabled:opacity-50" disabled={!dailyGiftUnlocked || claimedToday} onClick={claimDailyReward}>{claimedToday ? "Gift claimed today" : dailyGiftUnlocked ? "Open mystery gift" : `${dailyLearningXp}/30 XP earned`}</button></section>
        <section className="rounded-[2rem] border border-violet-200 bg-violet-50 p-5"><div className="flex items-center gap-3"><Crown className="size-7 text-violet-700" /><div><h2 className="font-black">Level {level.level}</h2><p className="text-sm text-violet-800">{level.title}</p></div></div><div className="mt-4"><ProgressBar label="Next level" value={level.progressToNextLevel} /></div><div className="mt-4 grid grid-cols-2 gap-2 text-center"><SmallMetric icon={Flame} value={state.streak} label="Day streak" /><SmallMetric icon={Award} value={earned.length} label="Badges" /></div></section>
      </aside>
    </section>
  </main></StudentShell>;
}

function HistoryItem({ event, previous }: { event: GameHistoryEvent; previous?: GameHistoryEvent }) { const movement = previous ? previous.rank - event.rank : 0; return <li className="relative grid grid-cols-[2.4rem_1fr] gap-3"><span className="z-10 grid size-9 place-items-center rounded-full bg-violet-600 text-white shadow-sm"><Clock3 className="size-4" /></span><article className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-black">{event.title}</h3><p className="mt-1 text-sm text-text-secondary">{event.detail}</p></div><time className="text-xs font-bold text-muted">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.createdAt))}</time></div><div className="mt-3 flex flex-wrap gap-2 text-xs font-black"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">+{event.xp} XP</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">+{event.stars} stars</span><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${movement > 0 ? "bg-emerald-50 text-emerald-800" : movement < 0 ? "bg-rose-50 text-rose-800" : "bg-slate-100 text-slate-700"}`}>{movement > 0 ? <ChevronUp className="size-3" /> : movement < 0 ? <ChevronDown className="size-3" /> : null}Rank #{event.rank}{movement ? ` · ${Math.abs(movement)} place${Math.abs(movement) === 1 ? "" : "s"}` : ""}</span></div></article></li>; }
function HeroMetric({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) { return <div className="min-w-20 rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/15"><Icon className="mx-auto size-5 text-amber-300" /><p className="mt-1 text-xl font-black">{value}</p><p className="text-[10px] font-bold uppercase text-emerald-100">{label}</p></div>; }
function SmallMetric({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) { return <div className="rounded-xl bg-white p-3"><Icon className="mx-auto size-4 text-violet-600" /><p className="mt-1 text-xl font-black">{value}</p><p className="text-[10px] font-bold uppercase text-muted">{label}</p></div>; }
function localDate() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; }
