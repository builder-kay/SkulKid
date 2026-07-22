import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "raised" | "inset";
};

export function Surface({ className, variant = "default", ...props }: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-default",
        variant === "default" && "bg-bg-surface",
        variant === "raised" && "bg-bg-raised shadow-[var(--shadow-card)]",
        variant === "inset" && "bg-bg-inset shadow-[var(--shadow-inset)]",
        className
      )}
      {...props}
    />
  );
}
