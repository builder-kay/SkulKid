"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import {
  LIKERT_FULL_LABELS,
  type FormDef,
  type FormType,
  type QuestionDef
} from "@/lib/research/questionnaire";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";
import { cn } from "@/lib/utils";

type Props = { form: FormDef };

function draftKey(formType: FormType) {
  return `skulkid-feedback-draft:${formType}`;
}

const theme = {
  student: {
    chip: "border-blue-200 bg-blue-50 text-blue-700",
    progress: "from-blue-600 to-sky-400",
    accent: "text-blue-700",
    primary: "bg-blue-600 hover:bg-blue-700 shadow-[0_12px_28px_rgba(37,99,235,.22)]",
    selected: "border-blue-600 bg-blue-600 text-white",
    selectedSoft: "border-blue-600 bg-blue-50 text-blue-950",
    ring: "focus-visible:ring-blue-500",
    glow: "from-blue-600/15 via-transparent to-sky-400/10"
  },
  teacher: {
    chip: "border-violet-200 bg-violet-50 text-violet-700",
    progress: "from-violet-700 to-indigo-400",
    accent: "text-violet-700",
    primary: "bg-violet-700 hover:bg-violet-800 shadow-[0_12px_28px_rgba(109,40,217,.22)]",
    selected: "border-violet-700 bg-violet-700 text-white",
    selectedSoft: "border-violet-700 bg-violet-50 text-violet-950",
    ring: "focus-visible:ring-violet-500",
    glow: "from-violet-700/15 via-transparent to-indigo-400/10"
  }
} as const;

export function FeedbackWizard({ form }: Props) {
  const [consented, setConsented] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const skin = theme[form.formType];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(form.formType));
      if (!raw) return;
      const parsed = JSON.parse(raw) as { consented?: boolean; step?: number; answers?: Record<string, string> };
      if (parsed.answers) setAnswers(parsed.answers);
      if (typeof parsed.step === "number") setStep(Math.min(Math.max(0, parsed.step), form.sections.length - 1));
      if (parsed.consented) setConsented(true);
    } catch {
      /* ignore corrupt draft */
    }
  }, [form.formType, form.sections.length]);

  useEffect(() => {
    if (done) return;
    try {
      localStorage.setItem(draftKey(form.formType), JSON.stringify({ consented, step, answers }));
    } catch {
      /* quota */
    }
  }, [answers, consented, done, form.formType, step]);

  const section = form.sections[step];
  const answeredInSection = useMemo(() => {
    const required = section.questions.filter((q) => q.required && (q.kind === "likert" || q.kind === "single"));
    const doneCount = required.filter((q) => Boolean(answers[q.id])).length;
    return { doneCount, total: required.length };
  }, [answers, section.questions]);

  const progress = useMemo(() => {
    const total = form.sections.length;
    const base = consented ? 1 : 0;
    return Math.round(((step + base) / (total + 1)) * 100);
  }, [consented, form.sections.length, step]);

  function setAnswer(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setError("");
  }

  function sectionComplete() {
    for (const question of section.questions) {
      if (!question.required) continue;
      if (question.kind === "likert" || question.kind === "single") {
        if (!answers[question.id]) return false;
      }
    }
    return true;
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: form.formType,
          answers,
          website: honeypot,
          meta: {
            viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : undefined,
            locale: typeof navigator !== "undefined" ? navigator.language : undefined
          }
        })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to submit.");
      localStorage.removeItem(draftKey(form.formType));
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Shell form={form} progress={100} skin={skin}>
        <div className="mx-auto max-w-lg overflow-hidden rounded-[2rem] border border-emerald-100 bg-white text-center shadow-[0_24px_60px_rgba(15,23,42,.1)]">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-10 text-white">
            <CheckCircle2 className="mx-auto size-14" />
            <h2 className="mt-4 text-3xl font-black tracking-tight">Thank you!</h2>
          </div>
          <div className="px-6 py-7">
            <p className="text-sm leading-7 text-slate-600">
              Your responses will help improve learning for Ghanaian primary schools.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link className={cn("inline-flex min-h-12 items-center justify-center rounded-2xl px-5 font-black text-white", skin.primary)} href="/feedback">
                Feedback home
              </Link>
              <Link className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 font-black text-slate-700 hover:bg-slate-50" href="/">
                Visit SkulKid
              </Link>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!consented) {
    return (
      <Shell form={form} progress={progress} skin={skin}>
        <div className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,.1)]">
          <div className={cn("bg-gradient-to-br px-6 py-7 text-white sm:px-8", form.formType === "student" ? "from-blue-600 to-sky-500" : "from-violet-700 to-indigo-600")}>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ring-1 ring-white/20">
              <Sparkles className="size-3.5 text-amber-300" />
              {form.formType === "student" ? "Form A · Student" : "Form B · Teacher"}
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{form.title}</h2>
            <p className="mt-2 text-sm font-bold text-white/80">{form.subtitle}</p>
          </div>
          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <p className="text-sm leading-7 text-slate-600 sm:text-base">{form.intro}</p>
            <ul className="mt-6 grid gap-3">
              <li className="flex gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                No name is required. Answers stay confidential.
              </li>
              <li className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">
                <ClipboardList className={cn("mt-0.5 size-5 shrink-0", skin.accent)} />
                Pause anytime — we save your progress on this device.
              </li>
            </ul>
            <button
              className={cn("mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-6 text-base font-black text-white transition hover:-translate-y-0.5 sm:w-auto", skin.primary)}
              onClick={() => setConsented(true)}
              type="button"
            >
              I understand — start <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const last = step >= form.sections.length - 1;

  return (
    <Shell form={form} progress={progress} skin={skin}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1" aria-hidden>
          {form.sections.map((item, index) => (
            <span
              className={cn(
                "h-1.5 min-w-8 flex-1 rounded-full transition",
                index < step ? cn("bg-gradient-to-r", skin.progress) : index === step ? "bg-slate-900" : "bg-slate-200"
              )}
              key={item.id}
            />
          ))}
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_20px_50px_rgba(15,23,42,.08)]">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-5 sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={cn("text-[11px] font-black uppercase tracking-[0.16em]", skin.accent)}>
                  Step {step + 1} of {form.sections.length}
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{section.title}</h2>
                {section.description ? <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-600">{section.description}</p> : null}
              </div>
              {answeredInSection.total ? (
                <span className={cn("rounded-full border px-3 py-1 text-xs font-black", skin.chip)}>
                  {answeredInSection.doneCount}/{answeredInSection.total} answered
                </span>
              ) : (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500">Optional page</span>
              )}
            </div>
          </div>

          <div className="grid gap-4 px-4 py-5 sm:gap-5 sm:px-7 sm:py-7">
            {section.questions.map((question) => (
              <QuestionField
                answers={answers}
                key={question.id}
                question={question}
                skin={skin}
                onChange={setAnswer}
              />
            ))}
          </div>

          <label className="sr-only" aria-hidden>
            Website
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>

          {error ? <p className="mx-4 mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950 sm:mx-7">{error}</p> : null}

          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-7">
            <button
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 px-4 font-black text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              disabled={step === 0 || busy}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              type="button"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            {last ? (
              <button
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-600 px-5 font-black text-white shadow-[0_12px_28px_rgba(5,150,105,.25)] hover:bg-emerald-700 disabled:opacity-60"
                disabled={busy || !sectionComplete()}
                onClick={() => void submit()}
                type="button"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Submit answers
              </button>
            ) : (
              <button
                className={cn("inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-black text-white disabled:opacity-60", skin.primary)}
                disabled={!sectionComplete()}
                onClick={() => {
                  if (!sectionComplete()) {
                    setError("Please answer the required questions on this page.");
                    return;
                  }
                  setStep((current) => Math.min(form.sections.length - 1, current + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                type="button"
              >
                Continue <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({
  form,
  progress,
  skin,
  children
}: {
  form: FormDef;
  progress: number;
  skin: (typeof theme)[FormType];
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff] text-slate-950">
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-b", skin.glow)} />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#93c5fd_1.15px,transparent_1.15px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link className={cn("inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2", skin.ring)} href="/feedback">
            <span className="rounded-xl bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200"><SkulKidLogo className="w-28" priority /></span>
            <span className="hidden text-sm font-black text-slate-700 sm:block">Research feedback</span>
          </Link>
          <span className={cn("rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]", skin.chip)}>
            {form.formType === "student" ? "Form A" : "Form B"}
          </span>
        </header>

        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-black text-slate-600">
            <span>Your progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-slate-200">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", skin.progress)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}

function QuestionField({
  question,
  answers,
  onChange,
  skin
}: {
  question: QuestionDef;
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
  skin: (typeof theme)[FormType];
}) {
  if (question.kind === "likert") {
    return (
      <fieldset className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_55%)] p-4 sm:p-5">
        <legend className="px-1 text-sm font-black leading-6 text-slate-950 sm:text-[15px]">
          <span className={cn("mr-2", skin.accent)}>{question.number}.</span>
          {question.prompt}
        </legend>
        <div className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2">
          {question.options?.map((option) => {
            const selected = answers[question.id] === option.value;
            return (
              <button
                aria-label={LIKERT_FULL_LABELS[option.value] ?? option.label}
                aria-pressed={selected}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center rounded-xl border-2 px-1 text-sm font-black transition sm:min-h-14",
                  selected ? skin.selected : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                )}
                key={option.value}
                onClick={() => onChange(question.id, option.value)}
                type="button"
              >
                <span>{option.label}</span>
                <span className={cn("mt-0.5 hidden text-[10px] font-bold sm:block", selected ? "text-white/80" : "text-slate-400")}>
                  {option.value}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>Strongly disagree</span>
          <span className="hidden sm:inline">Neutral</span>
          <span>Strongly agree</span>
        </div>
      </fieldset>
    );
  }

  if (question.kind === "single") {
    return (
      <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <legend className="px-1 text-sm font-black leading-6 text-slate-950 sm:text-[15px]">
          <span className={cn("mr-2", skin.accent)}>{question.number}.</span>
          {question.prompt}
        </legend>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {question.options?.map((option) => {
            const selected = answers[question.id] === option.value;
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  "min-h-14 rounded-2xl border-2 px-4 text-left text-sm font-bold transition",
                  selected ? skin.selectedSoft : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
                key={option.value}
                onClick={() => onChange(question.id, option.value)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (question.kind === "text") {
    return (
      <label className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <span className="text-sm font-black leading-6 text-slate-950 sm:text-[15px]">
          <span className={cn("mr-2", skin.accent)}>{question.number}.</span>
          {question.prompt}
          {!question.required ? <span className="ml-2 text-xs font-bold text-slate-400">(optional)</span> : null}
        </span>
        <textarea
          className="min-h-32 rounded-2xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm leading-6 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
          maxLength={question.maxLength ?? 2000}
          onChange={(event) => onChange(question.id, event.target.value)}
          placeholder="Type your answer here…"
          value={answers[question.id] ?? ""}
        />
      </label>
    );
  }

  return null;
}
