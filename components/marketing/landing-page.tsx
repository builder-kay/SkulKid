import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, FlaskConical, Gamepad2, Play, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { CharacterAvatar } from "@/components/student/character-avatar";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";
import type { AvatarConfig } from "@/lib/student/student-profile";

const avatars: AvatarConfig[] = [
  { gender: "male", bodyStyle: "classic", headStyle: "block", skinColor: "#8D5524", hairStyle: "afro", hairColor: "#21140F", eyeColor: "#3B2414", shirtStyle: "math", shirtColor: "#2563EB", pantsStyle: "trousers", pantsColor: "#172554", shoeColor: "#FFFFFF", equippedPremium: {} },
  { gender: "female", bodyStyle: "slim", headStyle: "round", skinColor: "#C68642", hairStyle: "braids", hairColor: "#23150F", eyeColor: "#3B2414", shirtStyle: "reader", shirtColor: "#7C3AED", pantsStyle: "skirt", pantsColor: "#312E81", shoeColor: "#F8FAFC", equippedPremium: {} },
  { gender: "male", bodyStyle: "strong", headStyle: "wide", skinColor: "#6F3B1F", hairStyle: "short", hairColor: "#16100C", eyeColor: "#21140F", shirtStyle: "science", shirtColor: "#16A34A", pantsStyle: "shorts", pantsColor: "#0F172A", shoeColor: "#FFFFFF", equippedPremium: {} }
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7fbff] text-slate-950">
      <section className="relative overflow-hidden border-b border-blue-100 bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(191,219,254,.65),transparent_28%),radial-gradient(circle_at_12%_78%,rgba(224,242,254,.9),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#93c5fd_1.25px,transparent_1.25px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
        <span className="pointer-events-none absolute left-[4%] top-[38%] size-3 rotate-12 rounded-sm bg-amber-400 sm:size-4" />
        <span className="pointer-events-none absolute left-[47%] top-[16%] size-4 rounded-full bg-cyan-400 sm:size-5" />
        <span className="pointer-events-none absolute bottom-[12%] left-[44%] size-4 rotate-45 rounded-sm bg-violet-400" />

        <header className="relative z-30 mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-8 lg:px-10">
          <Link className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4" href="/">
            <SkulKidLogo className="w-28 sm:w-32" priority />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-extrabold text-slate-600 md:flex" aria-label="Landing page">
            <a className="transition hover:text-blue-700" href="#how-it-works">How it works</a>
            <a className="transition hover:text-blue-700" href="#subjects">Courses</a>
            <a className="transition hover:text-blue-700" href="#rewards">Rewards</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link className="hidden min-h-11 items-center rounded-xl px-4 text-sm font-black text-blue-700 transition hover:bg-blue-50 sm:inline-flex" href="/login">Sign in</Link>
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-[0_10px_25px_rgba(37,99,235,.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 sm:px-5" href="/signup">Join free <ArrowRight className="hidden size-4 sm:block" /></Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-12 lg:min-h-[38rem] lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-14 lg:px-10 lg:pb-16 lg:pt-8">
          <div className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700 sm:text-xs">
              <Sparkles className="size-4 text-amber-500" />
              Learn, play and grow
            </div>
            <h1 className="mt-5 text-[clamp(2.5rem,5vw,4.25rem)] font-black leading-[1.03] tracking-[-.05em] text-slate-950">
              Turn every lesson into a <span className="relative whitespace-nowrap text-blue-600">new adventure<span className="absolute -bottom-1 left-1/2 -z-10 h-2 w-[94%] -translate-x-1/2 rounded-full bg-amber-300/80" />.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
              Friendly primary lessons, playful quizzes and rewards that make children excited to keep learning.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 font-black text-white shadow-[0_15px_32px_rgba(37,99,235,.24)] transition hover:-translate-y-1 hover:bg-blue-700" href="/signup">Start learning free <ArrowRight className="size-5" /></Link>
              <a className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-6 font-black text-slate-800 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50" href="#how-it-works"><Play className="size-5 fill-blue-600 text-blue-600" />See how it works</a>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-bold text-slate-600 lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><Check className="size-4 rounded-full bg-emerald-100 p-0.5 text-emerald-700" />Primary 1–6</span>
              <span className="inline-flex items-center gap-1.5"><Check className="size-4 rounded-full bg-emerald-100 p-0.5 text-emerald-700" />Ghana curriculum</span>
              <span className="inline-flex items-center gap-1.5"><Check className="size-4 rounded-full bg-emerald-100 p-0.5 text-emerald-700" />Learn at your pace</span>
            </div>
          </div>

          <HeroPlayground />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24" id="how-it-works">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-700">A smarter learning loop</p>
            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-.04em] sm:text-5xl">Small lessons.<br />Big confidence.</h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">SkulKid turns everyday learning into clear missions children can finish, celebrate and feel proud of.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Feature number="01" icon={BookOpen} title="Learn in short missions" copy="Friendly explanations, examples and videos made for primary learners." tone="blue" />
          <Feature number="02" icon={Zap} title="Play and earn XP" copy="Quizzes, streaks and instant progress turn effort into momentum." tone="violet" />
          <Feature number="03" icon={Trophy} title="Build your world" copy="Unlock avatar styles, achievements and new reasons to keep going." tone="amber" />
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-16 sm:py-24" id="subjects">
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Choose an adventure</p><h2 className="mt-2 text-4xl font-black tracking-[-.04em] sm:text-5xl">A growing world of courses.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Teachers can keep creating and publishing new learning paths. Here are a few places the adventure can begin.</p></div>
            <Link className="inline-flex min-h-11 items-center gap-2 self-start font-black text-blue-700" href="/signup">Start for free <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <SubjectCard icon={Zap} label="Mathematics" eyebrow="Think • Solve • Win" colour="#2563EB" className="md:translate-y-5" />
            <SubjectCard icon={BookOpen} label="English" eyebrow="Read • Write • Imagine" colour="#7C3AED" />
            <SubjectCard icon={FlaskConical} label="Science" eyebrow="Wonder • Test • Discover" colour="#16A34A" className="md:translate-y-8" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24" id="rewards">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-700 via-blue-700 to-cyan-600 p-6 text-white shadow-[0_30px_80px_rgba(37,99,235,.22)] sm:p-10 lg:p-14">
          <div className="absolute -right-12 -top-20 size-72 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-black ring-1 ring-white/20"><Star className="size-4 fill-amber-300 text-amber-300" />Every effort counts</div>
              <h2 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-[-.04em] sm:text-5xl">Learn more. Unlock more. Become unstoppable.</h2>
              <p className="mt-4 max-w-xl text-lg leading-8 text-blue-100">XP, stars, streaks and avatar rewards make progress something children can see and celebrate.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[27rem]">
              <Reward value="+100" label="Lesson XP" icon={Zap} />
              <Reward value="3" label="Quiz stars" icon={Star} />
              <Reward value="7" label="Day streak" icon={Trophy} />
            </div>
          </div>
        </div>
      </section>

      <footer className="relative overflow-hidden border-t border-blue-100 bg-gradient-to-b from-white via-[#f7fbff] to-[#eef5ff]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(191,219,254,.55),transparent_28%),radial-gradient(circle_at_88%_80%,rgba(221,214,254,.35),transparent_26%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <SkulKidLogo className="w-24" />
              <p className="mt-1 text-xs font-bold text-slate-500">Learn. Play. Grow.</p>
            </div>

            <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-slate-700">
              <a className="transition hover:text-blue-700" href="#how-it-works">How it works</a>
              <a className="transition hover:text-blue-700" href="#subjects">Courses</a>
              <a className="transition hover:text-blue-700" href="#rewards">Rewards</a>
              <Link className="transition hover:text-blue-700" href="/login">Sign in</Link>
              <Link className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-black text-white transition hover:bg-blue-700" href="/signup">
                Join SkulKid <ArrowRight className="size-3.5" />
              </Link>
            </nav>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-200/90 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-500">© {new Date().getFullYear()} SkulKid</p>
            <div className="inline-flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">From</span>
              <Image
                alt="Team Bytant"
                className="h-5 w-auto object-contain sm:h-6"
                height={511}
                src="/brand/team-bytant-logo.png"
                width={1024}
              />
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function HeroPlayground() {
  return <div className="relative mx-auto w-full max-w-[36rem] px-2 pb-5 pt-3 sm:px-5">
    <div className="absolute -left-2 top-[18%] z-20 rounded-2xl border border-blue-100 bg-white p-3 shadow-[0_14px_35px_rgba(37,99,235,.14)] sm:-left-4 sm:p-4">
      <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-600"><Star className="size-5 fill-amber-400" /></span><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quiz score</p><p className="text-base font-black text-slate-900">10 / 10</p></div></div>
    </div>
    <div className="absolute -right-1 top-[8%] z-20 flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-[0_12px_30px_rgba(37,99,235,.13)] sm:right-0 sm:text-sm"><Zap className="size-4 fill-blue-600" />+100 XP</div>
    <div className="absolute -right-1 bottom-[14%] z-20 rounded-2xl border border-emerald-100 bg-white p-3 shadow-[0_14px_35px_rgba(16,185,129,.13)] sm:right-1 sm:p-4">
      <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-600"><Trophy className="size-5" /></span><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Daily goal</p><p className="text-base font-black text-slate-900">Complete!</p></div></div>
    </div>
    <div className="relative mx-auto aspect-[1.05/1] max-h-[31rem] overflow-hidden rounded-[2.25rem] border-[6px] border-white bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 shadow-[0_30px_80px_rgba(37,99,235,.25)] ring-1 ring-blue-100">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4 text-white">
        <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-100">Today&apos;s mission</p><p className="mt-1 text-sm font-black sm:text-base">Fraction Explorer</p></div>
        <span className="grid size-10 place-items-center rounded-xl bg-white/20 backdrop-blur"><Gamepad2 className="size-5" /></span>
      </div>
      <span className="absolute left-[10%] top-[28%] size-3 rotate-45 rounded-sm bg-amber-300" />
      <span className="absolute right-[13%] top-[34%] size-3 rounded-full bg-white/70" />
      <span className="absolute left-[17%] top-[46%] text-2xl font-black text-white/20">÷</span>
      <span className="absolute right-[14%] top-[52%] text-2xl font-black text-white/20">½</span>
      <div className="absolute inset-x-[19%] bottom-[4.25rem] top-[4.6rem]">
        <CharacterAvatar avatar={avatars[1]} className="h-full w-full !rounded-none" label="SkulKid learner avatar" />
      </div>
      <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur sm:inset-x-5">
        <div className="flex items-center justify-between gap-3 text-xs font-black text-slate-700"><span>Mission progress</span><span className="text-blue-700">75%</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100"><div className="h-full w-3/4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" /></div>
      </div>
    </div>
    <div className="absolute -bottom-1 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black text-slate-800 shadow-lg sm:text-sm"><span className="size-2 animate-pulse rounded-full bg-emerald-500" />Ready for the next challenge</div>
  </div>;
}

const tones = {
  blue: "bg-blue-600 text-white shadow-blue-200",
  violet: "bg-violet-600 text-white shadow-violet-200",
  amber: "bg-amber-400 text-slate-950 shadow-amber-200"
};
function Feature({ number, icon: Icon, title, copy, tone }: { number: string; icon: React.ElementType; title: string; copy: string; tone: keyof typeof tones }) {
  return <article className="group relative overflow-hidden rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,.07)] transition hover:-translate-y-1 hover:shadow-[0_25px_65px_rgba(15,23,42,.12)]"><span className="absolute right-5 top-4 text-5xl font-black text-slate-100">{number}</span><span className={`relative grid size-14 place-items-center rounded-2xl shadow-lg ${tones[tone]}`}><Icon className="size-7" /></span><h3 className="relative mt-6 text-xl font-black">{title}</h3><p className="relative mt-2 leading-7 text-slate-600">{copy}</p></article>;
}

function SubjectCard({ icon: Icon, label, eyebrow, colour, className = "" }: { icon: React.ElementType; label: string; eyebrow: string; colour: string; className?: string }) {
  return <Link className={`group relative min-h-72 overflow-hidden rounded-[2rem] p-6 text-white shadow-[0_20px_55px_rgba(15,23,42,.15)] transition hover:-translate-y-2 ${className}`} href="/signup" style={{ backgroundColor: colour }}><div className="absolute -right-14 -top-16 size-52 rounded-full bg-white/15" /><div className="absolute -bottom-20 -left-16 size-56 rounded-full bg-slate-950/10" /><span className="relative grid size-14 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25"><Icon className="size-7" /></span><div className="absolute inset-x-6 bottom-6"><p className="text-xs font-black uppercase tracking-[.16em] text-white/70">{eyebrow}</p><div className="mt-2 flex items-end justify-between gap-3"><h3 className="text-3xl font-black">{label}</h3><span className="grid size-11 place-items-center rounded-full bg-white text-slate-950 transition group-hover:translate-x-1"><ArrowRight className="size-5" /></span></div></div></Link>;
}

function Reward({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return <div className="rounded-2xl bg-white/10 p-4 text-center ring-1 ring-white/15 backdrop-blur"><Icon className="mx-auto size-5 text-amber-300" /><p className="mt-2 text-2xl font-black">{value}</p><p className="mt-1 text-xs font-bold text-blue-100">{label}</p></div>;
}
