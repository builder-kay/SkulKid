import Link from "next/link";
import { Sparkles } from "lucide-react";
import { OfficialCurriculumLibrary } from "@/components/admin/official-curriculum-library";
import { CourseManagement } from "@/components/admin/course-management";
import { TeacherGuideLink } from "@/components/teacher/teacher-guide-link";

export default async function AdminCurriculumPage({
  searchParams
}: {
  searchParams: Promise<{ create?: string; courseId?: string }>;
}) {
  const params = await searchParams;
  return <main className="mx-auto w-full max-w-7xl">
    <header className="flex flex-col gap-5 rounded-[2rem] border border-white bg-white p-6 shadow-[var(--shadow-card)] sm:p-8 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-black uppercase tracking-wide text-violet-700">Curriculum workspace</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Subjects and lessons</h1><p className="mt-3 max-w-2xl text-lg leading-8 text-text-secondary">Open a subject to manage its strands, sub-strands, topics and every lesson beneath them.</p></div><div className="flex flex-col gap-3 sm:flex-row"><TeacherGuideLink topic="create-course" /><Link href="/teacher/lessons/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 font-bold text-violet-800 hover:bg-violet-100">Create lesson</Link><Link href="/teacher/curriculum-studio" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 font-bold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"><Sparkles className="size-5" aria-hidden="true" />Generate content</Link></div></header>
    <CourseManagement initialCreate={params.create === "1"} initialSelectedCourseId={params.courseId} />
    <OfficialCurriculumLibrary />
  </main>;
}
