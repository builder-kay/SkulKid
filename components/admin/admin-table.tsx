import { cn } from "@/lib/utils";

export const adminTable = "w-full min-w-[46rem] border-separate border-spacing-0 text-left text-sm";
export const adminTableHead = "sticky top-0 z-10 bg-slate-100/95 text-[11px] font-black uppercase tracking-[.12em] text-slate-500 backdrop-blur";
export const adminTableHeadCell = "border-b border-slate-200 px-4 py-3.5 first:pl-5 last:pr-5";
export const adminTableBody = "[&_tr:last-child_td]:border-b-0";
export const adminTableRow = "group transition-colors hover:bg-emerald-50/45";
export const adminTableCell = "border-b border-slate-100 px-4 py-4 align-middle first:pl-5 last:pr-5";

export function AdminTableScroll({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-full overflow-x-auto [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin]", className)}>
      {children}
    </div>
  );
}
