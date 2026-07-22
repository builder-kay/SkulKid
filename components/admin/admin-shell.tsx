"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, GraduationCap, LayoutDashboard, Library, PlayCircle, Settings2, ShieldCheck, SquarePen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: Array<{ href: string; label: string; shortLabel: string; icon: LucideIcon; match: "exact" | "prefix" }> = [
  { href: "/admin", label: "Overview", shortLabel: "Home", icon: LayoutDashboard, match: "exact" },
  { href: "/admin/curriculum", label: "Curriculum", shortLabel: "Courses", icon: BookOpenCheck, match: "exact" },
  { href: "/admin/lessons", label: "Lessons", shortLabel: "Lessons", icon: Library, match: "exact" },
  { href: "/admin/lessons/new", label: "Create Lesson", shortLabel: "Create", icon: SquarePen, match: "exact" },
  { href: "/preview/lessons", label: "Lesson preview", shortLabel: "Preview", icon: PlayCircle, match: "prefix" },
  { href: "/admin/settings", label: "User Dashboard Settings", shortLabel: "Settings", icon: Settings2, match: "prefix" }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[18.5rem_1fr]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-lg lg:hidden">
        <div className="flex min-h-12 items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <span className="grid size-11 place-items-center rounded-2xl bg-violet-600"><ShieldCheck className="size-6" aria-hidden="true" /></span>
            <span><span className="block font-black">SkulKid</span><span className="block text-xs font-bold text-slate-300">Admin Workspace</span></span>
          </Link>
          <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-amber-950">Development preview</span>
        </div>
      </header>

      <aside className="sticky top-0 hidden h-screen border-r border-slate-800 bg-slate-950 text-white lg:block">
        <div className="flex h-full flex-col p-5">
          <Link href="/admin" className="flex min-h-14 items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <span className="grid size-12 place-items-center rounded-2xl bg-violet-600 shadow-lg"><ShieldCheck className="size-6" aria-hidden="true" /></span>
            <span><span className="block text-lg font-black">SkulKid</span><span className="block text-xs font-bold text-slate-400">Admin Workspace</span></span>
          </Link>
          <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4"><p className="text-xs font-black uppercase tracking-wide text-amber-300">Development preview</p><p className="mt-2 text-sm leading-6 text-slate-300">Authentication and administrator roles are required before production use.</p></div>
          <nav aria-label="Admin navigation" className="mt-6 grid gap-1.5">
            <p className="px-3 pb-1 text-xs font-black uppercase tracking-wider text-slate-500">Manage</p>
            {navItems.map((item) => <AdminNavLink key={item.href} item={item} active={item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href)} />)}
          </nav>
          <div className="mt-auto border-t border-slate-800 pt-4"><Link href="/dashboard" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-300 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><GraduationCap className="size-5" aria-hidden="true" />Open student experience</Link></div>
        </div>
      </aside>

      <div className="min-w-0 px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:p-8">{children}</div>

      <nav aria-label="Mobile admin navigation" className="fixed inset-x-3 bottom-3 z-40 rounded-[1.6rem] border border-slate-700 bg-slate-950/95 p-2 shadow-2xl backdrop-blur lg:hidden"><div className="grid grid-cols-6 gap-1">{navItems.map((item) => { const Icon = item.icon; const active = item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white", active ? "bg-violet-600 text-white" : "text-slate-300 hover:bg-slate-800")}><Icon className="size-5" aria-hidden="true" /><span className="truncate">{item.shortLabel}</span></Link>; })}</div></nav>
    </div>
  );
}

function AdminNavLink({ item, active }: { item: (typeof navItems)[number]; active: boolean }) {
  const Icon = item.icon;
  return <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white", active ? "bg-violet-600 text-white shadow-lg" : "text-slate-300 hover:bg-slate-900 hover:text-white")}><Icon className="size-5" aria-hidden="true" />{item.label}</Link>;
}

