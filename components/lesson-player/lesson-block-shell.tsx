import { cn } from "@/lib/utils";
import type { LessonBlock } from "@/types/lesson";

export type LessonBlockShellProps = {
  block: LessonBlock;
  children: React.ReactNode;
  className?: string;
};

export function LessonBlockShell({ block, children, className }: LessonBlockShellProps) {
  return (
    <section
      aria-labelledby={`${block.id}-label`}
      className={cn(
        "rounded-2xl border border-white/80 bg-card p-5 shadow-[0_12px_30px_rgba(15,23,42,0.07)] sm:p-6",
        className
      )}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span
          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-normal text-muted"
          id={`${block.id}-label`}
        >
          {block.type.replaceAll("_", " ")}
        </span>
        <span className="text-sm font-semibold text-text-secondary">Block {block.order}</span>
      </div>
      {children}
    </section>
  );
}
