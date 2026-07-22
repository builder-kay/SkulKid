"use client";

import Link from "next/link";
import Image from "next/image";
import { Award, BookOpen, GraduationCap, LayoutDashboard, Trophy, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProgressBar } from "@/components/shared/progress-bar";
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
  ,{ id: "profile", href: "/profile", label: "My Profile", mobileLabel: "Profile", icon: UserRound }
];

export function StudentShell({ activeItem, children }: StudentShellProps) {
  const { state } = useStudentGame();
  const { profile } = useStudentProfile();
  const studentLevel = getStudentLevel(state.xp);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[18.5rem_1fr]">
      <header className="sticky top-0 z-30 border-b border-white/80 bg-white/90 px-4 py-3 shadow-[0_8px_28px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="flex min-h-12 items-center justify-between gap-3">
          <Link
            className="flex min-w-0 items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            href="/dashboard"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
              <GraduationCap aria-hidden="true" className="size-6" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-black text-text-primary">SkulKid</span>
              <span className="block truncate text-xs font-bold text-muted">
                {profile.displayName}
              </span>
            </span>
          </Link>
          <div className="rounded-2xl bg-blue-50 px-3 py-2 text-right">
            <p className="text-xs font-bold text-blue-900/75">Level</p>
            <p className="text-lg font-black leading-5 text-blue-900">{studentLevel.level}</p>
          </div>
        </div>
      </header>

      <aside className="sticky top-0 z-20 hidden border-b border-white/80 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur lg:block lg:h-screen lg:border-b-0 lg:border-r lg:border-slate-200/80">
        <div className="flex h-full flex-col gap-4 p-4 lg:gap-5 lg:p-5">
          <Link
            className="flex min-h-14 items-center gap-3 rounded-2xl px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            href="/dashboard"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
              <GraduationCap aria-hidden="true" className="size-6" />
            </span>
            <span>
              <span className="block text-lg font-black text-text-primary">SkulKid</span>
              <span className="block text-xs font-bold text-muted">Student Space</span>
            </span>
          </Link>

          <div className="hidden rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:block">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-white text-lg font-black text-primary shadow-sm">
                {profile.avatarUrl ? <Image alt="Student profile" className="rounded-2xl object-cover" height={44} src={profile.avatarUrl} unoptimized width={44} /> : profile.displayName.charAt(0)}
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
