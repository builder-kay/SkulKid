"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ClipboardList,
  Copy,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  Users,
  UsersRound
} from "lucide-react";
import type { TeacherClassSummary } from "@/lib/classes/types";
import { cn } from "@/lib/utils";

const gradeTones = [
  { band: "from-teal-700 via-teal-600 to-cyan-700", soft: "bg-teal-50 text-teal-800", accent: "text-teal-700" },
  { band: "from-slate-800 via-slate-700 to-teal-800", soft: "bg-slate-100 text-slate-800", accent: "text-slate-700" },
  { band: "from-emerald-700 via-emerald-600 to-teal-700", soft: "bg-emerald-50 text-emerald-800", accent: "text-emerald-700" },
  { band: "from-sky-800 via-sky-700 to-teal-700", soft: "bg-sky-50 text-sky-900", accent: "text-sky-700" }
];

export function TeacherClassesPage() {
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gradeLevel, setGradeLevel] = useState(6);
  const [copiedId, setCopiedId] = useState("");

  const totals = useMemo(() => ({
    classes: classes.length,
    students: classes.reduce((sum, item) => sum + item.memberCount, 0),
    quizzes: classes.reduce((sum, item) => sum + item.quizCount, 0)
  }), [classes]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/teacher/classes", { cache: "no-store" });
      const payload = await response.json() as { classes?: TeacherClassSummary[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load classes.");
      setClasses(payload.classes ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load classes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createClass(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, gradeLevel })
      });
      const payload = await response.json() as { classroom?: TeacherClassSummary; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to create class.");
      setName("");
      setDescription("");
      setShowCreate(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create class.");
    } finally {
      setCreating(false);
    }
  }

  async function copyJoinLink(classroom: TeacherClassSummary) {
    const url = `${window.location.origin}${classroom.joinUrl}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(classroom.id);
    window.setTimeout(() => setCopiedId(""), 1800);
  }

  async function copyCode(classroom: TeacherClassSummary) {
    await navigator.clipboard.writeText(classroom.joinCode);
    setCopiedId(`code-${classroom.id}`);
    window.setTimeout(() => setCopiedId(""), 1800);
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-7">
      <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_28px_70px_rgba(15,23,42,.35)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 18%, rgba(45,212,191,.35), transparent 42%), radial-gradient(circle at 88% 12%, rgba(56,189,248,.22), transparent 36%), linear-gradient(135deg, rgba(15,23,42,.2), transparent 55%)"
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }}
        />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:p-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-200/90">SkulKid Classes</p>
            <h1 className="mt-3 max-w-xl text-3xl font-black tracking-tight sm:text-5xl">
              Your classrooms
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Create a class, share a code, then assign subjects and quizzes for every learner.
            </p>
          </div>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-300 px-5 text-base font-black text-slate-950 shadow-[0_12px_30px_rgba(45,212,191,.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => {
              setShowCreate(true);
              window.setTimeout(() => document.getElementById("class-name-input")?.focus(), 120);
            }}
            type="button"
          >
            <Plus className="size-5" />
            Create a class
          </button>
        </div>
      </header>

      {!loading && classes.length > 0 ? (
        <section aria-label="Class overview" className="grid grid-cols-3 gap-3">
          <OverviewTile icon={UsersRound} label="Classes" value={totals.classes} />
          <OverviewTile icon={Users} label="Students" value={totals.students} />
          <OverviewTile icon={ClipboardList} label="Quizzes" value={totals.quizzes} />
        </section>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <section aria-labelledby="active-classes-heading" className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-teal-700">Active classes</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl" id="active-classes-heading">
                {classes.length ? "Open a room to teach" : "Start with your first class"}
              </h2>
            </div>
            {classes.length ? (
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-black text-slate-800 hover:bg-slate-50"
                onClick={() => setShowCreate(true)}
                type="button"
              >
                <Plus className="size-4" />
                New class
              </button>
            ) : null}
          </div>

          {error && !showCreate ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2].map((item) => (
                <div className="h-64 animate-pulse rounded-[1.75rem] border border-slate-200 bg-white" key={item} />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <EmptyTeacherClasses onCreate={() => setShowCreate(true)} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((classroom, index) => (
                <TeacherClassCard
                  classroom={classroom}
                  copiedId={copiedId}
                  key={classroom.id}
                  onCopyCode={() => void copyCode(classroom)}
                  onCopyLink={() => void copyJoinLink(classroom)}
                  tone={gradeTones[index % gradeTones.length]}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-8">
          <form
            className={cn(
              "overflow-hidden rounded-[1.75rem] border bg-white shadow-[var(--shadow-card)] transition duration-200",
              showCreate ? "border-teal-300 ring-4 ring-teal-100" : "border-slate-200"
            )}
            onSubmit={createClass}
          >
            <div className="bg-gradient-to-br from-teal-700 to-slate-900 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                  <Plus className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-teal-100">New classroom</p>
                  <h3 className="text-lg font-black">Create a class</h3>
                </div>
              </div>
            </div>
            <div className="grid gap-3 p-5">
              <label className="grid gap-1.5 text-sm font-black text-slate-700" htmlFor="class-name-input">
                Class name
                <input
                  className="min-h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  id="class-name-input"
                  onChange={(event) => setName(event.target.value)}
                  onFocus={() => setShowCreate(true)}
                  placeholder="Basic 6 Science Explorers"
                  required
                  value={name}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-black text-slate-700">
                Grade
                <select
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  onChange={(event) => setGradeLevel(Number(event.target.value))}
                  value={gradeLevel}
                >
                  {[1, 2, 3, 4, 5, 6].map((grade) => (
                    <option key={grade} value={grade}>Basic {grade}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-black text-slate-700">
                Description
                <textarea
                  className="min-h-24 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional note for your students"
                  value={description}
                />
              </label>
              {error && showCreate ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 font-black text-white shadow-[0_10px_24px_rgba(15,118,110,.28)] transition hover:bg-teal-800 disabled:opacity-60"
                disabled={creating || !name.trim()}
                type="submit"
              >
                {creating ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
                {creating ? "Creating…" : "Create class"}
              </button>
            </div>
          </form>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-black text-slate-950">How students join</h3>
            <ol className="mt-4 grid gap-3">
              {[
                "Create a class and copy the join code or link",
                "Share it in class, WhatsApp, or your school group",
                "Students join and appear on your roster instantly"
              ].map((step, index) => (
                <li className="flex gap-3 text-sm leading-6 text-slate-600" key={step}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-teal-50 text-xs font-black text-teal-800">
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
  );
}

function TeacherClassCard({
  classroom,
  tone,
  copiedId,
  onCopyLink,
  onCopyCode
}: {
  classroom: TeacherClassSummary;
  tone: (typeof gradeTones)[number];
  copiedId: string;
  onCopyLink: () => void;
  onCopyCode: () => void;
}) {
  const initial = classroom.name.trim().charAt(0).toUpperCase() || "C";
  const linkCopied = copiedId === classroom.id;
  const codeCopied = copiedId === `code-${classroom.id}`;

  return (
    <article className="group flex min-h-[17rem] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,23,42,.12)]">
      <div className={cn("relative overflow-hidden bg-gradient-to-br px-5 py-4 text-white", tone.band)}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/15 text-xl font-black ring-1 ring-white/20">
            {initial}
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ring-1 ring-white/20">
            Basic {classroom.gradeLevel}
          </span>
        </div>
        <h3 className="relative mt-4 line-clamp-2 text-xl font-black leading-tight">{classroom.name}</h3>
        <p className="relative mt-1 text-sm font-semibold text-white/80">
          {classroom.memberCount} student{classroom.memberCount === 1 ? "" : "s"} enrolled
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
          {classroom.description || "Assign subjects, set quizzes and coach your learners from this room."}
        </p>

        <button
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-left transition hover:border-teal-300 hover:bg-teal-50/60"
          onClick={onCopyCode}
          type="button"
        >
          <span>
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Join code</span>
            <span className="font-black tracking-[0.18em] text-slate-950">{classroom.joinCode}</span>
          </span>
          <span className={cn("inline-flex items-center gap-1 text-xs font-black", tone.accent)}>
            {codeCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {codeCopied ? "Copied" : "Copy"}
          </span>
        </button>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat icon={Users} label="Students" value={classroom.memberCount} tone={tone.soft} />
          <MiniStat icon={BookOpenCheck} label="Subjects" value={classroom.courseCount} tone={tone.soft} />
          <MiniStat icon={ClipboardList} label="Quizzes" value={classroom.quizCount} tone={tone.soft} />
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-50"
            onClick={onCopyLink}
            type="button"
          >
            {linkCopied ? <Check className="size-4 text-teal-700" /> : <Link2 className="size-4" />}
            {linkCopied ? "Copied" : "Copy link"}
          </button>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800"
            href={`/teacher/classes/${classroom.id}`}
          >
            Open
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyTeacherClasses({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-dashed border-slate-300 bg-white">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <span className="grid size-14 place-items-center rounded-2xl bg-teal-100 text-teal-800">
            <UsersRound className="size-7" />
          </span>
          <h3 className="mt-4 text-2xl font-black text-slate-950">No classes yet</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            Create your first classroom, share the join code, and start assigning subjects and quizzes.
          </p>
          <button
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 font-black text-white hover:bg-teal-800"
            onClick={onCreate}
            type="button"
          >
            <Plus className="size-4" />
            Create your first class
          </button>
        </div>
        <div className="rounded-[1.5rem] bg-gradient-to-br from-teal-50 via-white to-slate-50 p-5 ring-1 ring-teal-100">
          <p className="text-xs font-black uppercase tracking-wider text-teal-700">You will be able to</p>
          <ul className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
            <li className="rounded-xl bg-white px-3 py-2.5 shadow-sm">Invite pupils with one code</li>
            <li className="rounded-xl bg-white px-3 py-2.5 shadow-sm">Assign subjects for the class</li>
            <li className="rounded-xl bg-white px-3 py-2.5 shadow-sm">Run quizzes and watch the board</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function OverviewTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-800">
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
