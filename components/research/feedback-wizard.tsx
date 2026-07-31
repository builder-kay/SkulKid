"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Loader2, ShieldCheck } from "lucide-react";
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

export function FeedbackWizard({ form }: Props) {
  const [consented, setConsented] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [honeypot, setHoneypot] = useState("");

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
  const progress = useMemo(() => {
    const total = form.sections.length;
    return Math.round(((step + (consented ? 1 : 0)) / (total + 1)) * 100);
  }, [consented, form.sections.length, step]);

  function setAnswer(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setError("");
  }

  function sectionComplete() {
    for (const question of section.questions) {
      if (!question.required) continue;
      if (question.kind === "triad") {
        if (answers[question.id] !== "works" && answers[question.id] !== "issue") return false;
        continue;
      }
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
      <Shell form={form} progress={100}>
        <div className="mx-auto max-w-xl rounded-[2rem] border border-emerald-200 bg-white p-8 text-center shadow-xl">
          <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
          <h2 className="mt-4 text-3xl font-black text-slate-950">Thank you!</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Your responses are valued and will help improve learning for Ghanaian primary schools.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 font-black text-white" href="/feedback">
              Back to feedback home
            </Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 font-black text-slate-700" href="/">
              Visit SkulKid
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (!consented) {
    return (
      <Shell form={form} progress={progress}>
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Research consent</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{form.title}</h2>
          <p className="mt-2 text-sm font-bold text-slate-500">{form.subtitle}</p>
          <p className="mt-4 text-sm leading-7 text-slate-600">{form.intro}</p>
          <ul className="mt-5 grid gap-2 text-sm text-slate-700">
            <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />No name is required. Answers stay confidential.</li>
            <li className="flex gap-2"><ClipboardList className="mt-0.5 size-4 shrink-0 text-blue-600" />You can pause anytime — we save your progress on this device.</li>
          </ul>
          <button
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-black text-white hover:bg-blue-700 sm:w-auto"
            onClick={() => setConsented(true)}
            type="button"
          >
            I understand — start <ArrowRight className="size-4" />
          </button>
        </div>
      </Shell>
    );
  }

  const last = step >= form.sections.length - 1;

  return (
    <Shell form={form} progress={progress}>
      <div className="mx-auto grid max-w-3xl gap-4">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                Step {step + 1} of {form.sections.length}
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">{section.title}</h2>
              {section.description ? <p className="mt-1 text-sm text-slate-600">{section.description}</p> : null}
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            {section.questions.map((question) => (
              <QuestionField
                answers={answers}
                key={question.id}
                question={question}
                onChange={setAnswer}
              />
            ))}
          </div>

          {/* honeypot */}
          <label className="sr-only" aria-hidden>
            Website
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>

          {error ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">{error}</p> : null}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 font-black text-slate-700 disabled:opacity-40"
              disabled={step === 0 || busy}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              type="button"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            {last ? (
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={busy || !sectionComplete()}
                onClick={() => void submit()}
                type="button"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Submit answers
              </button>
            ) : (
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-black text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={!sectionComplete()}
                onClick={() => {
                  if (!sectionComplete()) {
                    setError("Please answer the required questions on this page.");
                    return;
                  }
                  setStep((current) => Math.min(form.sections.length - 1, current + 1));
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

function Shell({ form, progress, children }: { form: FormDef; progress: number; children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_0%,#dbeafe_0%,transparent_42%),radial-gradient(circle_at_88%_8%,#ede9fe_0%,transparent_36%),linear-gradient(180deg,#f7fbff_0%,#ffffff_55%,#f8fafc_100%)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" href="/feedback">
            <span className="rounded-xl bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200"><SkulKidLogo className="w-28" priority /></span>
            <span className="hidden text-sm font-black text-slate-700 sm:block">Research feedback</span>
          </Link>
          <p className="text-xs font-bold text-slate-500">{form.subtitle}</p>
        </header>
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs font-black text-slate-600">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-500 transition-all" style={{ width: `${progress}%` }} />
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
  onChange
}: {
  question: QuestionDef;
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  if (question.kind === "likert") {
    return (
      <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <legend className="px-1 text-sm font-black text-slate-950">
          <span className="mr-2 text-blue-700">{question.number}.</span>
          {question.prompt}
        </legend>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {question.options?.map((option) => {
            const selected = answers[question.id] === option.value;
            return (
              <button
                aria-label={LIKERT_FULL_LABELS[option.value] ?? option.label}
                aria-pressed={selected}
                className={cn(
                  "min-h-12 rounded-xl border-2 text-sm font-black transition",
                  selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                )}
                key={option.value}
                onClick={() => onChange(question.id, option.value)}
                type="button"
              >
                <span className="block">{option.label}</span>
                <span className="mt-0.5 block text-[10px] font-bold opacity-80 sm:hidden">{option.value}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 hidden text-[11px] font-bold text-slate-500 sm:block">SD · D · N · A · SA</p>
      </fieldset>
    );
  }

  if (question.kind === "single") {
    return (
      <fieldset className="rounded-2xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-black text-slate-950">
          <span className="mr-2 text-blue-700">{question.number}.</span>
          {question.prompt}
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {question.options?.map((option) => {
            const selected = answers[question.id] === option.value;
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  "min-h-12 rounded-xl border-2 px-3 text-left text-sm font-bold transition",
                  selected ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 hover:border-blue-300"
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
      <label className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4">
        <span className="text-sm font-black text-slate-950">
          <span className="mr-2 text-blue-700">{question.number}.</span>
          {question.prompt}
          {!question.required ? <span className="ml-2 text-xs font-bold text-slate-400">(optional)</span> : null}
        </span>
        <textarea
          className="min-h-28 rounded-xl border border-slate-300 px-3 py-2 text-sm"
          maxLength={question.maxLength ?? 2000}
          onChange={(event) => onChange(question.id, event.target.value)}
          value={answers[question.id] ?? ""}
        />
      </label>
    );
  }

  if (question.kind === "triad") {
    const noteId = question.noteId ?? `${question.id}_notes`;
    return (
      <fieldset className="rounded-2xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-black text-slate-950">
          <span className="mr-2 text-blue-700">{question.number}.</span>
          {question.prompt}
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {question.options?.map((option) => {
            const selected = answers[question.id] === option.value;
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  "min-h-11 rounded-xl border-2 px-4 text-sm font-black",
                  selected
                    ? option.value === "works"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-rose-600 bg-rose-600 text-white"
                    : "border-slate-200 bg-slate-50"
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
        <input
          className="mt-3 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
          onChange={(event) => onChange(noteId, event.target.value)}
          placeholder="Notes / issue description (optional)"
          value={answers[noteId] ?? ""}
        />
      </fieldset>
    );
  }

  if (question.kind === "metric") {
    return (
      <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_8rem_6rem] sm:items-end">
        <label className="grid gap-1 text-sm font-black text-slate-950">
          <span><span className="mr-2 text-blue-700">{question.number}.</span>{question.prompt}</span>
          <input
            className="min-h-11 rounded-xl border border-slate-300 px-3 font-medium"
            onChange={(event) => onChange(`${question.id}_observed`, event.target.value)}
            placeholder="Observed value"
            value={answers[`${question.id}_observed`] ?? ""}
          />
        </label>
        <label className="grid gap-1 text-xs font-bold text-slate-600">
          Met target?
          <select
            className="min-h-11 rounded-xl border border-slate-300 px-2 text-sm font-black"
            onChange={(event) => onChange(`${question.id}_met`, event.target.value)}
            value={answers[`${question.id}_met`] ?? ""}
          >
            <option value="">—</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </label>
      </div>
    );
  }

  if (question.kind === "uat") {
    return (
      <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-950">
          <span className="mr-2 text-blue-700">{question.number}.</span>
          {question.prompt}
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Completion (e.g. 12/15)
            <input className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm" onChange={(e) => onChange(`${question.id}_completed`, e.target.value)} value={answers[`${question.id}_completed`] ?? ""} />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Mean time (sec)
            <input className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm" onChange={(e) => onChange(`${question.id}_time`, e.target.value)} value={answers[`${question.id}_time`] ?? ""} />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600 sm:col-span-1">
            Issues
            <input className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm" onChange={(e) => onChange(`${question.id}_issues`, e.target.value)} value={answers[`${question.id}_issues`] ?? ""} />
          </label>
        </div>
      </div>
    );
  }

  return null;
}
