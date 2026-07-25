"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BellRing, BookOpenCheck, LayoutDashboard, Library, LogOut, Settings2, SquarePen, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";
import { SignOutConfirmation } from "@/components/shared/sign-out-confirmation";
import { cn } from "@/lib/utils";

const navItems: Array<{ href: string; label: string; shortLabel: string; icon: LucideIcon; match: "exact" | "prefix" }> = [
  { href: "/teacher", label: "Overview", shortLabel: "Home", icon: LayoutDashboard, match: "exact" },
  { href: "/teacher/classes", label: "Classes", shortLabel: "Classes", icon: Users, match: "prefix" },
  { href: "/teacher/communications", label: "Messages", shortLabel: "Messages", icon: BellRing, match: "prefix" },
  { href: "/teacher/curriculum", label: "Curriculum", shortLabel: "Subjects", icon: BookOpenCheck, match: "exact" },
  { href: "/teacher/lessons", label: "Lessons", shortLabel: "Lessons", icon: Library, match: "exact" },
  { href: "/teacher/lessons/new", label: "Create Lesson", shortLabel: "Create", icon: SquarePen, match: "exact" },
  { href: "/teacher/settings", label: "Learner dashboard", shortLabel: "Settings", icon: Settings2, match: "prefix" }
];


export function TeacherShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [signOutOpen, setSignOutOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[18.5rem_1fr]">
      <SignOutConfirmation open={signOutOpen} onClose={() => setSignOutOpen(false)} />
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-lg lg:hidden">
        <div className="flex min-h-12 items-center justify-between">
          <Link href="/teacher" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <span>
              <span className="inline-flex rounded-xl bg-white px-2 py-1"><SkulKidLogo className="w-28" priority /></span>
              <span className="mt-1 block text-xs font-bold text-slate-300">Teacher Workspace</span>
            </span>
          </Link>
          <button
            aria-label="Sign out"
            className="grid size-11 place-items-center rounded-xl border border-red-900/50 bg-red-950/40 text-red-200 transition hover:bg-red-900/50 hover:text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
            onClick={() => setSignOutOpen(true)}
            type="button"
          >
            <LogOut aria-hidden="true" className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <aside className="sticky top-0 hidden h-screen border-r border-slate-800 bg-slate-950 text-white lg:block">
        <div className="flex h-full flex-col p-5">
          <Link href="/teacher" className="flex min-h-14 items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <span>
              <span className="inline-flex rounded-xl bg-white px-2 py-1 shadow-lg"><SkulKidLogo className="w-36" priority /></span>
              <span className="mt-1 block text-xs font-bold text-slate-400">Teacher Workspace</span>
            </span>
          </Link>
          <nav aria-label="Teacher navigation" className="mt-6 grid gap-1.5">
            <p className="px-3 pb-1 text-xs font-black uppercase tracking-wider text-slate-500">Teach</p>
            {navItems.map((item) => (
              <TeacherNavLink
                active={item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href)}
                item={item}
                key={item.href}
              />
            ))}
          </nav>
          <div className="mt-auto border-t border-slate-800 pt-4">
            <button
              className="group flex min-h-12 w-full items-center gap-3 rounded-2xl border border-red-900/55 bg-gradient-to-br from-red-950/55 to-slate-950 px-3 text-left text-sm font-bold text-red-200 transition duration-200 hover:border-red-800 hover:from-red-950/80 hover:to-slate-900 hover:text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 active:scale-[0.98]"
              onClick={() => setSignOutOpen(true)}
              type="button"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-red-300 ring-1 ring-red-900/70 transition duration-200 group-hover:bg-red-600 group-hover:text-white group-hover:ring-red-500">
                <LogOut aria-hidden="true" className="size-4" strokeWidth={2.5} />
              </span>
              <span className="min-w-0">
                <span className="block leading-tight">Sign out</span>
                <span className="block text-[11px] font-semibold text-red-300/65 group-hover:text-red-200/80">End this session</span>
              </span>
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:p-8">{children}</div>

      <nav aria-label="Mobile teacher navigation" className="fixed inset-x-3 bottom-3 z-40 rounded-[1.6rem] border border-slate-700 bg-slate-950/95 p-2 shadow-2xl backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  active ? "bg-violet-600 text-white" : "text-slate-300 hover:bg-slate-800"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" className="size-5" />
                <span className="truncate">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function TeacherNavLink({ item, active }: { item: (typeof navItems)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        active ? "bg-violet-600 text-white shadow-lg" : "text-slate-300 hover:bg-slate-900 hover:text-white"
      )}
      href={item.href}
    >
      <Icon aria-hidden="true" className="size-5" />
      {item.label}
    </Link>
  );
}
