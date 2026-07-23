import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LiveAdminCurriculumSubjects } from "@/components/admin/live-admin-overview";
import { OfficialCurriculumLibrary } from "@/components/admin/official-curriculum-library";

export default function AdminCurriculumPage() {
  return <main className="mx-auto w-full max-w-7xl">
    <header className="flex flex-col gap-5 rounded-[2rem] border border-white bg-white p-6 shadow-[var(--shadow-card)] sm:p-8 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-black uppercase tracking-wide text-violet-700">Curriculum inventory</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Subjects and learning paths</h1><p className="mt-3 max-w-2xl text-lg leading-8 text-text-secondary">Review what is currently connected to the student catalogue and open its published lesson experience.</p></div><Link href="/admin/curriculum-studio" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 font-bold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"><Sparkles className="size-5" aria-hidden="true" />Generate a course</Link></header>
    <LiveAdminCurriculumSubjects />
    <OfficialCurriculumLibrary />
  </main>;
}
