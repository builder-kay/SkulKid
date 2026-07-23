import { cn } from "@/lib/utils";
import { BookOpen, Brain, CheckCircle2, Compass, Lightbulb, type LucideIcon } from "lucide-react";
import type { LessonBlock } from "@/types/lesson";

export type LessonBlockShellProps = {
  block: LessonBlock;
  children: React.ReactNode;
  className?: string;
};

export function LessonBlockShell({ block, children, className }: LessonBlockShellProps) {
  const presentation: Record<string, { label: string; icon: LucideIcon; badge: string; accent: string; glow: string }> = {
    introduction: { label: "Mission briefing", icon: Compass, badge: "bg-blue-100 text-blue-800", accent: "bg-blue-500", glow: "from-blue-50/80" },
    text: { label: "Learn the skill", icon: BookOpen, badge: "bg-violet-100 text-violet-800", accent: "bg-violet-500", glow: "from-violet-50/80" },
    example: { label: "See it in action", icon: Lightbulb, badge: "bg-amber-100 text-amber-900", accent: "bg-amber-400", glow: "from-amber-50/80" },
    multiple_choice: { label: "Quick challenge", icon: Brain, badge: "bg-fuchsia-100 text-fuchsia-800", accent: "bg-fuchsia-500", glow: "from-fuchsia-50/70" },
    true_false: { label: "True or false", icon: Brain, badge: "bg-fuchsia-100 text-fuchsia-800", accent: "bg-fuchsia-500", glow: "from-fuchsia-50/70" },
    fill_blank: { label: "Fill the gap", icon: Brain, badge: "bg-fuchsia-100 text-fuchsia-800", accent: "bg-fuchsia-500", glow: "from-fuchsia-50/70" },
    summary: { label: "Victory recap", icon: CheckCircle2, badge: "bg-emerald-100 text-emerald-800", accent: "bg-emerald-500", glow: "from-emerald-50/80" }
  };
  const style = presentation[block.type] ?? presentation.text;
  const Icon = style.icon;
  return (
    <section
      aria-labelledby={`${block.id}-label`}
      className={cn(
        `relative overflow-hidden rounded-[1.75rem] border border-white/90 bg-gradient-to-br ${style.glow} via-white to-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] transition hover:shadow-[0_20px_55px_rgba(15,23,42,0.12)] sm:p-7`,
        className
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1.5", style.accent)} aria-hidden="true" />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span
          className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wider", style.badge)}
          id={`${block.id}-label`}
        >
          <Icon className="size-4" aria-hidden="true" />
          {style.label}
        </span>
        <span className="ml-auto text-xs font-black uppercase tracking-wider text-muted">Stage {block.order}</span>
      </div>
      {children}
    </section>
  );
}
