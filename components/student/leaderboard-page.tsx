"use client";

import { Crown, Flame, Medal, Shield, Sparkles, Star, Trophy, Users, Zap } from "lucide-react";
import { StudentShell } from "@/components/student/student-shell";
import { CharacterAvatar } from "@/components/student/character-avatar";
import { platformLearners, type LeaderboardLearner } from "@/data/leaderboard";
import { getStudentLevel } from "@/lib/gamification/calculate-level";
import { useStudentGame } from "@/lib/gamification/student-game";
import { useStudentProfile, type AvatarConfig } from "@/lib/student/student-profile";

type RankedLearner = LeaderboardLearner & { rank: number; customAvatar?: AvatarConfig };

export function LeaderboardPage() {
  const { state } = useStudentGame();
  const { profile } = useStudentProfile();
  const level = getStudentLevel(state.xp).level;
  const current: LeaderboardLearner & { customAvatar: AvatarConfig } = { id: "student-preview-1", name: profile.displayName, xp: state.xp, stars: state.stars, streak: state.streak, level, avatar: initials(profile.displayName), colour: "from-blue-600 to-violet-600", customAvatar: profile.avatar };
  const ranked = [...platformLearners, current].sort((a, b) => b.xp - a.xp || b.stars - a.stars).map((learner, index) => ({ ...learner, rank: index + 1 }));
  const currentRank = ranked.find((learner) => learner.id === current.id)?.rank ?? ranked.length;
  const podium = [ranked[3], ranked[1], ranked[0], ranked[2], ranked[4]];

  return <StudentShell activeItem="leaderboard"><main className="mx-auto grid w-full max-w-7xl gap-6">
    <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-violet-800 to-blue-700 p-6 text-white shadow-[0_24px_70px_rgba(76,29,149,.28)] sm:p-8"><div className="absolute -right-16 -top-20 size-64 rounded-full bg-fuchsia-400/20 blur-3xl" /><div className="absolute -bottom-20 left-1/4 size-56 rounded-full bg-cyan-300/20 blur-3xl" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-black ring-1 ring-white/20"><Sparkles className="size-4 text-amber-300" />SkulKid Champions League</div><h1 className="mt-4 text-4xl font-black sm:text-5xl">Leaderboard</h1><p className="mt-3 max-w-2xl text-lg leading-8 text-indigo-100">Learn, earn XP and climb past fellow explorers. Every lesson can move you closer to the crown.</p></div><div className="grid grid-cols-3 gap-2 rounded-3xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur"><HeaderMetric icon={Users} value={ranked.length} label="Learners" /><HeaderMetric icon={Trophy} value={`#${currentRank}`} label="Your rank" /><HeaderMetric icon={Zap} value={state.xp} label="Your XP" /></div></div></header>

    <section className="overflow-hidden rounded-[2rem] border border-violet-200 bg-gradient-to-b from-violet-50 via-white to-amber-50 p-4 shadow-[var(--shadow-card)] sm:p-6" aria-labelledby="podium-heading"><div className="text-center"><p className="text-sm font-black uppercase tracking-wider text-violet-700">Hall of champions</p><h2 id="podium-heading" className="mt-1 text-3xl font-black">Top 5 learners</h2><p className="mt-2 text-text-secondary">The highest XP totals across the platform.</p></div><div className="mt-8 overflow-x-auto pb-2"><div className="mx-auto grid min-w-[44rem] max-w-4xl grid-cols-5 items-end gap-3">{podium.map((learner, visualIndex) => learner ? <PodiumLearner learner={learner} visualIndex={visualIndex} key={learner.id} /> : null)}</div></div></section>

    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[var(--shadow-card)]" aria-labelledby="ranking-heading"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 id="ranking-heading" className="text-2xl font-black">All learner rankings</h2><p className="mt-1 text-sm text-text-secondary">Ranked from first to last by total XP, then stars.</p></div><span className="inline-flex items-center gap-2 self-start rounded-full bg-blue-50 px-3 py-2 text-sm font-black text-blue-800"><Shield className="size-4" />Live standings</span></div><div className="divide-y divide-slate-100">{ranked.map((learner) => <RankingRow learner={learner} current={learner.id === current.id} key={learner.id} />)}</div></section>
  </main></StudentShell>;
}

function PodiumLearner({ learner, visualIndex }: { learner: RankedLearner; visualIndex: number }) {
  const first = learner.rank === 1; const heights = ["h-24", "h-36", "h-48", "h-30", "h-20"];
  return <article className="text-center"><div className={`relative mx-auto grid place-items-center overflow-visible rounded-full bg-gradient-to-br font-black text-white shadow-xl ring-4 ring-white ${learner.colour} ${first ? "size-24 text-2xl" : "size-18 text-lg"}`}>{learner.customAvatar ? <CharacterAvatar avatar={learner.customAvatar} className="size-full" label={`${learner.name}'s avatar`} /> : first ? <Crown className="size-10 text-amber-200" /> : learner.avatar}<span className={`absolute -bottom-2 rounded-full px-2 py-0.5 text-xs font-black text-white ${first ? "bg-amber-500" : "bg-violet-700"}`}>#{learner.rank}</span></div><p className="mt-4 truncate text-sm font-black">{learner.name}</p><p className="text-xs font-bold text-violet-700">{learner.xp} XP</p><div className={`mt-3 flex ${heights[visualIndex]} flex-col items-center justify-start rounded-t-2xl bg-gradient-to-b ${first ? "from-amber-300 to-amber-500" : "from-violet-300 to-violet-500"} pt-3 text-white shadow-inner`}><span className="text-2xl font-black">{learner.rank}</span><span className="mt-1 flex items-center gap-1 text-xs font-bold"><Star className="size-3 fill-current" />{learner.stars}</span></div></article>;
}

function RankingRow({ learner, current }: { learner: RankedLearner; current: boolean }) {
  const rankIcon = learner.rank === 1 ? <Crown className="size-5 text-amber-500" /> : learner.rank <= 3 ? <Medal className="size-5 text-violet-600" /> : <span className="font-black text-muted">{learner.rank}</span>;
  return <article className={`grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[3rem_1fr_repeat(4,minmax(4rem,auto))] sm:px-6 ${current ? "bg-blue-50 ring-1 ring-inset ring-blue-200" : "hover:bg-slate-50"}`}><div className="grid size-9 place-items-center">{rankIcon}</div><div className="flex min-w-0 items-center gap-3"><span className={`grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br font-black text-white ${learner.colour}`}>{learner.customAvatar ? <CharacterAvatar avatar={learner.customAvatar} className="size-11" label={`${learner.name}'s avatar`} /> : learner.avatar}</span><div className="min-w-0"><p className="truncate font-black">{learner.name}{current ? " (you)" : ""}</p><p className="text-xs text-muted">Level {learner.level}</p></div></div><Metric className="hidden sm:flex" icon={Star} value={learner.stars} label="Stars" /><Metric className="hidden sm:flex" icon={Flame} value={learner.streak} label="Streak" /><Metric className="hidden sm:flex" icon={Trophy} value={learner.level} label="Level" /><div className="rounded-xl bg-violet-50 px-3 py-2 text-right"><p className="font-black text-violet-800">{learner.xp}</p><p className="text-[10px] font-bold uppercase text-violet-600">XP</p></div></article>;
}

function HeaderMetric({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) { return <div className="min-w-20 rounded-2xl bg-white/10 p-3 text-center"><Icon className="mx-auto size-5 text-amber-300" /><p className="mt-1 text-xl font-black">{value}</p><p className="text-[10px] font-bold uppercase text-indigo-100">{label}</p></div>; }
function Metric({ icon: Icon, value, label, className = "" }: { icon: React.ElementType; value: number; label: string; className?: string }) { return <div className={`items-center gap-2 text-sm ${className}`}><Icon className="size-4 text-amber-500" /><div><p className="font-black">{value}</p><p className="text-[10px] uppercase text-muted">{label}</p></div></div>; }
function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
