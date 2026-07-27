import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

export function TeacherGuideLink({
  topic,
  label = "How to use this page",
  className
}: {
  topic: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600",
        className
      )}
      href={`/teacher/tutorial?topic=${encodeURIComponent(topic)}`}
    >
      <CircleHelp aria-hidden="true" className="size-4" />
      {label}
    </Link>
  );
}
