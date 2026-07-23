import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type StudentCrumb = {
  label: string;
  href?: string;
};

export type StudentPageNavProps = {
  backHref: string;
  backLabel: string;
  crumbs?: StudentCrumb[];
  className?: string;
  /** Light text for dark hero backgrounds */
  tone?: "default" | "onDark";
};

/** Consistent back control + optional breadcrumb trail for student pages. */
export function StudentPageNav({
  backHref,
  backLabel,
  crumbs = [],
  className,
  tone = "default"
}: StudentPageNavProps) {
  const onDark = tone === "onDark";

  return (
    <nav aria-label="Page navigation" className={cn("space-y-3", className)}>
      <Link
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          onDark
            ? "border border-white/20 bg-white/10 text-white hover:bg-white/20"
            : "border border-white bg-white/90 text-slate-700 backdrop-blur hover:-translate-x-0.5 hover:text-primary"
        )}
        href={backHref}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {backLabel}
      </Link>

      {crumbs.length > 0 ? (
        <ol className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li className="inline-flex items-center gap-1.5" key={`${crumb.label}-${index}`}>
                {index > 0 ? (
                  <ChevronRight
                    aria-hidden="true"
                    className={cn("size-3.5", onDark ? "text-white/50" : "text-slate-400")}
                  />
                ) : null}
                {crumb.href && !last ? (
                  <Link
                    className={cn(
                      "rounded-md underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      onDark ? "text-white/80 hover:text-white" : "text-primary"
                    )}
                    href={crumb.href}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className={cn(onDark ? "text-white" : "text-text-primary", last && "font-black")}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      ) : null}
    </nav>
  );
}
