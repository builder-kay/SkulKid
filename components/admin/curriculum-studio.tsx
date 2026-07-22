"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CheckCircle2, Download, FileUp, FlaskConical, LoaderCircle, Sparkles, TriangleAlert } from "lucide-react";
import { SkulKidButton } from "@/components/shared/skulkid-button";
import { SkulKidCard } from "@/components/shared/skulkid-card";

type Subject = "mathematics" | "english-language" | "science";
type DraftResponse = {
  course: { title: string; subject: Subject; sourceSummary: string; designRationale: string; units: Array<{ title: string; grade: number; topics: Array<{ title: string; lessons: Array<{ title: string; description: string; curriculumReferences: string[]; objectives: string[]; estimatedMinutes: number }> }> }> };
  fixture: unknown;
  validation: { valid: boolean; issues: Array<{ severity: "error" | "warning"; message: string }> };
  provenance: { model: string; sourceChecksum: string; sourceFileName: string; responseId: string };
};

const subjects: Array<{ value: Subject; label: string; description: string }> = [
  { value: "mathematics", label: "Mathematics", description: "Reasoning, worked examples and misconception-aware practice" },
  { value: "english-language", label: "English Language", description: "Listening, reading, grammar, writing and literature missions" },
  { value: "science", label: "Science", description: "Observation, evidence, explanation and safe investigations" }
];

export function CurriculumStudio() {
  const [subject, setSubject] = useState<Subject>("mathematics");
  const [grades, setGrades] = useState([4, 5, 6]);
  const [file, setFile] = useState<File | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<DraftResponse | null>(null);

  useEffect(() => {
    fetch("/api/admin/curriculum-studio/generate")
      .then((response) => response.json())
      .then((data: { configured: boolean; model: string }) => { setConfigured(data.configured); setModel(data.model); })
      .catch(() => setConfigured(false));
  }, []);

  const lessonCount = useMemo(() => draft?.course.units.reduce((total, unit) => total + unit.topics.reduce((topicTotal, topic) => topicTotal + topic.lessons.length, 0), 0) ?? 0, [draft]);

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || grades.length === 0) return;
    setLoading(true); setError(""); setDraft(null);
    const form = new FormData();
    form.set("file", file); form.set("subject", subject); form.set("grades", grades.join(","));
    try {
      const response = await fetch("/api/admin/curriculum-studio/generate", { method: "POST", body: form });
      const data = await response.json() as DraftResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Generation failed.");
      setDraft(data);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Generation failed.");
    } finally { setLoading(false); }
  }

  function downloadDraft() {
    if (!draft) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft.fixture, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `${draft.course.subject}-skulkid-draft.json`; link.click(); URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto w-full max-w-6xl">
      <header className="rounded-[2rem] border border-violet-100 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-800"><Sparkles aria-hidden="true" /></div>
          <div><p className="text-sm font-bold uppercase tracking-wider text-violet-700">Admin authoring</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">Curriculum Studio</h1><p className="mt-3 max-w-3xl text-lg leading-8 text-text-secondary">Turn an approved curriculum into short, validated SkulKid missions. AI creates drafts; an educator reviews and approves them.</p></div>
        </div>
      </header>

      {configured === false ? <div role="alert" className="mt-6 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="font-bold">OpenAI is not configured</p><p className="mt-1">Add <code>OPENAI_API_KEY</code> to the server environment and restart SkulKid. The key must never be placed in browser code.</p></div></div> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[24rem_1fr]">
        <SkulKidCard className="p-5 sm:p-6">
          <form onSubmit={generate} className="space-y-6">
            <fieldset><legend className="font-bold">1. Choose a subject</legend><div className="mt-3 grid gap-3">{subjects.map((item) => <label key={item.value} className={`cursor-pointer rounded-2xl border p-4 ${subject === item.value ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white"}`}><span className="flex items-center gap-3"><input type="radio" name="subject" value={item.value} checked={subject === item.value} onChange={() => setSubject(item.value)} /><span><span className="block font-bold">{item.label}</span><span className="mt-1 block text-sm text-text-secondary">{item.description}</span></span></span></label>)}</div></fieldset>
            <fieldset><legend className="font-bold">2. Select grades</legend><div className="mt-3 flex gap-3">{[4, 5, 6].map((grade) => <label key={grade} className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"><input type="checkbox" checked={grades.includes(grade)} onChange={() => setGrades((current) => current.includes(grade) ? current.filter((value) => value !== grade) : [...current, grade].sort())} /> B{grade}</label>)}</div></fieldset>
            <div><label htmlFor="curriculum-file" className="font-bold">3. Upload curriculum</label><label htmlFor="curriculum-file" className="mt-3 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center"><FileUp className="size-7 text-violet-700" aria-hidden="true" /><span className="mt-2 font-bold">{file?.name ?? "Choose PDF, TXT or Markdown"}</span><span className="mt-1 text-sm text-muted">Maximum 10 MB</span></label><input id="curriculum-file" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></div>
            <SkulKidButton type="submit" size="lg" className="w-full" disabled={!file || grades.length === 0 || loading || configured === false}>{loading ? <><LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> Creating course…</> : <><Sparkles className="size-5" aria-hidden="true" /> Generate draft</>}</SkulKidButton>
            <p className="text-center text-xs text-muted">Model: {model || "checking…"}. Nothing is published automatically.</p>
          </form>
        </SkulKidCard>

        <section aria-live="polite">
          {error ? <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950"><p className="font-bold">Draft generation stopped</p><p className="mt-2">{error}</p></div> : null}
          {!draft && !error ? <SkulKidCard className="grid min-h-96 place-items-center p-8 text-center"><div><FlaskConical className="mx-auto size-12 text-violet-400" aria-hidden="true" /><h2 className="mt-4 text-2xl font-bold">Your course draft will appear here</h2><p className="mx-auto mt-2 max-w-lg leading-7 text-text-secondary">The Studio extracts the curriculum, designs a progression, creates activities and checks every lesson against SkulKid’s publishing rules.</p></div></SkulKidCard> : null}
          {draft ? <div className="space-y-5"><SkulKidCard className="p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${draft.validation.valid ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}>{draft.validation.valid ? <CheckCircle2 className="size-4" /> : <TriangleAlert className="size-4" />}{draft.validation.valid ? "Validation passed" : "Needs corrections"}</span><h2 className="mt-3 text-2xl font-black">{draft.course.title}</h2><p className="mt-2 text-text-secondary">{draft.course.sourceSummary}</p></div><SkulKidButton variant="outline" onClick={downloadDraft}><Download className="size-4" /> Download draft</SkulKidButton></div><div className="mt-5 grid grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-slate-50 p-3"><b className="block text-xl">{draft.course.units.length}</b><span className="text-sm text-muted">Units</span></div><div className="rounded-xl bg-slate-50 p-3"><b className="block text-xl">{lessonCount}</b><span className="text-sm text-muted">Lessons</span></div><div className="rounded-xl bg-slate-50 p-3"><b className="block text-xl">{draft.validation.issues.length}</b><span className="text-sm text-muted">Issues</span></div></div></SkulKidCard>
          {draft.course.units.map((unit) => <SkulKidCard key={`${unit.grade}-${unit.title}`} className="p-5"><div className="flex items-center gap-3"><BookOpenCheck className="size-5 text-violet-700" aria-hidden="true" /><h3 className="text-xl font-bold">Basic {unit.grade}: {unit.title}</h3></div><div className="mt-4 space-y-4">{unit.topics.map((topic) => <div key={topic.title}><p className="font-bold text-text-secondary">{topic.title}</p><ol className="mt-2 space-y-2">{topic.lessons.map((lesson) => <li key={lesson.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex justify-between gap-3"><span className="font-bold">{lesson.title}</span><span className="shrink-0 text-sm text-muted">{lesson.estimatedMinutes} min</span></div><p className="mt-1 text-sm text-text-secondary">{lesson.description}</p><p className="mt-2 text-xs font-bold text-violet-700">{lesson.curriculumReferences.join(" · ")}</p></li>)}</ol></div>)}</div></SkulKidCard>)}</div> : null}
        </section>
      </div>
    </main>
  );
}
