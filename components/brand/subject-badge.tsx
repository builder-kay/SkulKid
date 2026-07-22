import { BookOpen } from "lucide-react";
import type { SubjectName } from "@/types/subject";

export type SubjectBadgeProps = {
  subject: SubjectName;
};

const subjectStyles: Record<SubjectName, string> = {
  Mathematics: "bg-blue-100 text-blue-900",
  "English Language": "bg-violet-100 text-violet-900",
  Science: "bg-green-100 text-green-900"
};

export function SubjectBadge({ subject }: SubjectBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-8 items-center gap-2 rounded-full px-3 text-sm font-bold ${subjectStyles[subject]}`}
    >
      <BookOpen aria-hidden="true" className="size-4" />
      {subject}
    </span>
  );
}
