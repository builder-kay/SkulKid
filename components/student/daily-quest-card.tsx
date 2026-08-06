"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Target } from "lucide-react";
import { useStudentGame } from "@/lib/gamification/student-game";
import { CharacterAvatar } from "@/components/student/character-avatar";
import { useStudentProfile } from "@/lib/student/student-profile";
import { cn } from "@/lib/utils";

export function DailyQuestCard() {
  const {
    state,
    dailyQuest,
    dailyQuestReady,
    dailyQuestClaimed,
    claimDailyQuest
  } = useStudentGame();
  const { profile } = useStudentProfile();
  const progress = Math.min(1, state.questProgress ?? 0);
  const celebrationSignal = dailyQuestClaimed ? `quest-${state.questDate}` : undefined;
  const cardClassName =
    "relative block overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:p-6";

  const body = (
    <>
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-amber-200/40 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-white bg-gradient-to-br from-violet-100 to-amber-100 shadow-sm">
            <CharacterAvatar
              avatar={profile.avatar}
              celebrationSignal={celebrationSignal}
              className="size-full rounded-xl"
              label={`${profile.username}'s quest avatar`}
              motion="expressive"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-amber-800">After-school mission</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950" id="daily-quest-heading">
              {dailyQuest.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{dailyQuest.detail}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-1 text-xs font-black text-amber-950">
                <Sparkles className="size-3.5" />+{dailyQuest.rewardXp} XP
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                <Target className="size-3.5" />
                {dailyQuestClaimed ? "Claimed" : dailyQuestReady ? "Ready to claim" : `${Math.round(progress * 100)}% done`}
              </span>
            </div>
            <div className="mt-3 h-2.5 max-w-sm overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-amber-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                style={{ width: `${Math.max(dailyQuestClaimed || dailyQuestReady ? 100 : 8, progress * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-stretch">
          {dailyQuestClaimed ? (
            <p className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-100 px-5 font-black text-emerald-900">
              <CheckCircle2 className="size-5" />Mission done!
            </p>
          ) : dailyQuestReady ? (
            <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 font-black text-slate-950 shadow-md">
              <Sparkles className="size-5" />Claim +{dailyQuest.rewardXp} XP
            </span>
          ) : (
            <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white">
              {dailyQuest.ctaLabel}
              <ArrowRight className="size-4" />
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (dailyQuestClaimed) {
    return (
      <section aria-labelledby="daily-quest-heading" className={cn(cardClassName, "hover:translate-y-0 hover:shadow-[var(--shadow-card)]")}>
        {body}
      </section>
    );
  }

  if (dailyQuestReady) {
    return (
      <button
        aria-labelledby="daily-quest-heading"
        className={cn(cardClassName, "w-full cursor-pointer")}
        onClick={() => claimDailyQuest()}
        type="button"
      >
        {body}
      </button>
    );
  }

  return (
    <Link aria-labelledby="daily-quest-heading" className={cardClassName} href={dailyQuest.ctaHref}>
      {body}
    </Link>
  );
}
