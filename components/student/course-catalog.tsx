"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { CourseCard } from "@/components/student/course-card";
import { StudentShell } from "@/components/student/student-shell";
import { subjects } from "@/data/subjects";
import { sampleStudentProgress } from "@/data/sample-student-progress";
import { getCourseSummary } from "@/lib/lessons/course-summary";
import { usePublishedLessons } from "@/lib/lessons/published-lessons";

export function CourseCatalog() {
  const lessons = usePublishedLessons();
  const courseSummaries = subjects.map((subject) => getCourseSummary(subject, lessons, sampleStudentProgress));
  const firstAvailable = courseSummaries.find((course) => course.isAvailable);
  return (
    <StudentShell activeItem="courses">
      <main className="mx-auto w-full max-w-7xl">
        <header className="mb-8 rounded-[2rem] border border-white/90 bg-white/85 p-5 shadow-[var(--shadow-card)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700 sm:grid">
                <BookOpen aria-hidden="true" className="size-7" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-normal text-muted">Courses</p>
                <h1 className="mt-2 text-3xl font-bold text-text-primary sm:text-4xl">
                  Choose your learning path
                </h1>
                <p className="mt-3 max-w-2xl leading-7 text-text-secondary">
                  Subjects are organised into units, topics and lessons with progress-aware unlocking.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-semibold text-white shadow-sm transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              href={`/courses/${firstAvailable?.subject.slug ?? subjects[0].slug}`}
            >
              {firstAvailable ? "Start learning" : "Browse courses"}
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3" aria-label="Course catalogue">
          {courseSummaries.map((course) => (
            <CourseCard course={course} featured={course.subject.name === "Mathematics"} key={course.subject.id} />
          ))}
        </section>
      </main>
    </StudentShell>
  );
}
