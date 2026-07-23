import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Calculator, CheckCircle2, Clock3, FlaskConical, GraduationCap, Languages, LockKeyhole, Play, Sparkles, Trophy } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/lib/lessons/course-summary";

const courseThemes: Record<string, { hero: string; icon: React.ElementType }> = {
  Mathematics: { hero: "from-blue-700 via-blue-600 to-cyan-500", icon: Calculator },
  "English Language": { hero: "from-violet-700 via-purple-600 to-fuchsia-500", icon: Languages },
  Science: { hero: "from-emerald-700 via-green-600 to-teal-500", icon: FlaskConical }
};

export type CourseCardProps = {
  course: CourseSummary;
  featured?: boolean;
  grade?: number;
};

export function CourseCard({ course, featured = false, grade }: CourseCardProps) {
  const subject = course.subject;
  const theme = courseThemes[subject.name] ?? { hero: "from-slate-800 via-slate-700 to-indigo-600", icon: BookOpen };
  const SubjectIcon = theme.icon;
  const completed = course.progressPercent >= 100;
  const started = course.progressPercent > 0;
  const action = completed ? "Review course" : started ? "Continue course" : "Start course";

  return (
    <Link
      aria-label={`${action}: ${subject.name}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      href={`/courses/${subject.slug}`}
    >
      <SkulKidCard className={cn("relative flex h-full flex-col overflow-hidden border-slate-200 bg-white transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_50px_rgba(15,23,42,.14)]", featured && "ring-2 ring-blue-100")}>
        <div className={cn("relative min-h-40 overflow-hidden bg-gradient-to-br p-5 text-white", theme.hero)}>
          <span className="pointer-events-none absolute -right-7 -top-8 size-32 rounded-full bg-white/15" />
          <span className="pointer-events-none absolute -bottom-12 right-16 size-28 rounded-full border-[18px] border-white/10" />
          {subject.coverUrl ? <Image alt="" className="object-cover opacity-25 mix-blend-overlay transition duration-500 group-hover:scale-105" fill src={subject.coverUrl} unoptimized /> : null}
          <div className="relative flex items-start justify-between gap-3">
            <span className="grid size-14 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <SubjectIcon aria-hidden="true" className="size-7" />
            </span>
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black ring-1 ring-white/20 backdrop-blur"><GraduationCap className="size-3.5" />{grade ? `Grade ${grade}` : gradeLabel(subject.gradeLevels)}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/20 px-3 py-1.5 text-xs font-black backdrop-blur"><Trophy className="size-3.5 text-amber-300" />{course.totalXp} XP</span>
            </div>
          </div>
          <div className="relative mt-5">
            <p className="text-xs font-black uppercase tracking-[.16em] text-white/70">{started ? "Continue your path" : "New learning quest"}</p>
            <h2 className="mt-1 text-2xl font-black">{subject.name}</h2>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="line-clamp-2 min-h-12 text-sm leading-6 text-text-secondary">{subject.description}</p>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 text-xs font-black">
              <span className="flex items-center gap-2 text-slate-700">{completed ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Sparkles className="size-4 text-violet-600" />}{completed ? "Course complete" : "Adventure progress"}</span>
              <span className={completed ? "text-emerald-700" : "text-violet-700"}>{course.progressPercent}%</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", completed ? "from-emerald-500 to-green-400" : theme.hero)} style={{ width: `${course.progressPercent}%` }} />
            </div>
            <p className="mt-2 text-xs font-semibold text-muted">{course.completedLessons} of {course.totalLessons} lessons cleared</p>
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 py-3 text-center">
            <MiniStat icon={BookOpen} value={course.totalLessons} label="Lessons" />
            <MiniStat icon={LockKeyhole} value={course.unlockedLessons} label="Open" />
            <MiniStat icon={Clock3} value={course.totalMinutes} label="Minutes" />
          </div>

          <div className="mt-auto pt-5">
            <span className={cn("inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 font-black text-white shadow-sm transition", completed ? "bg-emerald-600 group-hover:bg-emerald-500" : "bg-slate-950 group-hover:bg-primary")}>
              {completed ? <CheckCircle2 className="size-5" /> : <Play className="size-5 fill-current" />}
              {action}
              <ArrowRight aria-hidden="true" className="ml-auto size-4" />
            </span>
          </div>
        </div>
      </SkulKidCard>
    </Link>
  );
}

function MiniStat({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return <div className="px-2"><Icon className="mx-auto size-4 text-muted" /><b className="mt-1 block text-base text-text-primary">{value}</b><span className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</span></div>;
}

function gradeLabel(grades?: number[]) {
  if (!grades?.length) return "All grades";
  const sorted = [...grades].sort((a, b) => a - b);
  return sorted.length === 1 ? `Grade ${sorted[0]}` : `Grades ${sorted[0]}–${sorted.at(-1)}`;
}
