import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SkulKidCardProps = HTMLAttributes<HTMLDivElement>;

export function SkulKidCard({ className, ...props }: SkulKidCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/90 bg-card shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    />
  );
}
