import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type XpBadgeProps = {
  xp: number;
  className?: string;
};

export function XpBadge({ xp, className }: XpBadgeProps) {
  return (
    <span
      aria-label={`${xp} experience points`}
      className={cn(
        "inline-flex min-h-8 items-center gap-1 rounded-full bg-amber-100 px-3 text-sm font-bold text-amber-900",
        className
      )}
    >
      <Zap aria-hidden="true" className="size-4" />
      {xp} XP
    </span>
  );
}
