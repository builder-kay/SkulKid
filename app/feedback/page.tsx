import Link from "next/link";
import { ArrowRight, Clock3, GraduationCap, LockKeyhole, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";

const paths = [
  {
    href: "/feedback/student",
    form: "Form A",
    title: "I am a student",
    description: "Share how SkulKid felt for learning, games, quizzes, and confidence.",
    meta: "About 8–12 minutes · Primary 3–6",
    cta: "Start student form",
    icon: GraduationCap,
    accent: "blue"
  },
  {
    href: "/feedback/teacher",
    form: "Form B",
    title: "I am a teacher",
    description: "Rate the dashboard, classroom engagement, and how well SkulKid fits your lessons.",
    meta: "About 8–12 minutes · Professional view",
    cta: "Start teacher form",
    icon: UsersRound,
    accent: "violet"
  }
] as const;

export default function FeedbackHubPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(191,219,254,.7),transparent_30%),radial-gradient(circle_at_8%_72%,rgba(224,242,254,.95),transparent_26%),radial-gradient(circle_at_92%_78%,rgba(237,233,254,.55),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(#93c5fd_1.2px,transparent_1.2px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <span aria-hidden className="landing-float pointer-events-none absolute left-[6%] top-[22%] size-3 rotate-12 rounded-sm bg-amber-400 sm:size-4" />
      <span aria-hidden className="landing-float-slow pointer-events-none absolute right-[10%] top-[18%] size-4 rounded-full bg-cyan-400" />
      <span aria-hidden className="pointer-events-none absolute bottom-[18%] left-[42%] size-3 rotate-45 rounded-sm bg-violet-400" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
        <header className="flex h-14 items-center justify-between gap-3 sm:h-16">
          <Link className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4" href="/">
            <SkulKidLogo className="w-28 sm:w-32" priority />
          </Link>
          <p className="max-w-[12rem] text-right text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 sm:max-w-none sm:text-xs">
            Final year research
          </p>
        </header>

        <section className="mx-auto mt-8 max-w-3xl flex-1 text-center sm:mt-14">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700 shadow-sm">
            <Sparkles className="size-3.5 text-amber-500" />
            Research feedback
          </p>
          <h1 className="mt-5 text-[clamp(2.4rem,5vw,4rem)] font-black leading-[1.05] tracking-[-0.05em] text-slate-950">
            Help make <span className="relative whitespace-nowrap text-blue-600">SkulKid<span className="absolute -bottom-1 left-1/2 -z-10 h-2.5 w-[92%] -translate-x-1/2 rounded-full bg-amber-300/80" /></span> better
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Pick the form that matches you. Short steps, no name needed, and your answers stay confidential.
          </p>

          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-slate-600">
            <span className="inline-flex items-center gap-1.5"><LockKeyhole className="size-4 text-emerald-600" />Anonymous</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-blue-600" />Save & continue later</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-violet-600" />Research use only</span>
          </div>

          <div className="mt-10 grid gap-4 text-left sm:mt-12 md:grid-cols-2 md:gap-5">
            {paths.map((path) => {
              const Icon = path.icon;
              const student = path.accent === "blue";
              return (
                <Link
                  className={
                    student
                      ? "group relative flex min-h-[17rem] flex-col overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-blue-600 via-blue-600 to-sky-500 p-6 text-white shadow-[0_22px_50px_rgba(37,99,235,.28)] transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4"
                      : "group relative flex min-h-[17rem] flex-col overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-violet-700 via-violet-700 to-indigo-600 p-6 text-white shadow-[0_22px_50px_rgba(109,40,217,.28)] transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-4"
                  }
                  href={path.href}
                  key={path.href}
                >
                  <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-white/10" />
                  <span aria-hidden className="pointer-events-none absolute bottom-8 right-8 size-16 rounded-full bg-amber-300/20 blur-xl" />
                  <div className="relative flex items-start justify-between gap-3">
                    <span className="grid size-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                      <Icon className="size-6" />
                    </span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/90 ring-1 ring-white/20">
                      {path.form}
                    </span>
                  </div>
                  <h2 className="relative mt-6 text-2xl font-black tracking-tight sm:text-3xl">{path.title}</h2>
                  <p className="relative mt-2 flex-1 text-sm leading-6 text-white/85">{path.description}</p>
                  <p className="relative mt-4 text-xs font-bold text-white/70">{path.meta}</p>
                  <span className="relative mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-slate-950 transition group-hover:bg-amber-300">
                    {path.cta} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <footer className="mt-10 pb-4 text-center text-xs font-bold text-slate-500">
          SkulKid · Final year research
        </footer>
      </div>
    </main>
  );
}
