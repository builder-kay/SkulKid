import { cn } from "@/lib/utils";

export type ProgressBarProps = {
  value: number;
  label: string;
  className?: string;
  labelClassName?: string;
};

export function ProgressBar({ value, label, className, labelClassName }: ProgressBarProps) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn("flex items-center justify-between text-sm font-semibold text-text-secondary", labelClassName)}>
        <span>{label}</span>
        <span>{boundedValue}%</span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={boundedValue}
        className="h-3 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${boundedValue}%` }} />
      </div>
    </div>
  );
}
