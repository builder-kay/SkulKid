"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookMarked, CheckCircle2, Clock3, History, Loader2, Search, Sparkles, Trophy } from "lucide-react";
import { StudentShell } from "@/components/student/student-shell";
import { StudentPageNav } from "@/components/student/student-page-nav";

type PascoSummary = {
  id: string; classId: string; className: string; gradeLevel: number; title: string; description: string;
  questionCount: number; endedAt: string; endedByTeacher: boolean; baseXpReward: number; passingScore: number;
  offPlatformReward: string; attempted: boolean; attemptCount: number; bestScore: number | null; passed: boolean;
  sourceType?: "class" | "strand"; strand?: string; subStrand?: string; href?: string;
};

export function PascoArchivePage() {
  const [quizzes, setQuizzes] = useState<PascoSummary[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; gradeLevel: number }>>([]);
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState("all");
  const [attemptState, setAttemptState] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const requestedClass = new URLSearchParams(window.location.search).get("classId");
    if (requestedClass) setClassId(requestedClass);
    void (async () => {
      try {
        const response = await fetch("/api/student/pasco", { cache: "no-store" });
        const payload = await response.json() as { quizzes?: PascoSummary[]; classes?: typeof classes; error?: string };
        if (!response.ok) throw new Error(payload.error || "Unable to load PASCO.");
        setQuizzes(payload.quizzes ?? []);
        setClasses(payload.classes ?? []);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load PASCO.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return quizzes.filter((quiz) =>
      (classId === "all" || quiz.classId === classId)
      && (attemptState === "all" || (attemptState === "attempted" ? quiz.attempted : !quiz.attempted))
      && (!needle || `${quiz.title} ${quiz.description} ${quiz.className} ${quiz.strand ?? ""} ${quiz.subStrand ?? ""}`.toLowerCase().includes(needle))
    );
  }, [attemptState, classId, query, quizzes]);

  const attempted = quizzes.filter((quiz) => quiz.attempted).length;
  const passed = quizzes.filter((quiz) => quiz.passed).length;

  return <StudentShell activeItem="pasco">
    <main className="mx-auto grid w-full max-w-7xl gap-5">
      <StudentPageNav backHref="/dashboard" backLabel="Back to dashboard" crumbs={[{ label: "Home", href: "/dashboard" }, { label: "PASCO" }]} />
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-white/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-amber-100"><BookMarked className="size-4" />Past questions</p><h1 className="mt-2 text-4xl font-black sm:text-5xl">PASCO</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-orange-50 sm:text-base">Review ended class quizzes and quizzes taken in your subject strands without affecting your scores.</p></div>
          <div className="grid grid-cols-3 gap-2"><HeroStat label="Past quizzes" value={quizzes.length} /><HeroStat label="Attempted" value={attempted} /><HeroStat label="Passed" value={passed} /></div>
        </div>
      </header>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_13rem_12rem]">
          <label className="relative"><span className="sr-only">Search PASCO</span><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" onChange={(event) => setQuery(event.target.value)} placeholder="Search quizzes or classes" value={query} /></label>
          <label><span className="sr-only">Filter by source</span><select className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 font-bold" onChange={(event) => setClassId(event.target.value)} value={classId}><option value="all">All sources</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label><span className="sr-only">Filter by attempt</span><select className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 font-bold" onChange={(event) => setAttemptState(event.target.value)} value={attemptState}><option value="all">All quizzes</option><option value="attempted">Attempted</option><option value="missed">Missed</option></select></label>
        </div>
      </section>

      {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="size-7 animate-spin text-orange-600" /></div> : error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 font-bold text-rose-900">{error}</div> : visible.length === 0 ? <div className="grid min-h-64 place-items-center rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center"><div><Sparkles className="mx-auto size-9 text-amber-500" /><h2 className="mt-3 text-xl font-black">{quizzes.length ? "No PASCO quizzes match" : "No past quizzes yet"}</h2><p className="mt-2 text-sm text-slate-600">{quizzes.length ? "Try another search or filter." : "Ended class quizzes and strand quizzes you take will appear here automatically."}</p></div></div> :
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((quiz) => <article className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl" key={quiz.id}><div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" /><div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black uppercase text-orange-800">{quiz.sourceType === "strand" ? `${quiz.className} · Strand quiz` : `${quiz.className} · Basic ${quiz.gradeLevel}`}</span>{quiz.attempted ? <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700"><CheckCircle2 className="size-4" />Attempted</span> : <span className="text-xs font-black text-slate-500">Missed</span>}</div>{quiz.sourceType === "strand" && (quiz.strand || quiz.subStrand) ? <p className="mt-3 text-xs font-bold text-violet-700">{[quiz.strand, quiz.subStrand].filter(Boolean).join(" → ")}</p> : null}<h2 className="mt-4 text-xl font-black text-slate-950">{quiz.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{quiz.description || "Review the questions and practise this past challenge."}</p><div className="mt-4 grid grid-cols-3 gap-2 text-center"><CardStat label="Questions" value={quiz.questionCount} /><CardStat label="Best" value={quiz.bestScore == null ? "—" : `${quiz.bestScore}%`} /><CardStat label="Attempts" value={quiz.attemptCount} /></div>{quiz.offPlatformReward ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-900"><Trophy className="mr-1 inline size-4" />Class reward: {quiz.offPlatformReward}</p> : null}<div className="mt-auto pt-5"><p className="flex items-center gap-1 text-xs font-bold text-slate-500">{quiz.sourceType === "strand" ? <History className="size-3.5" /> : <Clock3 className="size-3.5" />}{quiz.sourceType === "strand" ? "Last taken" : "Ended"} {new Date(quiz.endedAt).toLocaleString()}</p><Link className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 font-black text-white group-hover:bg-orange-600" href={quiz.href ?? `/pasco/${quiz.id}`}>{quiz.sourceType === "strand" ? "Review lesson quiz" : "Review and practise"} <ArrowRight className="size-4" /></Link></div></div></article>)}</section>}
    </main>
  </StudentShell>;
}

function HeroStat({ label, value }: { label: string; value: number }) { return <div className="min-w-20 rounded-2xl bg-white/15 p-3 text-center ring-1 ring-white/20"><b className="block text-2xl">{value}</b><span className="text-[10px] font-black uppercase tracking-wider text-orange-50">{label}</span></div>; }
function CardStat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-slate-50 p-2"><b className="block text-lg">{value}</b><span className="text-[10px] font-black uppercase text-slate-500">{label}</span></div>; }
