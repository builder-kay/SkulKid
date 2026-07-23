import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { XpBadge } from "@/components/gamification/xp-badge";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/lib/lessons/course-summary";

const courseStyles: Record<string, string> = {
  Mathematics: "border-blue-100 bg-blue-50 text-blue-900",
  "English Language": "border-violet-100 bg-violet-50 text-violet-900",
  Science: "border-green-100 bg-green-50 text-green-900"
};

const courseAccentStyles: Record<string, string> = {
  Mathematics: "from-blue-600 to-blue-500",
  "English Language": "from-violet-600 to-violet-500",
  Science: "from-green-700 to-green-600"
};

export type CourseCardProps = {
  course: CourseSummary;
  featured?: boolean;
};

export function CourseCard({ course, featured = false }: CourseCardProps) {
  const subject = course.subject;

  return (
    <Link
      aria-label={`Open ${subject.name} course`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      href={`/courses/${subject.slug}`}
    >
      <SkulKidCard
        className={cn(
          "relative flex h-full flex-col gap-5 overflow-hidden p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-card-hover)]",
          featured && "border-blue-200"
        )}
      >
      <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", courseAccentStyles[subject.name])} />
      <div className="flex items-start justify-between gap-4">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-2xl border transition group-hover:scale-105",
            courseStyles[subject.name]
          )}
        >
          <BookOpen aria-hidden="true" className="size-6" />
        </div>
        <XpBadge xp={course.totalXp} />
      </div>

      <div className="space-y-2 pt-1">
        <h2 className="text-2xl font-bold text-text-primary">{subject.name}</h2>
        <p className="min-h-14 leading-7 text-text-secondary">{subject.description}</p>
      </div>

      <div className="space-y-4">
        <ProgressBar label="Course progress" value={course.progressPercent} />
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-bold text-text-primary">{course.totalLessons}</p>
            <p className="text-muted">Lessons</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-bold text-text-primary">{course.unlockedLessons}</p>
            <p className="text-muted">Open</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-bold text-text-primary">{course.totalMinutes}</p>
            <p className="text-muted">Minutes</p>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-white transition group-hover:bg-primary-dark">
          Open course
          <ArrowRight aria-hidden="true" className="size-4" />
        </span>
      </div>
      </SkulKidCard>
    </Link>
  );
}
