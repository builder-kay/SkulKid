"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Copy,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  X
} from "lucide-react";
import type { ClassQuizQuestion } from "@/lib/classes/types";
import type { Quiz } from "@/components/teacher/teacher-quiz-library";
import {
  clearLibraryQuizDraft,
  readLibraryQuizDraft,
  saveLibraryQuizDraft
} from "@/lib/network/teacher-drafts";
import { useOnlineStatus } from "@/lib/network/use-online";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;
type Errors = Record<string, string>;

const subjects = [
  ["mathematics", "Mathematics"],
  ["english-language", "English Language"],
  ["science", "Science"],
  ["general", "General"]
] as const;

export function QuizEditorDialog({
  quiz,
  busy,
  onClose,
  onSave
}: {
  quiz: Quiz;
  busy: boolean;
  onClose: () => void;
  onSave: (quiz: Quiz) => Promise<void>;
}) {
  const [draft, setDraft] = useState(() => structuredClone(quiz));
  const [step, setStep] = useState<Step>(1);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [previewQuestion, setPreviewQuestion] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const initialSnapshot = useRef(JSON.stringify(quiz));
  const dirty = JSON.stringify(draft) !== initialSnapshot.current;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const online = useOnlineStatus();
  const draftReady = useRef(false);

  const readiness = useMemo(() => getReadiness(draft), [draft]);
  const ready = readiness.every((item) => item.complete);
  const active = draft.questions[activeQuestion] ?? draft.questions[0];

  useEffect(() => {
    draftReady.current = false;
    void readLibraryQuizDraft(quiz.id || "new").then((saved) => {
      if (saved?.quiz && typeof saved.quiz === "object") {
        setDraft(saved.quiz as Quiz);
      }
      draftReady.current = true;
    });
  }, [quiz.id]);

  useEffect(() => {
    if (!draftReady.current) return;
    const timer = window.setTimeout(() => {
      void saveLibraryQuizDraft(quiz.id || "new", draft);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [draft, quiz.id]);

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    initialFocusRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus();
    };
    // The dialog has one lifecycle; requestClose reads current state through React render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requestClose() {
    if (dirtyRef.current) setConfirmClose(true);
    else onClose();
  }

  function update(changes: Partial<Quiz>) {
    setDraft((current) => ({ ...current, ...changes }));
    setErrors({});
    setSaveError("");
  }

  function updateQuestion(questionIndex: number, changes: Partial<ClassQuizQuestion>) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) => index === questionIndex ? { ...question, ...changes } : question)
    }));
    setErrors({});
    setSaveError("");
  }

  function validateStep(target: Step) {
    const nextErrors = target === 1 ? validateQuizBasics(draft) : target === 2 ? validateQuizQuestions(draft) : {};
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function continueToNextStep() {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(3, current + 1) as Step);
  }

  function addQuestion() {
    if (draft.questions.length >= 30) return;
    const question = blankQuestion();
    update({ questions: [...draft.questions, question] });
    setActiveQuestion(draft.questions.length);
  }

  function duplicateQuestion(index: number) {
    if (draft.questions.length >= 30) return;
    const copy = { ...structuredClone(draft.questions[index]), id: crypto.randomUUID() };
    const questions = [...draft.questions];
    questions.splice(index + 1, 0, copy);
    update({ questions });
    setActiveQuestion(index + 1);
  }

  function removeQuestion(index: number) {
    if (draft.questions.length === 1) return;
    update({ questions: draft.questions.filter((_, questionIndex) => questionIndex !== index) });
    setActiveQuestion((current) => Math.max(0, Math.min(current, draft.questions.length - 2)));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.questions.length) return;
    const questions = [...draft.questions];
    [questions[index], questions[target]] = [questions[target], questions[index]];
    update({ questions });
    setActiveQuestion(target);
  }

  function changeQuestionType(index: number, type: ClassQuizQuestion["type"]) {
    const question = draft.questions[index];
    if (type === question.type) return;
    updateQuestion(index, {
      type,
      options: type === "true_false" ? ["True", "False"] : ["", "", "", ""],
      correctIndex: 0
    });
  }

  function addOption(index: number) {
    const question = draft.questions[index];
    if (question.type !== "multiple_choice" || question.options.length >= 6) return;
    updateQuestion(index, { options: [...question.options, ""] });
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    const question = draft.questions[questionIndex];
    if (question.type !== "multiple_choice" || question.options.length <= 2) return;
    const options = question.options.filter((_, index) => index !== optionIndex);
    const correctIndex = question.correctIndex === optionIndex
      ? 0
      : question.correctIndex > optionIndex ? question.correctIndex - 1 : question.correctIndex;
    updateQuestion(questionIndex, { options, correctIndex });
  }

  async function save(status: Quiz["status"]) {
    const validation = { ...validateQuizBasics(draft), ...validateQuizQuestions(draft) };
    if (Object.keys(validation).length) {
      setErrors(validation);
      setSaveError("Complete the highlighted fields before saving this quiz.");
      setStep(validation.title || validation.grades || validation.settings ? 1 : 2);
      return;
    }
    if (status === "ready" && !ready) {
      setSaveError("Complete every readiness check before marking this quiz ready.");
      return;
    }
    if ((status === "ready" || status === "archived") && !online) {
      await saveLibraryQuizDraft(quiz.id || "new", draft);
      return;
    }
    if (!online) {
      await saveLibraryQuizDraft(quiz.id || "new", draft);
      return;
    }
    setSaveError("");
    try {
      await onSave({ ...draft, status, questions: draft.questions.map(normalizeQuizQuestion) });
      await clearLibraryQuizDraft(quiz.id || "new");
    } catch (cause) {
      await saveLibraryQuizDraft(quiz.id || "new", draft);
      setSaveError(cause instanceof Error ? cause.message : "The quiz could not be saved.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}
    >
      <div
        aria-describedby="quiz-builder-progress"
        aria-labelledby="quiz-builder-title"
        aria-modal="true"
        className="w-full bg-slate-50 shadow-2xl sm:mx-auto sm:max-w-6xl sm:rounded-[2rem]"
        ref={dialogRef}
        role="dialog"
      >
        <header className="border-b border-slate-200 bg-white px-4 py-4 sm:rounded-t-[2rem] sm:px-6">
          <div className="flex items-start gap-4">
            <span className="hidden size-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700 sm:grid"><Sparkles className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">{draft.id ? "Edit reusable quiz" : "Create reusable quiz"}</p>
              <h2 className="truncate text-xl font-black text-slate-950 sm:text-2xl" id="quiz-builder-title" ref={initialFocusRef} tabIndex={-1}>{draft.title || "Untitled quiz"}</h2>
              <p className="mt-1 text-xs font-bold text-slate-500" id="quiz-builder-progress">
                Step {step} of 3 · {stepLabel(step)}
                {dirty ? " · Unsaved changes" : ""}
              </p>
            </div>
            <button aria-label="Close quiz builder" className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100" onClick={requestClose} type="button"><X className="size-5" /></button>
          </div>
          <div aria-hidden="true" className="mt-4 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((number) => <span className={cn("h-2 rounded-full transition", number <= step ? "bg-violet-600" : "bg-slate-200")} key={number} />)}
          </div>
        </header>

        <div aria-live="polite" className="sr-only">Step {step} of 3: {stepLabel(step)}</div>
        <main className="p-4 sm:p-6">
          <div className="mx-auto max-w-5xl">
            {step === 1 ? <BasicsStep draft={draft} errors={errors} onUpdate={update} /> : null}
            {step === 2 && active ? (
              <QuestionsStep
                activeIndex={activeQuestion}
                draft={draft}
                errors={errors}
                onActiveChange={setActiveQuestion}
                onAdd={addQuestion}
                onAddOption={addOption}
                onChangeType={changeQuestionType}
                onDuplicate={duplicateQuestion}
                onMove={moveQuestion}
                onRemove={removeQuestion}
                onRemoveOption={removeOption}
                onUpdate={updateQuestion}
              />
            ) : null}
            {step === 3 ? (
              <ReviewStep
                draft={draft}
                previewAnswers={previewAnswers}
                previewIndex={previewQuestion}
                readiness={readiness}
                onAnswer={(questionId, answer) => setPreviewAnswers((current) => ({ ...current, [questionId]: answer }))}
                onPreviewChange={setPreviewQuestion}
              />
            ) : null}
            {saveError ? <div className="mt-5 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-900" role="alert"><CircleAlert className="size-5 shrink-0" />{saveError}</div> : null}
          </div>
        </main>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 font-black text-slate-700 disabled:opacity-40" disabled={step === 1 || busy} onClick={() => setStep((current) => Math.max(1, current - 1) as Step)} type="button"><ArrowLeft className="size-4" />Back</button>
            <div className="ml-auto flex flex-wrap justify-end gap-2">
              {step < 3 ? <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 font-black text-white shadow-lg shadow-violet-200" onClick={continueToNextStep} type="button">Continue<ArrowRight className="size-4" /></button> : (
                <>
                  {draft.status === "archived" ? (
                    <>
                      <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 font-black text-slate-700 disabled:opacity-50" disabled={busy} onClick={() => void save("archived")} type="button"><Save className="size-4" />Save archived</button>
                      <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-500 px-4 font-black text-slate-950 disabled:opacity-50" disabled={busy} onClick={() => update({ status: "draft" })} type="button"><RotateCcw className="size-4" />Restore as draft</button>
                    </>
                  ) : (
                    <>
                      <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 font-black text-slate-700 disabled:opacity-50" disabled={busy} onClick={() => void save("draft")} type="button">{busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save draft</button>
                      <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 font-black text-white shadow-lg shadow-emerald-200 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || !ready || !online} onClick={() => void save("ready")} type="button">{busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}Mark ready</button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </footer>

        {confirmClose ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-slate-950/65 p-4">
            <div aria-labelledby="discard-title" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" role="alertdialog">
              <span className="grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><CircleAlert className="size-5" /></span>
              <h3 className="mt-4 text-xl font-black" id="discard-title">Discard your changes?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Changes made since opening this quiz have not been saved.</p>
              <div className="mt-5 flex justify-end gap-2">
                <button className="min-h-11 rounded-xl border border-slate-300 px-4 font-black" onClick={() => setConfirmClose(false)} type="button">Continue editing</button>
                <button className="min-h-11 rounded-xl bg-rose-600 px-4 font-black text-white" onClick={onClose} type="button">Discard changes</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BasicsStep({ draft, errors, onUpdate }: { draft: Quiz; errors: Errors; onUpdate: (changes: Partial<Quiz>) => void }) {
  return <section aria-labelledby="basics-title">
    <p className="text-xs font-black uppercase tracking-wider text-violet-700">Step 1</p>
    <h3 className="mt-1 text-2xl font-black sm:text-3xl" id="basics-title">Set up your quiz</h3>
    <p className="mt-2 text-sm leading-6 text-slate-600">Give teachers and learners a clear idea of what this challenge covers.</p>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Field error={errors.title} help={`${draft.title.length}/120 characters`} label="Quiz title">
          <input aria-invalid={Boolean(errors.title)} className={inputClass(errors.title)} maxLength={120} onChange={(event) => onUpdate({ title: event.target.value })} placeholder="e.g. Fractions Adventure" value={draft.title} />
        </Field>
        <Field help={`${draft.description.length}/500 characters · Optional`} label="Short description">
          <textarea className={cn(inputClass(), "min-h-28 resize-y py-3")} maxLength={500} onChange={(event) => onUpdate({ description: event.target.value })} placeholder="What knowledge or skill will this quiz check?" value={draft.description} />
        </Field>
        <Field label="Subject">
          <select className={inputClass()} onChange={(event) => onUpdate({ subject: event.target.value })} value={draft.subject}>{subjects.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </Field>
        <fieldset>
          <legend className="text-sm font-black text-slate-800">Basic levels</legend>
          <p className="mt-1 text-xs text-slate-500">Choose every level that can use this quiz.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((grade) => {
              const selected = draft.gradeLevels.includes(grade);
              return <button aria-pressed={selected} className={cn("min-h-12 rounded-xl border px-3 font-black transition", selected ? "border-violet-600 bg-violet-600 text-white shadow-md" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300")} key={grade} onClick={() => onUpdate({ gradeLevels: selected ? draft.gradeLevels.filter((item) => item !== grade) : [...draft.gradeLevels, grade].sort() })} type="button">{selected ? <Check className="mr-1 inline size-4" /> : null}Basic {grade}</button>;
            })}
          </div>
          {errors.grades ? <p className="mt-2 text-xs font-bold text-rose-700">{errors.grades}</p> : null}
        </fieldset>
      </div>
      <aside className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-amber-400 text-amber-950"><Trophy className="size-5" /></span><div><p className="text-xs font-black uppercase tracking-wider text-amber-800">Challenge settings</p><h4 className="font-black">Rewards and mastery</h4></div></div>
        <div className="mt-5 grid gap-4">
          <Field label="XP reward" help="0–500 XP"><input className={inputClass(errors.settings)} max={500} min={0} onChange={(event) => onUpdate({ baseXpReward: Number(event.target.value) })} type="number" value={draft.baseXpReward} /></Field>
          <Field label="Passing score" help="0–100%"><input className={inputClass(errors.settings)} max={100} min={0} onChange={(event) => onUpdate({ passingScore: Number(event.target.value) })} type="number" value={draft.passingScore} /></Field>
          <Field label="Maximum attempts" help="1–20 attempts"><input className={inputClass(errors.settings)} max={20} min={1} onChange={(event) => onUpdate({ maxAttempts: Number(event.target.value) })} type="number" value={draft.maxAttempts} /></Field>
        </div>
        {errors.settings ? <p className="mt-3 text-xs font-bold text-rose-700">{errors.settings}</p> : null}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <SummaryMetric label="XP" value={draft.baseXpReward} />
          <SummaryMetric label="Pass" value={`${draft.passingScore}%`} />
          <SummaryMetric label="Tries" value={draft.maxAttempts} />
        </div>
      </aside>
    </div>
  </section>;
}

function QuestionsStep(props: {
  draft: Quiz; activeIndex: number; errors: Errors;
  onActiveChange: (index: number) => void; onAdd: () => void; onDuplicate: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void; onRemove: (index: number) => void;
  onChangeType: (index: number, type: ClassQuizQuestion["type"]) => void;
  onAddOption: (index: number) => void; onRemoveOption: (questionIndex: number, optionIndex: number) => void;
  onUpdate: (index: number, changes: Partial<ClassQuizQuestion>) => void;
}) {
  const { draft, activeIndex, errors } = props;
  const question = draft.questions[activeIndex];
  return <section aria-labelledby="questions-title">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Step 2</p><h3 className="mt-1 text-2xl font-black sm:text-3xl" id="questions-title">Build your questions</h3><p className="mt-2 text-sm text-slate-600">Choose the correct answer as you write each question.</p></div><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 font-black text-white disabled:opacity-50" disabled={draft.questions.length >= 30} onClick={props.onAdd} type="button"><Plus className="size-4" />Add question</button></div>
    <nav aria-label="Quiz questions" className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3">
      {draft.questions.map((item, index) => {
        const complete = quizQuestionComplete(item);
        return <button aria-current={activeIndex === index ? "step" : undefined} className={cn("relative grid size-11 shrink-0 place-items-center rounded-xl border text-sm font-black transition", activeIndex === index ? "border-violet-600 bg-violet-600 text-white" : complete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800")} key={item.id} onClick={() => props.onActiveChange(index)} type="button">{index + 1}{complete ? <CheckCircle2 className="absolute -right-1 -top-1 size-4 fill-white text-emerald-600" /> : null}</button>;
      })}
    </nav>
    {errors.questions ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800" role="alert">{errors.questions}</p> : null}
    <article className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4">
        <div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Question {activeIndex + 1} of {draft.questions.length}</p><p className="mt-1 text-sm font-bold text-slate-600">{quizQuestionComplete(question) ? "Ready for review" : "Needs more information"}</p></div>
        <div className="flex gap-1">
          <IconButton disabled={activeIndex === 0} label="Move question left" onClick={() => props.onMove(activeIndex, -1)}><ChevronLeft /></IconButton>
          <IconButton disabled={activeIndex === draft.questions.length - 1} label="Move question right" onClick={() => props.onMove(activeIndex, 1)}><ChevronRight /></IconButton>
          <IconButton disabled={draft.questions.length >= 30} label="Duplicate question" onClick={() => props.onDuplicate(activeIndex)}><Copy /></IconButton>
          <IconButton disabled={draft.questions.length === 1} label="Delete question" onClick={() => props.onRemove(activeIndex)} tone="danger"><Trash2 /></IconButton>
        </div>
      </header>
      <div className="grid gap-5 p-4 sm:p-6">
        <fieldset>
          <legend className="text-sm font-black text-slate-800">Question type</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[["multiple_choice", "Multiple choice"], ["true_false", "True or false"]].map(([value, label]) => <button aria-pressed={question.type === value} className={cn("min-h-11 rounded-xl border px-3 font-black", question.type === value ? "border-violet-600 bg-violet-50 text-violet-800 ring-1 ring-violet-600" : "border-slate-200")} key={value} onClick={() => props.onChangeType(activeIndex, value as ClassQuizQuestion["type"])} type="button">{label}</button>)}
          </div>
        </fieldset>
        <Field label="Question prompt" help={`${question.prompt.length}/400 characters`}>
          <textarea className={cn(inputClass(), "min-h-24 resize-y py-3 text-base font-bold")} maxLength={400} onChange={(event) => props.onUpdate(activeIndex, { prompt: event.target.value })} placeholder="Ask one clear question" value={question.prompt} />
        </Field>
        <fieldset>
          <div className="flex items-end justify-between gap-3"><div><legend className="text-sm font-black text-slate-800">Answer choices</legend><p className="mt-1 text-xs text-slate-500">Select the circle beside the correct answer.</p></div>{question.type === "multiple_choice" ? <button className="text-xs font-black text-violet-700 disabled:opacity-40" disabled={question.options.length >= 6} onClick={() => props.onAddOption(activeIndex)} type="button"><Plus className="mr-1 inline size-3.5" />Add option</button> : null}</div>
          <div className="mt-3 grid gap-2">
            {question.options.map((option, optionIndex) => {
              const correct = question.correctIndex === optionIndex;
              return <div className={cn("flex min-h-14 items-center gap-3 rounded-xl border p-2 transition", correct ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : "border-slate-200 bg-slate-50")} key={`${question.id}-${optionIndex}`}>
                <label className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full"><input aria-label={`Mark answer ${optionIndex + 1} correct`} checked={correct} className="size-5 accent-emerald-600" name={`correct-${question.id}`} onChange={() => props.onUpdate(activeIndex, { correctIndex: optionIndex })} type="radio" /></label>
                {question.type === "true_false" ? <span className="flex-1 font-black">{option}</span> : <input aria-label={`Answer option ${optionIndex + 1}`} className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3" maxLength={120} onChange={(event) => props.onUpdate(activeIndex, { options: question.options.map((item, index) => index === optionIndex ? event.target.value : item) })} placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} value={option} />}
                {correct ? <span className="hidden text-xs font-black text-emerald-700 sm:inline">Correct answer</span> : null}
                {question.type === "multiple_choice" ? <IconButton disabled={question.options.length <= 2} label={`Remove option ${optionIndex + 1}`} onClick={() => props.onRemoveOption(activeIndex, optionIndex)} tone="danger"><X /></IconButton> : null}
              </div>;
            })}
          </div>
        </fieldset>
        <Field label="Answer explanation" help={`${question.explanation?.length ?? 0}/500 characters · Optional`}>
          <textarea className={cn(inputClass(), "min-h-24 resize-y py-3")} maxLength={500} onChange={(event) => props.onUpdate(activeIndex, { explanation: event.target.value })} placeholder="Explain why the answer is correct after the learner completes the quiz." value={question.explanation ?? ""} />
        </Field>
      </div>
    </article>
  </section>;
}

function ReviewStep({ draft, readiness, previewIndex, previewAnswers, onPreviewChange, onAnswer }: {
  draft: Quiz; readiness: Array<{ label: string; complete: boolean }>; previewIndex: number; previewAnswers: Record<string, number>;
  onPreviewChange: (index: number) => void; onAnswer: (questionId: string, answer: number) => void;
}) {
  const question = draft.questions[previewIndex];
  return <section aria-labelledby="review-title">
    <p className="text-xs font-black uppercase tracking-wider text-violet-700">Step 3</p>
    <h3 className="mt-1 text-2xl font-black sm:text-3xl" id="review-title">Review and save</h3>
    <p className="mt-2 text-sm text-slate-600">Check the learner experience and confirm the quiz is ready.</p>
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <div className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-violet-950 to-blue-900 p-4 text-white shadow-xl sm:p-6">
        <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider">Learner preview</span><span className="text-xs font-bold text-violet-200">{previewIndex + 1} / {draft.questions.length}</span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all" style={{ width: `${((previewIndex + 1) / draft.questions.length) * 100}%` }} /></div>
        <div className="mt-5 rounded-2xl bg-white p-5 text-slate-950 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-wider text-violet-700">{draft.title || "Untitled quiz"}</p>
          <h4 className="mt-3 text-xl font-black leading-8">{question.prompt || "Question prompt will appear here"}</h4>
          <div className="mt-5 grid gap-3">
            {question.options.map((option, index) => <button aria-pressed={previewAnswers[question.id] === index} className={cn("min-h-12 rounded-xl border px-4 text-left font-bold transition", previewAnswers[question.id] === index ? "border-violet-600 bg-violet-600 text-white shadow-md" : "border-slate-200 bg-slate-50 hover:border-violet-300")} key={`${question.id}-preview-${index}`} onClick={() => onAnswer(question.id, index)} type="button"><span className="mr-2">{String.fromCharCode(65 + index)}.</span>{option || `Option ${index + 1}`}</button>)}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3"><button className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-white/20 px-3 text-sm font-black disabled:opacity-40" disabled={previewIndex === 0} onClick={() => onPreviewChange(previewIndex - 1)} type="button"><ChevronLeft className="size-4" />Previous</button><span className="text-xs font-bold text-violet-200">Preview only · no attempt recorded</span><button className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-white px-3 text-sm font-black text-violet-950 disabled:opacity-40" disabled={previewIndex === draft.questions.length - 1} onClick={() => onPreviewChange(previewIndex + 1)} type="button">Next<ChevronRight className="size-4" /></button></div>
      </div>
      <aside className="grid gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><ClipboardCheck className="size-5 text-violet-700" /><h4 className="font-black">Readiness check</h4></div><ul className="mt-4 grid gap-2">{readiness.map((item) => <li className="flex items-center gap-2 text-sm font-bold" key={item.label}>{item.complete ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /> : <CircleAlert className="size-5 shrink-0 text-amber-500" />}<span className={item.complete ? "text-slate-700" : "text-amber-900"}>{item.label}</span></li>)}</ul></div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5"><h4 className="font-black text-violet-950">Quiz summary</h4><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><SummaryItem label="Subject" value={subjectLabel(draft.subject)} /><SummaryItem label="Levels" value={draft.gradeLevels.map((grade) => `B${grade}`).join(", ") || "None"} /><SummaryItem label="Questions" value={String(draft.questions.length)} /><SummaryItem label="Reward" value={`${draft.baseXpReward} XP`} /><SummaryItem label="Pass mark" value={`${draft.passingScore}%`} /><SummaryItem label="Attempts" value={String(draft.maxAttempts)} /></dl></div>
      </aside>
    </div>
  </section>;
}

export function validateQuizBasics(quiz: Quiz): Errors {
  const errors: Errors = {};
  if (quiz.title.trim().length < 2) errors.title = "Enter a quiz title with at least 2 characters.";
  if (!quiz.gradeLevels.length) errors.grades = "Choose at least one Basic level.";
  if (!Number.isInteger(quiz.baseXpReward) || quiz.baseXpReward < 0 || quiz.baseXpReward > 500 || !Number.isInteger(quiz.passingScore) || quiz.passingScore < 0 || quiz.passingScore > 100 || !Number.isInteger(quiz.maxAttempts) || quiz.maxAttempts < 1 || quiz.maxAttempts > 20) errors.settings = "Use valid XP, passing score, and attempt values.";
  return errors;
}

export function validateQuizQuestions(quiz: Quiz): Errors {
  if (!quiz.questions.length) return { questions: "Add at least one question." };
  const invalid = quiz.questions.map((question, index) => quizQuestionComplete(question) ? null : index + 1).filter(Boolean);
  return invalid.length ? { questions: `Complete question${invalid.length === 1 ? "" : "s"} ${invalid.join(", ")} before continuing.` } : {};
}

export function quizQuestionComplete(question: ClassQuizQuestion) {
  const options = question.options.map((option) => option.trim());
  return question.prompt.trim().length >= 3
    && options.length >= 2 && options.length <= 6
    && options.every(Boolean)
    && new Set(options.map((option) => option.toLowerCase())).size === options.length
    && question.correctIndex >= 0 && question.correctIndex < options.length;
}

function getReadiness(quiz: Quiz) {
  return [
    { label: "Quiz title and subject are complete", complete: quiz.title.trim().length >= 2 && Boolean(quiz.subject) },
    { label: "At least one Basic level is selected", complete: quiz.gradeLevels.length > 0 },
    { label: "Challenge settings are within allowed ranges", complete: !validateQuizBasics(quiz).settings },
    { label: `All ${quiz.questions.length} question${quiz.questions.length === 1 ? "" : "s"} have valid answers`, complete: quiz.questions.length > 0 && quiz.questions.every(quizQuestionComplete) },
    { label: "Explanations are optional and can be added later", complete: true }
  ];
}

export function normalizeQuizQuestion(question: ClassQuizQuestion): ClassQuizQuestion {
  return {
    ...question,
    prompt: question.prompt.trim(),
    options: question.type === "true_false" ? ["True", "False"] : question.options.map((option) => option.trim()),
    explanation: question.explanation?.trim() || ""
  };
}

function blankQuestion(): ClassQuizQuestion {
  return { id: crypto.randomUUID(), prompt: "", type: "multiple_choice", options: ["", "", "", ""], correctIndex: 0, explanation: "" };
}

function Field({ label, help, error, children }: { label: string; help?: string; error?: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-black text-slate-800">{label}{children}{error ? <span className="text-xs text-rose-700">{error}</span> : help ? <span className="text-xs font-normal text-slate-500">{help}</span> : null}</label>;
}

function IconButton({ label, disabled, tone, onClick, children }: { label: string; disabled?: boolean; tone?: "danger"; onClick: () => void; children: React.ReactElement<{ className?: string }> }) {
  return <button aria-label={label} className={cn("grid size-10 place-items-center rounded-xl border bg-white disabled:opacity-35", tone === "danger" ? "border-rose-200 text-rose-700 hover:bg-rose-50" : "border-slate-200 text-slate-600 hover:bg-slate-100")} disabled={disabled} onClick={onClick} title={label} type="button">{children}</button>;
}

function SummaryMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-white/75 p-2"><b className="block text-lg text-slate-950">{value}</b><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span></div>;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-0.5 font-black text-slate-950">{value}</dd></div>;
}

function inputClass(error?: string) {
  return cn("min-h-12 w-full rounded-xl border bg-white px-3 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100", error ? "border-rose-400" : "border-slate-300");
}

function stepLabel(step: Step) {
  return step === 1 ? "Quiz basics" : step === 2 ? "Build questions" : "Review and save";
}

function subjectLabel(subject: string) {
  return subjects.find(([value]) => value === subject)?.[1] ?? subject;
}
