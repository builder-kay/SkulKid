import { Trophy } from "lucide-react";
import { getLevelTitle } from "@/lib/gamification/calculate-level";

export type LevelBadgeProps = {
  level: number;
};

export function LevelBadge({ level }: LevelBadgeProps) {
  return (
    <span
      aria-label={`Level ${level}, ${getLevelTitle(level)}`}
      className="inline-flex min-h-8 items-center gap-2 rounded-full bg-violet-100 px-3 text-sm font-bold text-violet-900"
    >
      <Trophy aria-hidden="true" className="size-4" />
      Level {level}
    </span>
  );
}
