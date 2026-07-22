import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedbackTone = "success" | "danger" | "info";

export type FeedbackPanelProps = {
  tone: FeedbackTone;
  title: string;
  children: React.ReactNode;
  className?: string;
};

const toneStyles: Record<FeedbackTone, string> = {
  success: "border-green-200 bg-green-50 text-green-900",
  danger: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900"
};

const icons: Record<FeedbackTone, React.ElementType> = {
  success: CheckCircle2,
  danger: XCircle,
  info: Info
};

export function FeedbackPanel({ tone, title, children, className }: FeedbackPanelProps) {
  const Icon = icons[tone];

  return (
    <div
      aria-live="polite"
      className={cn("rounded-xl border p-4", toneStyles[tone], className)}
      role="status"
    >
      <div className="flex gap-3">
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">{title}</p>
          <div className="mt-1 text-sm leading-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
