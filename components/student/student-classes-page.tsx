"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  KeyRound,
  Loader2,
  MessageSquareHeart,
  Sparkles,
  Users,
  UsersRound
} from "lucide-react";
import { StudentPageNav } from "@/components/student/student-page-nav";
import { StudentShell } from "@/components/student/student-shell";
import type { StudentClassSummary } from "@/lib/classes/types";
import { cn } from "@/lib/utils";

const cardThemes = [
  { hero: "from-sky-800 via-sky-700 to-cyan-800", soft: "bg-sky-50 text-sky-900", ring: "hover:border-sky-300" },
  { hero: "from-teal-800 via-teal-700 to-cyan-800", soft: "bg-teal-50 text-teal-900", ring: "hover:border-teal-300" },
  { hero: "from-indigo-900 via-blue-800 to-sky-800", soft: "bg-indigo-50 text-indigo-900", ring: "hover:border-indigo-300" },
  { hero: "from-amber-700 via-orange-700 to-rose-800", soft: "bg-amber-50 text-amber-950", ring: "hover:border-amber-300" }
];

export function StudentClassesPage() {
  const [classes, setClasses] = useState<StudentClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinFocused, setJoinFocused] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/student/classes", { cache: "no-store" });
      const payload = await response.json() as { classes?: StudentClassSummary[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load classes.");
      setClasses(payload.classes ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load classes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const totals = useMemo(() => ({
    classes: classes.length,
    openQuizzes: classes.reduce((sum, item) => sum + item.openQuizCount, 0),
    unreadTips: classes.reduce((sum, item) => sum + item.unreadAdviceCount, 0)
  }), [classes]);

  async function joinByCode(event: React.FormEvent) {
    event.preventDefault();
    setJoining(true);
    setError("");
    try {
      const response = await fetch("/api/student/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const payload = await response.json() as { classroom?: { id: string }; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to join class.");
      setCode("");
      await load();
      if (payload.classroom?.id) window.location.href = `/classes/${payload.classroom.id}`;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to join class.");
    } finally {
      setJoining(false);
    }
  }

  function focusJoin() {
    setJoinFocused(true);
    document.getElementById("join-class-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => document.getElementById("join-code-input")?.focus(), 350);
  }

  return (
    <StudentShell activeItem="classes">
      <main className="relative mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-6 h-72 rounded-[2rem] bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,.12),_transparent_60%)]"
        />

        <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_28px_70px_rgba(8,47,73,.32)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 10% 20%, rgba(34,211,238,.28), transparent 40%), radial-gradient(circle at 90% 10%, rgba(56,189,248,.2), transparent 35%), linear-gradient(160deg, #0f172a 0%, #0c4a6e 55%, #155e75 100%)"
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 bottom-0 h-44 w-56 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, rgba(255,255,255,.35) 0 2px, transparent 2.5px)",
              backgroundSize: "18px 18px"
            }}
          />
          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:p-10">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/90">SkulKid Classes</p>
              <h1 className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                My classes
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                Join your teacher’s room for quizzes, subjects, tips and the class board.
              </p>
            </div>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 text-base font-black text-slate-950 shadow-[0_12px_30px_rgba(252,211,77,.3)] transition duration-200 hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={focusJoin}
              type="button"
            >
              <KeyRound className="size-5" />
              Join with a code
              <ArrowRight className="size-5" />
            </button>
          </div>
        </header>

        <StudentPageNav
          backHref="/dashboard"
          backLabel="Back to dashboard"
          crumbs={[{ label: "Home", href: "/dashboard" }, { label: "My Classes" }]}
        />

        {!loading && classes.length > 0 ? (
          <section aria-label="Class snapshot" className="grid grid-cols-3 gap-3">
            <SnapshotTile icon={UsersRound} label="Joined" value={totals.classes} />
            <SnapshotTile icon={ClipboardList} label="Open quizzes" value={totals.openQuizzes} highlight={totals.openQuizzes > 0} />
            <SnapshotTile icon={MessageSquareHeart} label="New tips" value={totals.unreadTips} highlight={totals.unreadTips > 0} />
          </section>
        ) : null}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6">
          <section aria-labelledby="class-list-heading" className="min-w-0 space-y-4">
            <div className="px-1">
              <p className="text-xs font-black uppercase tracking-wider text-sky-700">Your classrooms</p>
              <h2 className="mt-1 text-2xl font-black text-text-primary sm:text-3xl" id="class-list-heading">
                {classes.length ? "Continue where you left off" : "Ready to join your first class?"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {classes.length
                  ? "Open a class for quizzes, subjects and teacher tips."
                  : "Ask your teacher for a join link or enter a code on the right."}
              </p>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1].map((item) => (
                  <div className="h-60 animate-pulse rounded-[1.75rem] border border-slate-200 bg-white" key={item} />
                ))}
              </div>
            ) : classes.length === 0 ? (
              <EmptyClasses onJoin={focusJoin} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {classes.map((classroom, index) => (
                  <ClassCard classroom={classroom} key={classroom.id} theme={cardThemes[index % cardThemes.length]} />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-8">
            <form
              className={cn(
                "overflow-hidden rounded-[1.75rem] border bg-white shadow-[var(--shadow-card)] transition duration-200",
                joinFocused || error ? "border-sky-300 ring-4 ring-sky-100" : "border-slate-200"
              )}
              id="join-class-panel"
              onSubmit={joinByCode}
            >
              <div className="bg-gradient-to-br from-sky-700 to-cyan-800 px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                    <KeyRound className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-sky-100">Join a class</p>
                    <h3 className="text-lg font-black">Enter your code</h3>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 p-5">
                <p className="text-sm leading-6 text-text-secondary">
                  Your teacher shares an 8-character code or a link. Paste the code here to get in.
                </p>
                <label className="grid gap-1.5 text-sm font-black text-slate-700" htmlFor="join-code-input">
                  Class code
                  <input
                    autoCapitalize="characters"
                    autoComplete="off"
                    className="min-h-12 rounded-xl border border-slate-300 bg-slate-50 px-4 text-center text-lg font-black uppercase tracking-[0.28em] text-slate-950 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    id="join-code-input"
                    onBlur={() => setJoinFocused(false)}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    onFocus={() => setJoinFocused(true)}
                    placeholder="ABCD1234"
                    required
                    spellCheck={false}
                    value={code}
                  />
                </label>
                {error ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900" role="alert">
                    {error}
                  </p>
                ) : null}
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 font-black text-white shadow-[0_10px_24px_rgba(2,132,199,.28)] transition hover:bg-sky-700 disabled:opacity-60"
                  disabled={joining || !code.trim()}
                  type="submit"
                >
                  {joining ? <Loader2 className="size-5 animate-spin" /> : <Users className="size-5" />}
                  {joining ? "Joining…" : "Join this class"}
                </button>
              </div>
            </form>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-black text-slate-950">How classes work</h3>
              <ol className="mt-4 grid gap-3">
                {[
                  "Join with a code or teacher link",
                  "Complete class quizzes for XP and stars",
                  "Follow subjects your teacher assigns",
                  "Read tips and climb the class board"
                ].map((step, index) => (
                  <li className="flex gap-3 text-sm leading-6 text-slate-600" key={step}>
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sky-50 text-xs font-black text-sky-800">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </main>
    </StudentShell>
  );
}

function ClassCard({
  classroom,
  theme
}: {
  classroom: StudentClassSummary;
  theme: (typeof cardThemes)[number];
}) {
  const needsAttention = classroom.openQuizCount > 0 || classroom.unreadAdviceCount > 0;
  const initial = classroom.name.trim().charAt(0).toUpperCase() || "C";

  return (
    <Link
      className={cn(
        "group flex min-h-[16.5rem] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
        theme.ring
      )}
      href={`/classes/${classroom.id}`}
    >
      <div className={cn("relative overflow-hidden bg-gradient-to-br px-5 py-4 text-white", theme.hero)}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/15 text-xl font-black ring-1 ring-white/20">
            {initial}
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white/90 ring-1 ring-white/20">
            Basic {classroom.gradeLevel}
          </span>
        </div>
        <h3 className="relative mt-4 line-clamp-2 text-xl font-black leading-tight">{classroom.name}</h3>
        <p className="relative mt-1 text-sm font-semibold text-white/80">Teacher {classroom.teacherName}</p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
          {classroom.description || "Open this class for quizzes, subjects and teacher tips."}
        </p>

        {needsAttention ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-amber-800">
            <Sparkles className="size-3.5" />
            Something new is waiting for you
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat icon={BookOpen} label="Subjects" value={classroom.courseCount} tone={theme.soft} />
          <MiniStat
            icon={ClipboardList}
            label="Quizzes"
            value={classroom.openQuizCount}
            tone={classroom.openQuizCount ? "bg-amber-50 text-amber-900" : theme.soft}
          />
          <MiniStat
            icon={MessageSquareHeart}
            label="Tips"
            value={classroom.unreadAdviceCount}
            tone={classroom.unreadAdviceCount ? "bg-rose-50 text-rose-900" : theme.soft}
          />
        </div>

        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-black text-sky-700 transition group-hover:gap-2.5">
          Enter class
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

function EmptyClasses({ onJoin }: { onJoin: () => void }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-dashed border-slate-300 bg-white">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <span className="grid size-14 place-items-center rounded-2xl bg-sky-100 text-sky-800">
            <UsersRound className="size-7" />
          </span>
          <h3 className="mt-4 text-2xl font-black text-slate-950">No classes yet</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            When your teacher shares a join code or link, enter it here and your classroom will appear.
          </p>
          <button
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-600 px-4 font-black text-white hover:bg-sky-700"
            onClick={onJoin}
            type="button"
          >
            <KeyRound className="size-4" />
            Enter a join code
          </button>
        </div>
        <div className="rounded-[1.5rem] bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-5 ring-1 ring-sky-100">
          <p className="text-xs font-black uppercase tracking-wider text-sky-700">What you will unlock</p>
          <ul className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
            <li className="rounded-xl bg-white px-3 py-2.5 shadow-sm">Class quizzes with XP</li>
            <li className="rounded-xl bg-white px-3 py-2.5 shadow-sm">Assigned subjects</li>
            <li className="rounded-xl bg-white px-3 py-2.5 shadow-sm">Teacher tips and leaderboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SnapshotTile({
  icon: Icon,
  label,
  value,
  highlight = false
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border bg-white p-4 shadow-sm",
      highlight ? "border-amber-200" : "border-slate-200"
    )}>
      <div className="flex items-center gap-3">
        <span className={cn(
          "grid size-10 place-items-center rounded-xl",
          highlight ? "bg-amber-50 text-amber-800" : "bg-sky-50 text-sky-800"
        )}>
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-2xl font-black text-slate-950">{value}</p>
          <p className="text-xs font-bold text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={cn("rounded-xl px-2 py-2.5 text-center", tone)}>
      <Icon className="mx-auto size-4" />
      <p className="mt-1 text-base font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}
