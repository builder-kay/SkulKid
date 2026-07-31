import Link from "next/link";
import { ClipboardList, GraduationCap, ShieldCheck, Wrench } from "lucide-react";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";

const cards = [
  {
    href: "/feedback/student",
    title: "Student questionnaire",
    form: "Form A",
    description: "For primary learners who tried SkulKid. Short steps about games, quizzes, and how learning felt.",
    icon: GraduationCap,
    tone: "from-blue-600 to-sky-500"
  },
  {
    href: "/feedback/teacher",
    title: "Teacher questionnaire",
    form: "Form B",
    description: "For teachers: dashboard usefulness, classroom engagement, and curriculum fit.",
    icon: ClipboardList,
    tone: "from-violet-700 to-indigo-600"
  },
  {
    href: "/feedback/system",
    title: "System checklist",
    form: "Form C",
    description: "For research evaluators: functional checks, performance metrics, and UAT notes.",
    icon: Wrench,
    tone: "from-slate-800 to-teal-800"
  }
] as const;

export default function FeedbackHubPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_0%,#dbeafe_0%,transparent_40%),radial-gradient(circle_at_90%_10%,#ede9fe_0%,transparent_35%),linear-gradient(180deg,#f7fbff,#fff_50%,#f8fafc)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="rounded-xl bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200"><SkulKidLogo className="w-32" priority /></span>
          </Link>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">University of Cape Coast research</p>
        </header>

        <section className="mt-10 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Shareable feedback</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Help improve SkulKid</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Choose the questionnaire that matches you. Answers are confidential, you do not need to write your name, and you can finish in short steps.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
            <ShieldCheck className="size-4 text-emerald-600" /> Used only for research and product improvement
          </p>
        </section>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                className="group flex min-h-[16rem] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,.08)] transition hover:-translate-y-0.5 hover:shadow-xl"
                href={card.href}
                key={card.href}
              >
                <div className={`bg-gradient-to-br ${card.tone} p-5 text-white`}>
                  <Icon className="size-8" />
                  <p className="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-white/80">{card.form}</p>
                  <h2 className="mt-1 text-xl font-black">{card.title}</h2>
                </div>
                <p className="flex-1 p-5 text-sm leading-6 text-slate-600">{card.description}</p>
                <span className="px-5 pb-5 text-sm font-black text-blue-700 group-hover:text-blue-900">Start →</span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
