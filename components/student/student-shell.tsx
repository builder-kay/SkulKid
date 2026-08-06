"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Award, BookMarked, BookOpen, ClipboardList, Flame, LayoutDashboard, LogOut, Menu, MessageCircle, Trophy, UserRound, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GamificationArena } from "@/components/gamification/gamification-arena";
import { CharacterAvatar } from "@/components/student/character-avatar";
import { StudentCelebrationHost } from "@/components/student/student-celebration-host";
import { AchievementMedalIcon } from "@/components/shared/achievement-medal-icon";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";
import { SignOutConfirmation } from "@/components/shared/sign-out-confirmation";
import { getStudentLevel } from "@/lib/gamification/calculate-level";
import { cn } from "@/lib/utils";
import {
  streakLostEvent,
  takeStreakLostNotice,
  useStudentGame,
  type StreakLostDetail
} from "@/lib/gamification/student-game";
import { useStudentProfile } from "@/lib/student/student-profile";

import {
  BUTTON_SOUND_CHANGE_EVENT,
  installButtonClickSounds,
  isButtonSoundEnabled,
  playButtonClickSound
} from "@/lib/student/ui-sounds";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export type StudentNavItem = "dashboard" | "courses" | "classes" | "messages" | "pasco" | "break-zone" | "mathematics" | "preview" | "leaderboard" | "achievements" | "profile";

export type StudentShellProps = {
  activeItem: StudentNavItem;
  children: React.ReactNode;
  /** Replaces the mobile rewards drawer content (e.g. class leaderboard). */
  mobileAside?: React.ReactNode;
};

const navItems: Array<{
  id: StudentNavItem;
  href: string;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
}> = [
  { id: "dashboard", href: "/dashboard", label: "Home", mobileLabel: "Home", icon: LayoutDashboard },
  { id: "courses", href: "/courses", label: "Explore", mobileLabel: "Explore", icon: BookOpen },
  { id: "classes", href: "/classes", label: "My Classes", mobileLabel: "Classes", icon: Users },
  { id: "messages", href: "/messages", label: "Chats", mobileLabel: "Chats", icon: MessageCircle },
  { id: "pasco", href: "/pasco", label: "PASCO", mobileLabel: "PASCO", icon: BookMarked },
  { id: "leaderboard", href: "/leaderboard", label: "Leaderboard", mobileLabel: "League", icon: Trophy },
  { id: "achievements", href: "/achievements", label: "Rewards", mobileLabel: "Rewards", icon: Award },
  { id: "profile", href: "/profile", label: "My Avatar", mobileLabel: "Avatar", icon: UserRound }
];

const mobilePrimaryNavItems = (["dashboard", "classes", "courses", "messages"] as const)
  .map((id) => navItems.find((item) => item.id === id))
  .filter((item): item is (typeof navItems)[number] => Boolean(item));


export function StudentShell({ activeItem, children, mobileAside }: StudentShellProps) {
  const [rewardsNavOpen, setRewardsNavOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadClassMessages, setUnreadClassMessages] = useState(0);
  const [chatAlert, setChatAlert] = useState<{ classId: string; body: string } | null>(null);
  const [streakAlert, setStreakAlert] = useState<StreakLostDetail | null>(null);
  const soundEnabledRef = useRef(true);
  const buttonSoundEnabledRef = useRef(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const { state } = useStudentGame();
  const { profile } = useStudentProfile();
  const studentLevel = getStudentLevel(state.xp);

  useEffect(() => {
    const sound = window.localStorage.getItem("skulkid:class-chat-sound") !== "off";
    soundEnabledRef.current = sound;
    function updateSound(event: Event) {
      const enabled = (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled;
      if (typeof enabled !== "boolean") return;
      soundEnabledRef.current = enabled;
      window.localStorage.setItem("skulkid:class-chat-sound", enabled ? "on" : "off");
      if (enabled) playClassChatSound(audioContextRef);
    }
    window.addEventListener("skulkid:class-chat-sound-change", updateSound);
    return () => window.removeEventListener("skulkid:class-chat-sound-change", updateSound);
  }, []);

  useEffect(() => {
    buttonSoundEnabledRef.current = isButtonSoundEnabled();
    function updateButtonSound(event: Event) {
      const enabled = (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled;
      if (typeof enabled !== "boolean") return;
      buttonSoundEnabledRef.current = enabled;
      if (enabled) playButtonClickSound();
    }
    window.addEventListener(BUTTON_SOUND_CHANGE_EVENT, updateButtonSound);
    const uninstall = installButtonClickSounds(() => buttonSoundEnabledRef.current);
    return () => {
      window.removeEventListener(BUTTON_SOUND_CHANGE_EVENT, updateButtonSound);
      uninstall();
    };
  }, []);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;
      channel = supabase
        .channel(`student-global-class-chat:${user.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "ClassMessage" }, (payload) => {
          const message = payload.new as { classId?: string; body?: string; senderId?: string; scope?: string };
          if (message.scope !== "class_room" || message.senderId === user.id || !message.classId) return;
          if (activeItem !== "messages") {
            setUnreadClassMessages((count) => count + 1);
            setChatAlert({ classId: message.classId, body: message.body || "A new message was posted in your class discussion." });
          }
          if (soundEnabledRef.current) playClassChatSound(audioContextRef);
        })
        .subscribe();
    });
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [activeItem]);

  useEffect(() => {
    function showStreakLostNotice() {
      const detail = takeStreakLostNotice();
      if (detail) setStreakAlert(detail);
    }
    showStreakLostNotice();
    window.addEventListener(streakLostEvent, showStreakLostNotice);
    return () => window.removeEventListener(streakLostEvent, showStreakLostNotice);
  }, []);

  useEffect(() => {
    if (!rewardsNavOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setRewardsNavOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [rewardsNavOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const panel = morePanelRef.current;
    const first = panel?.querySelector<HTMLElement>("a,button");
    first?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreOpen(false);
        moreButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>('a,button:not([disabled])')];
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [moreOpen]);

  function closeSignOut() {
    setSignOutOpen(false);
    window.setTimeout(() => {
      if (window.matchMedia("(max-width: 1023px)").matches) moreButtonRef.current?.focus();
    }, 0);
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[18.5rem_1fr]">
      <StudentCelebrationHost avatar={profile.avatar} learnerName={profile.username} />
      <SignOutConfirmation audience="student" open={signOutOpen} onClose={closeSignOut} />
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
            aria-label={mobileAside ? "Open class leaderboard" : "Open rewards navigation"}
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
        aria-label={mobileAside ? "Class leaderboard navigation" : "Student rewards navigation"}
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(92vw,24rem)] flex-col bg-slate-50 shadow-[-20px_0_55px_rgba(15,23,42,0.22)] transition-transform duration-300 ease-out lg:hidden",
          rewardsNavOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
        id="mobile-rewards-navigation"
        role="dialog"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 bg-slate-50 px-4 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <p className="text-sm font-black text-slate-800">{mobileAside ? "Class board" : "Rewards"}</p>
          <button
            aria-label="Close rewards navigation"
            className="grid size-11 place-items-center rounded-2xl bg-white text-text-secondary shadow-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setRewardsNavOpen(false)}
            type="button"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          {rewardsNavOpen ? (mobileAside ?? <GamificationArena idPrefix="mobile-" />) : null}
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
              <span className="block text-xs font-bold text-muted">Your adventure</span>
            </span>
          </Link>

          <div className="hidden rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:block">
            <div className="flex items-center gap-3">
              <Link
                aria-label={`Open ${profile.username}'s avatar page`}
                className="grid size-11 place-items-center overflow-hidden rounded-2xl bg-white text-lg font-black text-primary shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                href="/profile"
              >
                <CharacterAvatar avatar={profile.avatar} className="size-11 rounded-2xl" label={`${profile.username}'s avatar`} motion="idle" />
              </Link>
              <div>
                <p className="font-bold text-text-primary">@{profile.username}</p>
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
              <StudentNavLink active={activeItem === item.id} item={item} key={item.id} unread={item.id === "messages" ? unreadClassMessages : 0} />
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

      {chatAlert ? <aside aria-live="polite" className="fixed inset-x-3 top-20 z-[60] mx-auto max-w-md rounded-2xl border border-blue-200 bg-white p-3 shadow-2xl sm:right-5 sm:left-auto sm:top-5 sm:w-[25rem]"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700"><MessageCircle className="size-5" /></span><div className="min-w-0 flex-1"><p className="font-black text-slate-950">New class chat!</p><p className="mt-1 line-clamp-2 text-sm text-slate-600">{chatAlert.body}</p><Link className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-blue-700 px-3 text-xs font-black text-white" href={`/messages?classId=${encodeURIComponent(chatAlert.classId)}`} onClick={() => { setChatAlert(null); setUnreadClassMessages(0); }}>Open chat</Link></div><button aria-label="Dismiss class message notification" className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => setChatAlert(null)} type="button"><X className="size-4" /></button></div></aside> : null}
      {streakAlert ? <aside aria-live="polite" className="fixed inset-x-3 top-20 z-[60] mx-auto max-w-md rounded-2xl border border-orange-200 bg-white p-3 shadow-2xl sm:right-5 sm:left-auto sm:top-5 sm:w-[25rem]"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700"><Flame className="size-5" /></span><div className="min-w-0 flex-1"><p className="font-black text-slate-950">Streak paused</p><p className="mt-1 text-sm text-slate-600">Your {streakAlert.lostStreak}-day streak cooled off while you were away. Earn today&apos;s learning XP to light a new flame!</p><Link className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-orange-600 px-3 text-xs font-black text-white" href="/courses" onClick={() => setStreakAlert(null)}>Start a new streak</Link></div><button aria-label="Dismiss streak notification" className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => setStreakAlert(null)} type="button"><X className="size-4" /></button></div></aside> : null}
      <div aria-hidden={!moreOpen} className={cn("fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] transition lg:hidden", moreOpen ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setMoreOpen(false)} />
      <div aria-hidden={!moreOpen} aria-labelledby="student-more-title" aria-modal="true" className={cn("fixed inset-x-3 bottom-[calc(5.7rem+env(safe-area-inset-bottom))] z-50 max-h-[75dvh] overflow-y-auto rounded-[1.75rem] bg-white p-4 shadow-2xl transition duration-200 lg:hidden", moreOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0")} ref={morePanelRef} role="dialog">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">More fun</p><h2 className="text-xl font-black" id="student-more-title">More</h2></div><button aria-label="Close More menu" className="grid size-10 place-items-center rounded-xl bg-slate-100" onClick={() => { setMoreOpen(false); moreButtonRef.current?.focus(); }} type="button"><X className="size-5" /></button></div>
        <nav aria-label="More student pages" className="mt-4 grid gap-2">{[
          { id: "pasco" as const, href: "/pasco", label: "PASCO", text: "Practise old quizzes for fun", icon: BookMarked },
          { id: "leaderboard" as const, href: "/leaderboard", label: "Leaderboard", text: "See who's climbing the league", icon: Trophy },
          { id: "profile" as const, href: "/profile", label: "My Avatar", text: "Dress up your character", icon: UserRound },
          { id: "achievements" as const, href: "/achievements", label: "Rewards", text: "Stars, badges and gifts", icon: Award }
        ].map((item) => { const Icon = item.icon; const active = activeItem === item.id; return <Link aria-current={active ? "page" : undefined} className={cn("flex min-h-16 items-center gap-3 rounded-2xl border p-3", active ? "border-violet-400 bg-violet-50 text-violet-950" : "border-slate-200 bg-slate-50 text-slate-800")} href={item.href} key={item.id} onClick={() => setMoreOpen(false)}><span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", active ? "bg-violet-600 text-white" : "bg-white text-violet-700")}><Icon className="size-5" /></span><span><b className="block">{item.label}</b><span className="text-xs text-slate-500">{item.text}</span></span></Link>; })}
          <Link className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-800" href="/feedback/student" onClick={() => setMoreOpen(false)}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-violet-700"><ClipboardList className="size-5" /></span>
            <span><b className="block">Help make SkulKid better</b><span className="text-xs text-slate-500">A short quiz — no name needed</span></span>
          </Link>
        </nav>
        <div className="mt-3 border-t border-slate-200 pt-3">
          <button
            className="group flex min-h-16 w-full items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-left text-rose-800 transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-[0.98]"
            onClick={() => {
              setMoreOpen(false);
              setSignOutOpen(true);
            }}
            type="button"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-rose-700 shadow-sm ring-1 ring-rose-200 transition group-hover:bg-rose-700 group-hover:text-white">
              <LogOut aria-hidden="true" className="size-5" strokeWidth={2.5} />
            </span>
            <span>
              <b className="block">Sign out</b>
              <span className="text-xs font-medium text-rose-700">Finish using SkulKid on this device</span>
            </span>
          </button>
        </div>
      </div>

      <nav
        aria-label="Mobile student navigation"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 rounded-[1.6rem] border border-white/90 bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-5 gap-1">
          {mobilePrimaryNavItems.map((item) => (
            <MobileNavLink active={activeItem === item.id} item={item} key={item.id} unread={item.id === "messages" ? unreadClassMessages : 0} />
          ))}
          <button aria-expanded={moreOpen} aria-haspopup="dialog" className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", ["pasco", "leaderboard", "profile", "achievements"].includes(activeItem) ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:bg-slate-100")} onClick={() => setMoreOpen(true)} ref={moreButtonRef} type="button"><Menu className="size-5" /><span>More</span></button>
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
  unread?: number;
};

function StudentNavLink({ active, item, unread = 0 }: StudentNavLinkProps) {
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
      <span className="relative"><Icon aria-hidden="true" className="size-5" />{unread ? <span className="absolute -right-3 -top-3 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white">{Math.min(unread, 99)}</span> : null}</span>
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
  unread?: number;
};

function MobileNavLink({ active, item, unread = 0 }: MobileNavLinkProps) {
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
      <span className="relative"><Icon aria-hidden="true" className="size-5" />{unread ? <span className="absolute -right-3 -top-3 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white">{Math.min(unread, 99)}</span> : null}</span>
      <span className="max-w-full truncate">{item.mobileLabel}</span>
    </Link>
  );
}

type AudioContextWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

function playClassChatSound(audioContextRef: MutableRefObject<AudioContext | null>) {
  try {
    const AudioContextConstructor =
      window.AudioContext || (window as AudioContextWindow).webkitAudioContext;
    if (!AudioContextConstructor) return;

    const context = audioContextRef.current || new AudioContextConstructor();
    audioContextRef.current = context;

    void context.resume().then(() => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startsAt = context.currentTime;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(660, startsAt);
      oscillator.frequency.exponentialRampToValueAtTime(880, startsAt + 0.12);
      gain.gain.setValueAtTime(0.0001, startsAt);
      gain.gain.exponentialRampToValueAtTime(0.12, startsAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + 0.23);
    });
  } catch {
    // Browsers may block audio until interaction; chat remains usable without it.
  }
}
