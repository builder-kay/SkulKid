import Link from "next/link";
import { ArrowRight, BookOpenCheck, GraduationCap, Home } from "lucide-react";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";

export function AuthRoleChooser({
  intent,
  nextPath
}: {
  intent: "login" | "signup";
  nextPath?: string;
}) {
  const isLogin = intent === "login";
  const title = isLogin ? "Who is signing in?" : "Who are you creating an account for?";
  const description = isLogin
    ? "Choose your role so we can take you to the right workspace."
    : "Students learn and play. Teachers build lessons and subjects.";
  const nextQuery =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? `?next=${encodeURIComponent(nextPath)}`
      : "";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 p-2 sm:grid sm:place-items-center sm:px-5 sm:py-5">
      <div className="pointer-events-none absolute -left-32 -top-32 size-80 rounded-full bg-blue-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 size-96 rounded-full bg-violet-200/60 blur-3xl" />

      <div className="relative mx-auto w-full max-w-3xl">
        <Link
          className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          href="/"
        >
          <Home aria-hidden="true" className="size-4" />
          Go to landing page
        </Link>

        <section className="overflow-hidden rounded-[1.5rem] border border-white bg-white shadow-[0_24px_70px_rgba(30,41,59,.14)] sm:rounded-[2rem]">
          <div className="border-b border-slate-100 bg-gradient-to-br from-blue-700 via-violet-700 to-fuchsia-700 px-5 py-6 text-white sm:px-8 sm:py-8">
            <Link className="inline-flex rounded-xl bg-white px-2.5 py-1.5 shadow-lg" href="/">
              <SkulKidLogo className="w-28 sm:w-32" priority />
            </Link>
            <h1 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">{description}</p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:gap-5 sm:p-8">
            <RoleCard
              href={`${isLogin ? "/login/student" : "/signup/student"}${nextQuery}`}
              icon={GraduationCap}
              title="I am a student"
              text={isLogin ? "Sign in to continue learning, earn XP and build your avatar." : "Create a learner account for lessons, rewards and progress."}
              accent="blue"
            />
            <RoleCard
              href={`${isLogin ? "/login/teacher" : "/signup/teacher"}${nextQuery}`}
              icon={BookOpenCheck}
              title="I am a teacher"
              text={isLogin ? "Sign in to your teacher workspace to manage subjects and lessons." : "Create a teacher account to build curriculum and publish lessons."}
              accent="violet"
            />
          </div>

          <div className="border-t border-slate-100 px-5 py-4 text-center text-sm text-text-secondary sm:px-8">
            {isLogin ? (
              <>New to SkulKid? <Link className="font-black text-primary hover:text-primary-dark" href="/signup">Create an account</Link></>
            ) : (
              <>Already have an account? <Link className="font-black text-primary hover:text-primary-dark" href="/login">Sign in</Link></>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function RoleCard({
  href,
  icon: Icon,
  title,
  text,
  accent
}: {
  href: string;
  icon: typeof GraduationCap;
  title: string;
  text: string;
  accent: "blue" | "violet";
}) {
  return (
    <Link
      className={`group flex min-h-[11rem] flex-col rounded-[1.5rem] border p-5 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 ${
        accent === "blue"
          ? "border-blue-100 bg-blue-50/70 hover:border-blue-300 hover:bg-blue-50 focus-visible:ring-blue-500"
          : "border-violet-100 bg-violet-50/70 hover:border-violet-300 hover:bg-violet-50 focus-visible:ring-violet-500"
      }`}
      href={href}
    >
      <span className={`grid size-12 place-items-center rounded-2xl text-white shadow-sm ${accent === "blue" ? "bg-blue-600" : "bg-violet-600"}`}>
        <Icon className="size-6" />
      </span>
      <h2 className="mt-4 text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{text}</p>
      <span className={`mt-4 inline-flex items-center gap-1 text-sm font-black ${accent === "blue" ? "text-blue-700" : "text-violet-700"}`}>
        Continue <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
