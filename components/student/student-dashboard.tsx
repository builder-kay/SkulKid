"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Flame,
  GraduationCap,
  Medal,
  Star,
  Trophy
} from "lucide-react";
import { CourseCard } from "@/components/student/course-card";
import { GamificationArena } from "@/components/gamification/gamification-arena";
import { StudentShell } from "@/components/student/student-shell";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { subjects } from "@/data/subjects";
import { sampleStudentProgress } from "@/data/sample-student-progress";
import { getStudentLevel } from "@/lib/gamification/calculate-level";
import { getCourseSummary } from "@/lib/lessons/course-summary";
import { usePublishedLessons } from "@/lib/lessons/published-lessons";
import { useStudentGame } from "@/lib/gamification/student-game";
import { useStudentProfile } from "@/lib/student/student-profile";

export function StudentDashboard() {
  const { state } = useStudentGame();
  const { profile } = useStudentProfile();
  const completedStars = state.stars;
  const studentLevel = getStudentLevel(state.xp);
  const lessons = usePublishedLessons();
  const courseSummaries = subjects.map((subject) => getCourseSummary(subject, lessons, sampleStudentProgress));
  return (
    <StudentShell activeItem="dashboard">
      <main className="mx-auto grid w-full max-w-7xl gap-5 lg:gap-6">
        <header className="rounded-[2rem] border border-white/90 bg-white/85 p-5 shadow-[var(--shadow-card)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
              <GraduationCap aria-hidden="true" className="size-7" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-normal text-muted">SkulKid</p>
                <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
                  Hi, {profile.displayName}
                </h1>
                <p className="mt-1 text-text-secondary">Your next small win is ready.</p>
              </div>
            </div>
            <div
              aria-label={`${profile.displayName} profile photo`}
              className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-blue-100 to-violet-100 text-2xl font-black text-primary shadow-[0_8px_24px_rgba(37,99,235,0.2)] sm:size-20"
              role="img"
            >
              {profile.avatarUrl ? <Image alt="" className="size-full object-cover" height={80} src={profile.avatarUrl} unoptimized width={80} /> : profile.displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-6">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4" aria-label="Learning stats">
          <StatTile
            icon={Trophy}
            label="Level"
            value={`${studentLevel.level}`}
            detail={studentLevel.title}
            progress={studentLevel.progressToNextLevel}
            tone="violet"
          />
          <StatTile
            icon={Flame}
            label="Streak"
            value={`${state.streak} days`}
            detail="Daily rhythm"
            progress={Math.min(100, (state.streak / 7) * 100)}
            tone="orange"
          />
          <StatTile icon={Star} label="Stars" value={`${completedStars}`} detail="Earned so far" progress={Math.min(100, (completedStars / 30) * 100)} tone="amber" />
          <StatTile
            icon={Medal}
            label="XP"
            value={`${state.xp}`}
            detail={`${studentLevel.currentLevelXp}/${studentLevel.xpForNextLevel} to next`}
            progress={studentLevel.progressToNextLevel}
            tone="blue"
          />
        </section>

        <section aria-labelledby="course-heading" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="course-heading" className="text-2xl font-bold text-text-primary">
                Courses
              </h2>
              <p className="mt-2 text-text-secondary">Pick a subject and continue your path.</p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-text-primary shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              href="/courses"
            >
              View all courses
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {courseSummaries.map((course) => (
              <CourseCard course={course} featured={course.subject.name === "Mathematics"} key={course.subject.id} />
            ))}
          </div>
        </section>
          </div>

          <GamificationArena />
        </div>

      </main>
    </StudentShell>
  );
}

type StatTileProps = {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  progress: number;
  tone: "violet" | "orange" | "amber" | "blue";
};

const statTones = {
  violet: { card: "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50", icon: "bg-violet-600 text-white shadow-violet-200", text: "text-violet-700", bar: "bg-violet-500" },
  orange: { card: "border-orange-200 bg-gradient-to-br from-orange-50 via-white to-rose-50", icon: "bg-orange-500 text-white shadow-orange-200", text: "text-orange-700", bar: "bg-orange-500" },
  amber: { card: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50", icon: "bg-amber-400 text-amber-950 shadow-amber-200", text: "text-amber-700", bar: "bg-amber-400" },
  blue: { card: "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50", icon: "bg-blue-600 text-white shadow-blue-200", text: "text-blue-700", bar: "bg-blue-500" }
};

function StatTile({ icon: Icon, label, value, detail, progress, tone }: StatTileProps) {
  const style = statTones[tone];
  return (
    <SkulKidCard className={`group relative overflow-hidden p-3 transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] sm:p-3.5 ${style.card}`}>
      <div className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-white/60 transition group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-xs font-black uppercase tracking-wider ${style.text}`}>{label}</p>
          <p className="mt-1 text-2xl font-black leading-none text-text-primary sm:text-3xl">{value}</p>
          <p className="mt-1.5 truncate text-xs font-bold text-text-secondary">{detail}</p>
        </div>
        <div className={`relative grid size-9 shrink-0 place-items-center rounded-xl shadow-md sm:size-10 ${style.icon}`}>
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </div>
      <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white shadow-inner"><div className={`h-full rounded-full transition-all ${style.bar}`} style={{ width: `${Math.max(4, progress)}%` }} /></div>
    </SkulKidCard>
  );
}
