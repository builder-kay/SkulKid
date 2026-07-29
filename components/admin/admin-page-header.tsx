import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  tone = "light",
  className
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <header className={cn(
      "relative isolate overflow-hidden rounded-[1.75rem] border p-5 shadow-[0_18px_50px_rgba(15,23,42,.08)] sm:p-7",
      dark
        ? "border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white"
        : "border-white/80 bg-white/90 text-slate-950 backdrop-blur",
      className
    )}>
      <div className={cn("absolute -right-16 -top-24 -z-10 size-64 rounded-full blur-3xl", dark ? "bg-emerald-500/20" : "bg-emerald-200/45")} />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon ? <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl ring-1", dark ? "bg-white/10 text-emerald-300 ring-white/10" : "bg-emerald-50 text-emerald-800 ring-emerald-100")}><Icon className="size-6" /></span> : null}
          <div className="min-w-0">
            <p className={cn("text-[11px] font-black uppercase tracking-[.18em]", dark ? "text-emerald-300" : "text-emerald-700")}>{eyebrow}</p>
            <h1 className="mt-1.5 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <p className={cn("mt-2 max-w-3xl text-sm leading-6 sm:text-base", dark ? "text-slate-300" : "text-slate-600")}>{description}</p>
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
      </div>
    </header>
  );
}
