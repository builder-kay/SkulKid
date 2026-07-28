"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BookOpenCheck,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  RadioTower,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  Wrench,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";
import { SignOutConfirmation } from "@/components/shared/sign-out-confirmation";
import { cn } from "@/lib/utils";

const navItems: Array<{ href: string; label: string; shortLabel: string; icon: LucideIcon; match: "exact" | "prefix" }> = [
  { href: "/admin", label: "Overview", shortLabel: "Home", icon: LayoutDashboard, match: "exact" },
  { href: "/admin/users", label: "People", shortLabel: "People", icon: Users, match: "prefix" },
  { href: "/admin/courses", label: "Learning & classes", shortLabel: "Learning", icon: GraduationCap, match: "prefix" },
  { href: "/admin/moderation", label: "Content moderation", shortLabel: "Review", icon: BookOpenCheck, match: "prefix" },
  { href: "/admin/security", label: "Security & audit", shortLabel: "Security", icon: ShieldCheck, match: "prefix" },
  { href: "/admin/operations", label: "Operations", shortLabel: "Ops", icon: Wrench, match: "prefix" },
  { href: "/admin/otp-diagnostics", label: "OTP diagnostics", shortLabel: "OTP", icon: RadioTower, match: "prefix" },
  { href: "/admin/activity", label: "Platform activity", shortLabel: "Activity", icon: Activity, match: "prefix" },
  { href: "/admin/settings", label: "System settings", shortLabel: "Settings", icon: Settings2, match: "prefix" }
];

export function PlatformAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentItem = navItems.find((item) => item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href));
  const primaryMobileItems = navItems.slice(0, 4);
  const secondaryMobileItems = navItems.slice(4);

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[18.5rem_1fr]">
      <SignOutConfirmation open={signOutOpen} onClose={() => setSignOutOpen(false)} />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-lg lg:hidden">
        <div className="flex min-h-12 items-center justify-between gap-3">
          <Link className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" href="/admin">
            <span className="min-w-0">
              <span className="inline-flex rounded-xl bg-white px-2 py-1"><SkulKidLogo className="w-28" priority /></span>
              <span className="mt-1 block truncate text-xs font-bold text-slate-300">{currentItem?.label ?? "Admin Center"}</span>
            </span>
          </Link>
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"}
            className="grid size-11 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-slate-100"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      <aside className="sticky top-0 hidden h-screen border-r border-slate-800 bg-slate-950 text-white lg:block">
        <div className="flex h-full flex-col p-5">
          <Link className="flex min-h-14 items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" href="/admin">
            <span>
              <span className="inline-flex rounded-xl bg-white px-2 py-1 shadow-lg"><SkulKidLogo className="w-36" priority /></span>
              <span className="mt-1 block text-xs font-bold text-slate-400">Platform Admin</span>
            </span>
          </Link>
          <form action="/admin/users" className="relative mt-6">
            <label className="sr-only" htmlFor="global-admin-search">Search people</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input id="global-admin-search" name="q" className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 pl-10 pr-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30" placeholder="Search people…" />
          </form>
          <nav aria-label="Platform admin navigation" className="mt-5 grid gap-1.5">
            <p className="px-3 pb-1 text-xs font-black uppercase tracking-wider text-slate-500">Admin Center</p>
            {navItems.map((item) => {
              const active = item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                    active ? "bg-emerald-600 text-white shadow-lg" : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto grid gap-3 border-t border-slate-800 pt-4">
            <Link className="rounded-xl px-3 py-2 text-sm font-bold text-slate-400 transition hover:bg-slate-900 hover:text-white" href="/teacher">
              Open teacher workspace →
            </Link>
            <button
              className="group flex min-h-12 w-full items-center gap-3 rounded-2xl border border-red-900/55 bg-gradient-to-br from-red-950/55 to-slate-950 px-3 text-left text-sm font-bold text-red-200 transition hover:border-red-800 hover:from-red-950/80 hover:to-slate-900 hover:text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
              onClick={() => setSignOutOpen(true)}
              type="button"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-red-300 ring-1 ring-red-900/70 group-hover:bg-red-600 group-hover:text-white">
                <LogOut className="size-4" strokeWidth={2.5} />
              </span>
              <span>
                <span className="block leading-tight">Sign out</span>
                <span className="block text-[11px] font-semibold text-red-300/65">End this session</span>
              </span>
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:p-8">{children}</div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/55 p-3 backdrop-blur-sm lg:hidden" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setMobileMenuOpen(false);
        }}>
          <section aria-label="Admin menu" className="ml-auto flex h-full w-full max-w-sm flex-col rounded-[1.75rem] bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Navigation</p>
                <h2 className="mt-1 text-xl font-black">Admin Center</h2>
              </div>
              <button aria-label="Close admin menu" className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700" onClick={() => setMobileMenuOpen(false)} type="button"><X className="size-5" /></button>
            </div>
            <nav className="mt-4 grid gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 font-bold", active ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-700")} href={item.href} key={item.href} onClick={() => setMobileMenuOpen(false)}>
                    <span className={cn("grid size-9 place-items-center rounded-lg", active ? "bg-white/15" : "bg-white")}><Icon className="size-4.5" /></span>
                    <span className="flex-1">{item.label}</span><ChevronRight className="size-4" />
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto grid gap-2 border-t border-slate-200 pt-4">
              <Link className="min-h-11 rounded-xl bg-violet-50 px-4 py-3 text-sm font-bold text-violet-800" href="/teacher">Open teacher workspace →</Link>
              <button className="flex min-h-11 items-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-bold text-red-700" onClick={() => { setMobileMenuOpen(false); setSignOutOpen(true); }} type="button"><LogOut className="size-4" />Sign out</button>
            </div>
          </section>
        </div>
      ) : null}

      <nav aria-label="Mobile platform admin navigation" className="fixed inset-x-3 bottom-3 z-40 rounded-[1.6rem] border border-slate-700 bg-slate-950/95 p-2 shadow-2xl backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {primaryMobileItems.map((item) => {
            const Icon = item.icon;
            const active = item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-black",
                  active ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-800"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-5" />
                <span className="truncate">{item.shortLabel}</span>
              </Link>
            );
          })}
          <button
            className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-black", secondaryMobileItems.some((item) => pathname.startsWith(item.href)) ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-800")}
            onClick={() => setMobileMenuOpen(true)}
            type="button"
          >
            <Menu className="size-5" /><span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
