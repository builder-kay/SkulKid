"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, BookOpen, LayoutDashboard, LogOut, Trophy, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GamificationArena } from "@/components/gamification/gamification-arena";
import { CharacterAvatar } from "@/components/student/character-avatar";
import { AchievementMedalIcon } from "@/components/shared/achievement-medal-icon";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";
import { SignOutConfirmation } from "@/components/shared/sign-out-confirmation";
import { getStudentLevel } from "@/lib/gamification/calculate-level";
import { cn } from "@/lib/utils";
import { useStudentGame } from "@/lib/gamification/student-game";
import { useStudentProfile } from "@/lib/student/student-profile";

export type StudentNavItem = "dashboard" | "courses" | "mathematics" | "preview" | "leaderboard" | "achievements" | "profile";

export type StudentShellProps = {
  activeItem: StudentNavItem;
  children: React.ReactNode;
};

const navItems: Array<{
  id: StudentNavItem;
  href: string;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
}> = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", mobileLabel: "Home", icon: LayoutDashboard },
  { id: "courses", href: "/courses", label: "Courses", mobileLabel: "Courses", icon: BookOpen },
  { id: "leaderboard", href: "/leaderboard", label: "Leaderboard", mobileLabel: "League", icon: Trophy },
  { id: "achievements", href: "/achievements", label: "Rewards & Achievements", mobileLabel: "Rewards", icon: Award }
  ,{ id: "profile", href: "/profile", label: "My Avatar", mobileLabel: "Avatar", icon: UserRound }
];

export function StudentShell({ activeItem, children }: StudentShellProps) {
  const [rewardsNavOpen, setRewardsNavOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { state } = useStudentGame();
  const { profile } = useStudentProfile();
  const studentLevel = getStudentLevel(state.xp);

  useEffect(() => {
    if (!rewardsNavOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setRewardsNavOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [rewardsNavOpen]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[18.5rem_1fr]">
      <SignOutConfirmation open={signOutOpen} onClose={() => setSignOutOpen(false)} />
      <header className="sticky top-0 z-30 border-b border-white/80 bg-white/90 px-4 py-3 shadow-[0_8px_28px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="flex min-h-12 items-center justify-between gap-3">
          <Link
            className="flex min-w-0 items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            href="/dashboard"
          >
            <span className="min-w-0">
              <SkulKidLogo className="w-28" priority />
              <span className="block truncate text-xs font-bold text-muted">
                {profile.displayName}
              </span>
            </span>
          </Link>
          <button
            aria-controls="mobile-rewards-navigation"
            aria-expanded={rewardsNavOpen}
            aria-label="Open rewards navigation"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,.7)] ring-1 ring-amber-200/80 transition hover:from-amber-100 hover:to-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            onClick={() => setRewardsNavOpen(true)}
            type="button"
          >
            <AchievementMedalIcon className="size-7 drop-shadow-sm" />
          </button>
        </div>
      </header>

      <div
        aria-hidden={!rewardsNavOpen}
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          rewardsNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setRewardsNavOpen(false)}
      />
      <aside
        aria-label="Student rewards navigation"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(92vw,24rem)] flex-col bg-slate-50 shadow-[-20px_0_55px_rgba(15,23,42,0.22)] transition-transform duration-300 ease-out lg:hidden",
          rewardsNavOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
        id="mobile-rewards-navigation"
        role="dialog"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 bg-slate-50 px-4 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <button
            className="group inline-flex min-h-11 items-center gap-2.5 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-orange-50/70 px-3 text-sm font-bold text-red-700 shadow-sm transition hover:border-red-200 hover:from-red-100 hover:to-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35"
            onClick={() => setSignOutOpen(true)}
            type="button"
          >
            <span className="grid size-8 place-items-center rounded-xl bg-white text-red-600 ring-1 ring-red-100 transition group-hover:bg-red-600 group-hover:text-white group-hover:ring-red-600">
              <LogOut aria-hidden="true" className="size-4" strokeWidth={2.5} />
            </span>
            Sign out
          </button>
          <button
            aria-label="Close rewards navigation"
            className="grid size-11 place-items-center rounded-2xl bg-white text-text-secondary shadow-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setRewardsNavOpen(false)}
            type="button"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {rewardsNavOpen ? <GamificationArena idPrefix="mobile-" /> : null}
        </div>
      </aside>

      <aside className="sticky top-0 z-20 hidden border-b border-white/80 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur lg:block lg:h-screen lg:border-b-0 lg:border-r lg:border-slate-200/80">
        <div className="flex h-full flex-col gap-4 p-4 lg:gap-5 lg:p-5">
          <Link
            className="flex min-h-14 items-center gap-3 rounded-2xl px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            href="/dashboard"
          >
            <span>
              <SkulKidLogo className="w-40" priority />
              <span className="block text-xs font-bold text-muted">Student Space</span>
            </span>
          </Link>

          <div className="hidden rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:block">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center overflow-hidden rounded-2xl bg-white text-lg font-black text-primary shadow-sm">
                <CharacterAvatar avatar={profile.avatar} className="size-11 rounded-2xl" label={`${profile.displayName}'s avatar`} />
              </div>
              <div>
                <p className="font-bold text-text-primary">{profile.displayName}</p>
                <p className="text-sm text-muted">{studentLevel.title}</p>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar label="Next level" value={studentLevel.progressToNextLevel} />
            </div>
          </div>

          <nav aria-label="Student navigation" className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:gap-1 lg:overflow-visible lg:pb-0">
            <p className="hidden px-3 pb-1 pt-2 text-xs font-black uppercase tracking-normal text-muted lg:block">
              Learn
            </p>
            {navItems.map((item) => (
              <StudentNavLink active={activeItem === item.id} item={item} key={item.id} />
            ))}
          </nav>

          <div className="mt-auto hidden border-t border-slate-200/90 pt-4 lg:block">
            <button
              className="group flex w-full min-h-12 items-center gap-3 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-orange-50/70 px-3 text-left text-sm font-bold text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition duration-200 hover:border-red-200 hover:from-red-100 hover:to-orange-50 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35 active:scale-[0.98]"
              onClick={() => setSignOutOpen(true)}
              type="button"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-red-600 shadow-sm ring-1 ring-red-100 transition duration-200 group-hover:bg-red-600 group-hover:text-white group-hover:ring-red-600">
                <LogOut aria-hidden="true" className="size-4" strokeWidth={2.5} />
              </span>
              <span className="min-w-0">
                <span className="block leading-tight">Sign out</span>
                <span className="block text-[11px] font-semibold text-red-600/70 group-hover:text-red-700/80">
                  End this session
                </span>
              </span>
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:pt-8 lg:p-8">
        {children}
      </div>

      <nav
        aria-label="Mobile student navigation"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 rounded-[1.6rem] border border-white/90 bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-4 gap-1">
          {navItems.filter((item) => ["dashboard", "courses", "leaderboard", "profile"].includes(item.id)).map((item) => (
            <MobileNavLink active={activeItem === item.id} item={item} key={item.id} />
          ))}
        </div>
      </nav>
    </div>
  );
}

type StudentNavLinkProps = {
  active: boolean;
  item: {
    href: string;
    label: string;
    icon: LucideIcon;
  };
};

function StudentNavLink({ active, item }: StudentNavLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:w-full",
        active
          ? "bg-primary text-white shadow-sm"
          : "text-text-secondary hover:bg-slate-100 hover:text-text-primary"
      )}
      href={item.href}
    >
      <Icon aria-hidden="true" className="size-5" />
      {item.label}
    </Link>
  );
}

type MobileNavLinkProps = {
  active: boolean;
  item: {
    href: string;
    mobileLabel: string;
    icon: LucideIcon;
  };
};

function MobileNavLink({ active, item }: MobileNavLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "bg-primary text-white shadow-sm"
          : "text-text-secondary hover:bg-slate-100 hover:text-text-primary"
      )}
      href={item.href}
    >
      <Icon aria-hidden="true" className="size-5" />
      <span className="max-w-full truncate">{item.mobileLabel}</span>
    </Link>
  );
}
