"use client";

/* eslint-disable react/no-unescaped-entities -- lesson copy uses natural contractions */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bold, Bot, CheckCircle2, ChevronRight, Download, FileText, FileUp, Flame, Heading2, Italic, Layers3, Lightbulb, Link2, List, ListOrdered, ListTree, LoaderCircle, Plus, Quote, RemoveFormatting, RotateCcw, Save, Send, Sparkles, Star, Trash2, TriangleAlert, Trophy, Underline, Video, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Input, Select, Textarea } from "@/components/design-system/form-controls";
import { EmbeddedVideo } from "@/components/shared/embedded-video";
import { SkulKidButton } from "@/components/shared/skulkid-button";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { generatedCourseSchema } from "@/domains/curriculum-ai/schemas/generated-course";
import type { SupportedCurriculumSubject } from "@/domains/curriculum-ai/schemas/generated-course";
import { materialiseGeneratedCourse } from "@/domains/curriculum-ai/services/materialise-course";
import type { MaterialisedCourse } from "@/domains/curriculum-ai/services/materialise-course";
import { placeLessonAfter, readAdminLessons, writeAdminLesson } from "@/lib/admin/lesson-library";
import type { AdminLessonRecord, AdminLessonStatus } from "@/lib/admin/lesson-library";
import { sampleLessons } from "@/data/sample-lessons";
import { resolveVideoEmbed } from "@/lib/video/embed";

type QuizQuestion = {
  id: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correctOption: number;
  hint: string;
  explanation: string;
};

type ImportedChallenge = { prompt: string; options: string[]; correctOptionIndex: number; hint: string; explanation: string };
type ImportedLesson = {
  unit: string; chapter: string; topic: string; title: string; description: string; curriculumReference: string;
  objectives: string[]; estimatedMinutes: number; difficulty: FormState["difficulty"]; teachingHeading: string; teachingText: string;
  exampleTitle: string; exampleProblem: string; exampleSteps: string[]; exampleAnswer: string;
  trueFalseStatement: string; trueFalseAnswer: boolean; summaryPoints: string[];
};

type FormatAction = "heading" | "bold" | "italic" | "underline" | "bullet" | "numbered" | "quote" | "tip" | "link" | "clear";
type LessonFormat = "text" | "video" | "blended";
const LessonFormatContext = createContext<LessonFormat>("text");
const sectionTones: Record<string, { border: string; header: string; badge: string }> = {
  "1": { border: "border-blue-200", header: "bg-blue-50", badge: "bg-blue-700" },
  "2": { border: "border-emerald-200", header: "bg-emerald-50", badge: "bg-emerald-700" },
  "3": { border: "border-violet-200", header: "bg-violet-50", badge: "bg-violet-700" },
  "4": { border: "border-amber-200", header: "bg-amber-50", badge: "bg-amber-600" },
  "5": { border: "border-rose-200", header: "bg-rose-50", badge: "bg-rose-700" },
  "6": { border: "border-indigo-200", header: "bg-indigo-50", badge: "bg-indigo-700" }
};

const defaultText: Record<FormatAction, string> = {
  heading: "Section heading", bold: "important text", italic: "emphasised text", underline: "underlined text",
  bullet: "List item", numbered: "First step", quote: "Quoted idea", tip: "Helpful reminder",
  link: "Useful resource", clear: "text"
};

function emptyQuestion(): QuizQuestion {
  return { id: crypto.randomUUID(), prompt: "", optionA: "", optionB: "", optionC: "", correctOption: 0, hint: "", explanation: "" };
}

type FormState = {
  lessonFormat: LessonFormat;
  subject: SupportedCurriculumSubject; grade: number; unit: string; chapter: string; topic: string; prerequisiteLessonId: string;
  title: string; description: string; curriculumReference: string; objectives: string[];
  minutes: number; difficulty: "foundation" | "beginner" | "developing" | "proficient" | "challenge";
  heading: string; body: string; exampleTitle: string; exampleProblem: string; exampleSteps: string; exampleAnswer: string;
  videoUrl: string; videoTitle: string; videoCaption: string;
  questions: QuizQuestion[];
  summary: string;
  xp: number; passingScore: number; masteryScore: number; maximumAttempts: number; lessonRedos: number;
};

const initial: FormState = {
  lessonFormat: "text", subject: "mathematics", grade: 4, unit: "", chapter: "", topic: "", prerequisiteLessonId: "", title: "", description: "", curriculumReference: "",
  objectives: ["", ""], minutes: 10, difficulty: "beginner", heading: "Let's learn", body: "", exampleTitle: "See it in action", videoUrl: "", videoTitle: "Watch and learn", videoCaption: "",
  exampleProblem: "", exampleSteps: "", exampleAnswer: "", questions: [{ id: "question-1", prompt: "", optionA: "", optionB: "", optionC: "", correctOption: 0, hint: "", explanation: "" }],
  summary: "", xp: 100, passingScore: 60, masteryScore: 80, maximumAttempts: 2, lessonRedos: 2
};

export function ManualLessonBuilder({ initialAiConfigured = false, initialAiModel = "Not configured" }: { initialAiConfigured?: boolean; initialAiModel?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState<MaterialisedCourse | null>(null);
  const [message, setMessage] = useState("");
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [quizFile, setQuizFile] = useState<File | null>(null);
  const aiConfigured = initialAiConfigured;
  const aiModel = initialAiModel;
  const [importing, setImporting] = useState<"lesson" | "quiz" | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [savedLessonId, setSavedLessonId] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<AdminLessonStatus | null>(null);
  const [libraryLessons, setLibraryLessons] = useState<AdminLessonRecord[]>([]);
  const videoEmbed = form.videoUrl.trim() ? resolveVideoEmbed(form.videoUrl) : null;
  const needsText = form.lessonFormat !== "video";
  const needsVideo = form.lessonFormat !== "text";
  const canBuild = useMemo(() => Boolean(form.unit && form.chapter && form.topic && form.title && form.description && form.objectives.length > 0 && form.objectives.every((objective) => objective.trim()) && (!needsText || form.body && form.exampleProblem && form.exampleAnswer) && (!needsVideo || resolveVideoEmbed(form.videoUrl)) && form.questions.length > 0 && form.questions.every(questionComplete) && form.summary), [form, needsText, needsVideo]);
  const wordCount = form.body.trim() ? form.body.trim().split(/\s+/).length : 0;
  const requiredFields = [form.unit, form.chapter, form.topic, form.title, form.description, form.objectives.every((objective) => objective.trim()) ? "objectives-complete" : "", ...(needsText ? [form.body, form.exampleProblem, form.exampleAnswer] : []), ...(needsVideo ? [videoEmbed ? "video-complete" : ""] : []), form.summary];
  const completedFields = requiredFields.filter((value) => value.trim()).length + (form.questions.every(questionComplete) ? 1 : 0);
  const completion = Math.round((completedFields / (requiredFields.length + 1)) * 100);
  const assessmentCount = form.questions.length;
  const maximumXp = form.xp + assessmentCount * 10 + 20;
  const subjectBadge = form.subject === "mathematics" ? "Mathematics Explorer" : form.subject === "science" ? "Science Explorer" : "English Explorer";
  const publishedPredecessors = useMemo(() => [...libraryLessons.filter((lesson) => lesson.subject === form.subject && lesson.status === "published"), ...sampleLessons.filter((lesson) => subjectFromId(lesson.subjectId) === form.subject).map((lesson) => ({ id: lesson.id, title: lesson.title, grade: gradeFromUnitId(lesson.unitId), unit: lesson.unitId, topic: lesson.topicId }))].filter((lesson, index, lessons) => lessons.findIndex((candidate) => candidate.id === lesson.id) === index), [form.subject, libraryLessons]);

  useEffect(() => setLibraryLessons(readAdminLessons()), []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((current) => ({ ...current, [key]: value })); setResult(null); }
  function updateQuestion(id: string, changes: Partial<QuizQuestion>) { setForm((current) => ({ ...current, questions: current.questions.map((question) => question.id === id ? { ...question, ...changes } : question) })); setResult(null); }
  function addQuestion() { setForm((current) => ({ ...current, questions: [...current.questions, emptyQuestion()] })); setResult(null); }
  function removeQuestion(id: string) { setForm((current) => ({ ...current, questions: current.questions.filter((question) => question.id !== id) })); setResult(null); }
  function updateObjective(index: number, value: string) { setForm((current) => ({ ...current, objectives: current.objectives.map((objective, objectiveIndex) => objectiveIndex === index ? value : objective) })); setResult(null); }
  function addObjective() { setForm((current) => ({ ...current, objectives: [...current.objectives, ""] })); setResult(null); }
  function removeObjective(index: number) { setForm((current) => ({ ...current, objectives: current.objectives.filter((_, objectiveIndex) => objectiveIndex !== index) })); setResult(null); }
  function applyRewardPreset(preset: "supportive" | "balanced" | "challenge") {
    const values = preset === "supportive"
      ? { xp: 80, passingScore: 50, masteryScore: 75, maximumAttempts: 3, lessonRedos: 4 }
      : preset === "challenge"
        ? { xp: 150, passingScore: 70, masteryScore: 90, maximumAttempts: 2, lessonRedos: 1 }
        : { xp: 100, passingScore: 60, masteryScore: 80, maximumAttempts: 2, lessonRedos: 2 };
    setForm((current) => ({ ...current, ...values })); setResult(null);
  }

  async function importFile(mode: "lesson" | "quiz", sourceFile = mode === "lesson" ? lessonFile : quizFile) {
    if (!sourceFile) { setImportMessage(mode === "lesson" ? "Choose a lesson note first." : "Upload a quiz file or a lesson note first."); return; }
    setImporting(mode); setImportMessage("");
    const payload = new FormData();
    payload.set("file", sourceFile); payload.set("mode", mode); payload.set("subject", form.subject); payload.set("grade", String(form.grade));
    try {
      const response = await fetch("/api/admin/lessons/import", { method: "POST", body: payload });
      const result = await response.json() as { data?: ImportedLesson | { questions: ImportedChallenge[] }; error?: string };
      if (!response.ok || !result.data) throw new Error(result.error ?? "The file could not be extracted.");
      if (mode === "lesson") applyImportedLesson(result.data as ImportedLesson);
      else applyImportedQuiz((result.data as { questions: ImportedChallenge[] }).questions);
      setImportMessage(mode === "lesson" ? "Lesson fields filled from the uploaded note. Review and edit everything before saving." : "Quiz questions imported. Check the answers and feedback before saving.");
    } catch (cause: unknown) {
      setImportMessage(cause instanceof Error ? cause.message : "The file could not be extracted.");
    } finally { setImporting(null); }
  }

  function applyImportedLesson(data: ImportedLesson) {
    setForm((current) => ({ ...current, unit: data.unit, chapter: data.chapter, topic: data.topic, title: data.title,
      description: data.description, curriculumReference: data.curriculumReference, objectives: data.objectives.length ? data.objectives : [""],
      minutes: data.estimatedMinutes, difficulty: data.difficulty,
      heading: data.teachingHeading, body: data.teachingText, exampleTitle: data.exampleTitle, exampleProblem: data.exampleProblem,
      exampleSteps: data.exampleSteps.join("\n"), exampleAnswer: data.exampleAnswer, summary: data.summaryPoints.join("\n") }));
    setResult(null);
  }

  function applyImportedQuiz(questions: ImportedChallenge[]) {
    setForm((current) => ({ ...current, questions: questions.map((question) => ({ id: crypto.randomUUID(), prompt: question.prompt,
      optionA: question.options[0] ?? "", optionB: question.options[1] ?? "", optionC: question.options[2] ?? "",
      correctOption: question.correctOptionIndex, hint: question.hint, explanation: question.explanation })) }));
    setResult(null);
  }

  function build() {
    setMessage("");
    if (form.masteryScore < form.passingScore) { setMessage("Mastery score must be at least the passing score."); return null; }
    if (form.passingScore < 0 || form.passingScore > 100 || form.masteryScore > 100) { setMessage("Pass and mastery scores must be between 0 and 100."); return null; }
    if (form.maximumAttempts < 1 || form.maximumAttempts > 5) { setMessage("Attempts per question must be between 1 and 5."); return null; }
    if (form.videoUrl.trim() && !videoEmbed) { setMessage("Enter a valid public YouTube, Vimeo or TikTok video link."); return null; }
    if (form.lessonRedos < 0 || form.lessonRedos > 20) { setMessage("Lesson redos must be between 0 and 20."); return null; }
    const course = generatedCourseSchema.safeParse({
      title: `${subjectLabel(form.subject)}: ${form.unit}`, subject: form.subject,
      sourceSummary: `Manual administrator draft for Basic ${form.grade}, ${form.unit}, chapter ${form.chapter}.`,
      designRationale: "Administrator-authored short mission with instruction, worked practice, assessment and retrieval summary.",
      units: [{ title: form.unit, description: `Basic ${form.grade} unit: ${form.unit}.`, grade: form.grade, topics: [{ title: form.topic, description: `Chapter ${form.chapter}: ${form.topic}.`, lessons: [{
        title: form.title, description: form.description, curriculumReferences: [form.curriculumReference || `B${form.grade}.MANUAL`],
        objectives: form.objectives, estimatedMinutes: form.minutes, difficulty: form.difficulty,
        teachingHeading: needsText ? form.heading : "Watch and learn", teachingText: needsText ? form.body : "Watch the embedded lesson video and focus on the learning objectives.", exampleTitle: needsText ? form.exampleTitle : "Video demonstration", exampleProblem: needsText ? form.exampleProblem : "Use the video demonstration to answer the lesson questions.",
        exampleSteps: needsText ? form.exampleSteps.split("\n").map((step) => step.replace(/^[-\d.)\s]+/, "").trim()).filter(Boolean) : ["Watch the complete video.", "Review the key learning objectives."], exampleAnswer: needsText ? form.exampleAnswer : "Complete the video before attempting the quiz.",
        challenge: toGeneratedChallenge(form.questions[0]),
        trueFalseStatement: "This lesson has been completed.", trueFalseAnswer: true,
        summaryPoints: form.summary.split("\n").map((point) => point.replace(/^[-\s]+/, "").trim()).filter(Boolean)
      }] }] }]
    });
    if (!course.success) { setMessage(course.error.issues[0]?.message ?? "Complete the required fields."); return null; }
    const materialised = materialiseGeneratedCourse(course.data, `manual-${Date.now()}`, { baseXpReward: form.xp, passingScore: form.passingScore, masteryScore: form.masteryScore, maximumAttempts: form.maximumAttempts, maximumLessonRedos: form.lessonRedos, includeTrueFalse: false, includeText: needsText, includeWorkedExample: needsText, video: needsVideo && videoEmbed ? { url: form.videoUrl, title: form.videoTitle || form.title, caption: form.videoCaption } : undefined, additionalChallenges: form.questions.slice(1).map(toGeneratedChallenge) });
    setResult(materialised); setMessage(materialised.issues.some((issue) => issue.severity === "error") ? "The draft needs corrections." : "Draft validated successfully.");
    return materialised;
  }

  function saveLesson(status: AdminLessonStatus) {
    setSavingStatus(status);
    const materialised = build();
    if (!materialised || (status === "published" && materialised.issues.some((issue) => issue.severity === "error"))) { setSavingStatus(null); return; }
    const now = new Date().toISOString();
    const id = savedLessonId ?? crypto.randomUUID();
    const fixture = structuredClone(materialised.fixture);
    fixture.lessons[0].prerequisiteLessonId = form.prerequisiteLessonId || null;
    if (status === "published") fixture.lessonVersions.forEach((version) => { version.status = "published"; version.publishedAt = now; version.updatedAt = now; });
    writeAdminLesson({ id, subject: form.subject, grade: form.grade, unit: form.unit, chapter: form.chapter, topic: form.topic,
      title: form.title, description: form.description, estimatedMinutes: form.minutes, xp: form.xp,
      questionCount: form.questions.length, format: form.lessonFormat, prerequisiteLessonId: form.prerequisiteLessonId || null, gamification: { passingScore: form.passingScore, masteryScore: form.masteryScore,
        maximumAttempts: form.maximumAttempts, lessonRetries: form.lessonRedos, maximumXp, badge: subjectBadge },
      status, createdAt: now, updatedAt: now, fixture });
    const subjectIds = [...libraryLessons.filter((lesson) => lesson.subject === form.subject).map((lesson) => lesson.id), ...publishedPredecessors.map((lesson) => lesson.id), id];
    placeLessonAfter(form.subject, id, form.prerequisiteLessonId || null, subjectIds);
    setSavedLessonId(id);
    window.localStorage.removeItem("skulkid-manual-lesson-draft");
    router.push(`/admin/lessons?subject=${form.subject}`);
  }

  function saveLocally() { window.localStorage.setItem("skulkid-manual-lesson-draft", JSON.stringify(form)); setMessage("Draft saved in this browser."); }
  function restore() { const saved = window.localStorage.getItem("skulkid-manual-lesson-draft"); if (!saved) { setMessage("No browser draft was found."); return; } const restored = JSON.parse(saved) as Partial<FormState> & { objectiveOne?: string; objectiveTwo?: string }; const legacyObjectives = [restored.objectiveOne, restored.objectiveTwo].filter((objective): objective is string => Boolean(objective)); setForm({ ...initial, ...restored, objectives: restored.objectives?.length ? restored.objectives : legacyObjectives.length ? legacyObjectives : [""], questions: restored.questions?.length ? restored.questions : [emptyQuestion()] }); setResult(null); setMessage("Browser draft restored."); }
  function download() { if (!result) return; const url = URL.createObjectURL(new Blob([JSON.stringify(result.fixture, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `${slug(form.title)}-lesson-draft.json`; link.click(); URL.revokeObjectURL(url); }
  function format(action: FormatAction) {
    const area = document.getElementById("lesson-body") as HTMLTextAreaElement | null;
    if (!area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = form.body.slice(start, end) || defaultText[action];
    const lines = selected.split("\n");
    const replacements: Record<FormatAction, string> = {
      heading: lines.map((line) => `## ${line.replace(/^#{2,3}\s+/, "")}`).join("\n"),
      bold: `**${selected}**`, italic: `*${selected}*`, underline: `[u]${selected}[/u]`,
      bullet: lines.map((line) => `- ${line.replace(/^[-*]\s+/, "")}`).join("\n"),
      numbered: lines.map((line, index) => `${index + 1}. ${line.replace(/^\d+[.)]\s+/, "")}`).join("\n"),
      quote: lines.map((line) => `> ${line.replace(/^>\s+/, "")}`).join("\n"),
      tip: `[tip]${selected.replace(/^\[tip\]|\[\/tip\]$/g, "")}[/tip]`,
      link: `[${selected}](https://example.com)`,
      clear: selected
        .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
        .replace(/\*\*|\*|\[u\]|\[\/u\]|^#{2,3}\s+|^[-*>]\s+|^\d+[.)]\s+|\[tip\]|\[\/tip\]/gm, "")
    };
    const replacement = replacements[action];
    update("body", form.body.slice(0, start) + replacement + form.body.slice(end));
    requestAnimationFrame(() => { area.focus(); area.setSelectionRange(start, start + replacement.length); });
  }
  function handleEditorShortcut(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey)) return;
    const action = event.key.toLowerCase() === "b" ? "bold" : event.key.toLowerCase() === "i" ? "italic" : event.key.toLowerCase() === "u" ? "underline" : null;
    if (action) { event.preventDefault(); format(action); }
  }

  return <LessonFormatContext.Provider value={form.lessonFormat}><main data-lesson-format={form.lessonFormat} className="mx-auto w-full max-w-[94rem] [&[data-lesson-format=text]_.border-sky-200]:hidden [&[data-lesson-format=video]_.text-lesson-fields]:hidden [&[data-lesson-format=video]_.ai-text-only]:hidden [&[data-lesson-format=blended]_.ai-text-only]:hidden">
    <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-violet-950 to-violet-800 p-6 text-white shadow-xl sm:p-8 lg:p-10"><div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-fuchsia-400/15 blur-3xl" /><div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">Content Studio</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">Create a pupil-ready lesson</h1><p className="mt-4 max-w-3xl text-base leading-7 text-violet-100 sm:text-lg">Write from scratch or extract an editable starting point from your lesson notes. Review every detail before publishing.</p></div><div className="flex flex-wrap gap-3"><SkulKidButton type="button" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={saveLocally}><Save className="size-4" />Save draft</SkulKidButton><SkulKidButton type="button" variant="ghost" className="text-white hover:bg-white/10" onClick={restore}>Restore draft</SkulKidButton></div></div></header>

    <section id="lesson-format" className="scroll-mt-6 mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Lesson format</p><h2 className="mt-1 text-xl font-black">Choose your content</h2></div><div className="grid gap-2 sm:grid-cols-3 lg:min-w-[38rem]"><LessonFormatButton active={form.lessonFormat === "text"} icon={FileText} title="Text" subtitle="AI available" onClick={() => update("lessonFormat", "text")} /><LessonFormatButton active={form.lessonFormat === "video"} icon={Video} title="Video" subtitle="Hosted link" onClick={() => update("lessonFormat", "video")} /><LessonFormatButton active={form.lessonFormat === "blended"} icon={Layers3} title="Blended" subtitle="Text + video" onClick={() => update("lessonFormat", "blended")} /></div></div></section>

    {form.lessonFormat === "text" ? <SkulKidCard id="ai-extraction" className="ai-text-only scroll-mt-6 mt-4 overflow-hidden border-violet-200 shadow-sm">
      <div className="grid gap-5 border-b border-violet-100 bg-violet-50 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-700 text-white"><Sparkles className="size-5" /></span><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Optional AI assistant</p><h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">Start from a lesson file</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">Upload a PDF, TXT or Markdown file. The assistant fills the lesson form, and you can review or change every field.</p></div></div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-black ${aiConfigured ? "bg-green-300 text-green-950" : "bg-amber-300 text-amber-950"}`}>{aiConfigured ? "AI ready" : "API key required"}</span>
      </div>
      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <FilePicker id="lesson-note-file" file={lessonFile} label="Lesson note" help="PDF, TXT or Markdown · maximum 10 MB" onChange={setLessonFile} />
        <SkulKidButton type="button" size="lg" disabled={!lessonFile || importing !== null || aiConfigured === false} onClick={() => importFile("lesson")}>
          {importing === "lesson" ? <><LoaderCircle className="size-5 animate-spin" />Extracting lesson…</> : <><FileUp className="size-5" />Extract and fill lesson</>}
        </SkulKidButton>
      </div>
      {aiConfigured === false ? <p className="mx-5 mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 sm:mx-6">Add <code>OPENAI_API_KEY</code> to the server environment and restart SkulKid. Manual authoring remains available.</p> : null}
      {importMessage ? <p role="status" className="mx-5 mb-5 rounded-xl bg-violet-50 p-3 text-sm text-violet-950 sm:mx-6">{importMessage}</p> : null}
      <p className="border-t border-slate-200 px-5 py-3 text-xs text-muted sm:px-6">Model: {aiModel || "checking…"}. Uploaded files are processed only when you click Extract.</p>
    </SkulKidCard> : null}

    <section aria-label="Lesson completion" className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-black text-slate-950">Lesson completion</p><p className="mt-1 text-xs text-muted">Complete the six sections, then validate the draft.</p></div><span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-black text-violet-800">{completion}% complete</span></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-[width]" style={{ width: `${completion}%` }} /></div>
      <ol className="mt-3 hidden grid-cols-6 gap-2 text-center text-[11px] font-bold text-muted md:grid"><li>Placement</li><li>Overview</li><li>Teaching</li><li>Example</li><li>Assessment</li><li>Rewards</li></ol>
    </section>

    <section id="learning-path" className="scroll-mt-6 mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5"><div className="flex items-start gap-3"><Link2 className="mt-0.5 size-5 shrink-0 text-blue-700" /><div className="flex-1"><h2 className="font-black text-blue-950">Link this lesson to the learning path</h2><p className="mt-1 text-sm leading-6 text-blue-900">If this is the next chapter or lesson, choose the published lesson pupils should complete first.</p><label className="mt-4 grid gap-2 text-sm font-bold text-blue-950">This lesson follows<Select className="bg-white" value={form.prerequisiteLessonId} onChange={(event) => update("prerequisiteLessonId", event.target.value)}><option value="">No previous lesson - place at the end</option>{publishedPredecessors.map((lesson) => <option value={lesson.id} key={lesson.id}>Basic {lesson.grade}: {lesson.title}</option>)}</Select></label><p className="mt-2 text-xs text-blue-800">Only published lessons from {subjectLabel(form.subject)} are shown.</p></div></div></section>

    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.65fr)]">
      <div className="space-y-6">
        <Section number="1" title="Course placement" description="Choose exactly where this lesson belongs."><div className="grid gap-4 sm:grid-cols-2"><Field label="Course / subject"><Select value={form.subject} onChange={(e) => update("subject", e.target.value as FormState["subject"])}><option value="mathematics">Mathematics</option><option value="english-language">English Language</option><option value="science">Science</option></Select></Field><Field label="Grade"><Select value={form.grade} onChange={(e) => update("grade", Number(e.target.value))}><option value={4}>Basic 4</option><option value={5}>Basic 5</option><option value={6}>Basic 6</option></Select></Field><Field label="Unit"><Input value={form.unit} onChange={(e) => update("unit", e.target.value)} placeholder="e.g. Fractions" required /></Field><Field label="Chapter"><Input value={form.chapter} onChange={(e) => update("chapter", e.target.value)} placeholder="e.g. Chapter 2" required /></Field><Field label="Topic"><Input value={form.topic} onChange={(e) => update("topic", e.target.value)} placeholder="e.g. Comparing fractions" required /></Field><Field label="Curriculum reference"><Input value={form.curriculumReference} onChange={(e) => update("curriculumReference", e.target.value)} placeholder="e.g. B4.1.2.1" /></Field></div></Section>

        <Section number="2" title="Lesson foundations" description="State what pupils will learn and why."><div className="grid gap-5"><Field label="Lesson title"><Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="A short, motivating title" required /></Field><Field label="Short description"><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What will happen in this lesson?" required /></Field>
          <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><legend className="font-black text-slate-900">Learning objectives</legend><p className="mt-1 text-xs leading-5 text-muted">Add every measurable outcome pupils should achieve. Begin with an action verb such as identify, explain, compare or create.</p></div><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-800">{form.objectives.length} {form.objectives.length === 1 ? "objective" : "objectives"}</span></div><div className="mt-4 grid gap-3">{form.objectives.map((objective, index) => <div className="grid grid-cols-[2.25rem_1fr_auto] items-start gap-3" key={index}><span className="mt-1 grid size-9 place-items-center rounded-xl bg-white text-sm font-black text-violet-700 shadow-sm">{index + 1}</span><Textarea className="min-h-20 bg-white" aria-label={`Learning objective ${index + 1}`} value={objective} onChange={(event) => updateObjective(index, event.target.value)} placeholder="Pupils will be able to…" required /><SkulKidButton type="button" size="icon" variant="ghost" disabled={form.objectives.length === 1} onClick={() => removeObjective(index)} aria-label={`Remove learning objective ${index + 1}`}><Trash2 className="size-4" /></SkulKidButton></div>)}</div><SkulKidButton type="button" variant="outline" className="mt-4 w-full border-dashed" onClick={addObjective}><Plus className="size-4" />Add another learning objective</SkulKidButton></fieldset>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Estimated minutes"><Input type="number" min={5} max={20} value={form.minutes} onChange={(e) => update("minutes", Number(e.target.value))} /></Field><Field label="Difficulty"><Select value={form.difficulty} onChange={(e) => update("difficulty", e.target.value as FormState["difficulty"])}><option value="foundation">Foundation</option><option value="beginner">Beginner</option><option value="developing">Developing</option><option value="proficient">Proficient</option><option value="challenge">Challenge</option></Select></Field></div></div></Section>

        <Section number="3" title="Teaching material" description="Write the explanation pupils will read."><Field label="Section heading"><Input value={form.heading} onChange={(e) => update("heading", e.target.value)} /></Field><div className="mt-4"><label className="text-sm font-bold" htmlFor="lesson-body">Lesson text</label><div className="mt-2 rounded-t-xl border border-b-0 border-slate-300 bg-slate-50 p-2">
  <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Lesson text formatting">
    <Tool label="Heading" icon={Heading2} onClick={() => format("heading")} />
    <span className="mx-1 h-10 w-px bg-slate-300" aria-hidden="true" />
    <Tool label="Bold" shortcut="Ctrl+B" icon={Bold} onClick={() => format("bold")} />
    <Tool label="Italic" shortcut="Ctrl+I" icon={Italic} onClick={() => format("italic")} />
    <Tool label="Underline" shortcut="Ctrl+U" icon={Underline} onClick={() => format("underline")} />
    <span className="mx-1 h-10 w-px bg-slate-300" aria-hidden="true" />
    <Tool label="Bullet list" icon={List} onClick={() => format("bullet")} />
    <Tool label="Numbered list" icon={ListOrdered} onClick={() => format("numbered")} />
    <Tool label="Quote" icon={Quote} onClick={() => format("quote")} />
    <Tool label="Teaching tip" icon={Lightbulb} onClick={() => format("tip")} />
    <Tool label="Link" icon={Link2} onClick={() => format("link")} />
    <span className="mx-1 h-10 w-px bg-slate-300" aria-hidden="true" />
    <Tool label="Clear formatting" icon={RemoveFormatting} onClick={() => format("clear")} />
  </div>
</div>
<Textarea id="lesson-body" className="min-h-72 resize-y rounded-t-none font-mono text-[15px] leading-7" value={form.body} onChange={(e) => update("body", e.target.value)} onKeyDown={handleEditorShortcut} placeholder={"Write the lesson explanation here.\n\nUse headings to organise ideas, lists for steps and tips for important reminders."} required />
<div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted"><span>{wordCount} words · {form.body.length} characters</span><span>Select text before applying a format. Keyboard shortcuts also work in the editor.</span></div></div></Section>

        <Section number="4" title="Worked example" description="Show pupils how to apply the skill before they practise."><div className="grid gap-4"><Field label="Example title"><Input value={form.exampleTitle} onChange={(e) => update("exampleTitle", e.target.value)} /></Field><Field label="Problem or situation"><Textarea value={form.exampleProblem} onChange={(e) => update("exampleProblem", e.target.value)} required /></Field><Field label="Steps - one per line"><Textarea value={form.exampleSteps} onChange={(e) => update("exampleSteps", e.target.value)} placeholder={"Notice the important information\nApply the rule\nCheck the result"} required /></Field><Field label="Final answer"><Input value={form.exampleAnswer} onChange={(e) => update("exampleAnswer", e.target.value)} required /></Field></div></Section>

        <section id="video-content" className="scroll-mt-6 overflow-hidden rounded-[1.5rem] border border-sky-200 bg-white shadow-sm"><div className="flex gap-4 border-b border-sky-200 bg-sky-50 px-5 py-4 sm:px-6"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-700 text-white"><Video className="size-5" /></span><div><h2 className="text-xl font-black text-slate-950">Add a video lesson</h2><p className="mt-1 text-sm leading-6 text-muted">Embed a hosted video inside the pupil lesson with the provider's full playback controls.</p></div></div><div className="grid gap-5 p-5 sm:p-6"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><b>How to add a video:</b> upload your video to YouTube or Vimeo first, copy its public link, then paste the link below. TikTok video links can also be used when the creator allows embedding. SkulKid stores the link only; it does not upload or copy the video.</div><div className="grid gap-4 sm:grid-cols-2"><Field label="Video link"><Input type="url" value={form.videoUrl} onChange={(event) => update("videoUrl", event.target.value)} placeholder="https://www.youtube.com/watch?v=…" aria-invalid={Boolean(form.videoUrl && !videoEmbed)} /><span className={`font-normal ${form.videoUrl && !videoEmbed ? "text-red-700" : "text-muted"}`}>{form.videoUrl ? videoEmbed ? `${videoEmbed.provider[0].toUpperCase() + videoEmbed.provider.slice(1)} link recognised` : "Use a valid YouTube, Vimeo or TikTok video link." : "Leave empty for a lesson without video."}</span></Field><Field label="Video title"><Input value={form.videoTitle} onChange={(event) => update("videoTitle", event.target.value)} placeholder="What pupils will watch" /></Field></div><Field label="Caption or viewing instruction (optional)"><Textarea className="min-h-20" value={form.videoCaption} onChange={(event) => update("videoCaption", event.target.value)} placeholder="Tell pupils what to notice while watching." /></Field>{videoEmbed ? <div><p className="mb-2 text-sm font-black">Embedded preview</p><EmbeddedVideo url={form.videoUrl} title={form.videoTitle || form.title || "Lesson video"} caption={form.videoCaption} /></div> : null}</div></section>

        <Section number="5" title="Assessment and feedback" description="Create as many questions as the lesson needs, then set the correct answers and feedback.">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 sm:p-5">
              <div className="flex items-start gap-3"><Bot className="mt-0.5 size-5 shrink-0 text-violet-700" /><div><h3 className="font-black">Choose how to create the quiz</h3><p className="mt-1 text-sm text-text-secondary">Keep editing manually below, generate from the uploaded lesson note, or import a quiz you already prepared.</p></div></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <button type="button" disabled={!lessonFile || importing !== null || aiConfigured === false} onClick={() => importFile("quiz", lessonFile)} className="flex min-h-20 items-center gap-3 rounded-xl border border-violet-200 bg-white p-4 text-left font-bold disabled:cursor-not-allowed disabled:opacity-50"><Sparkles className="size-5 shrink-0 text-violet-700" /><span><span className="block">Create from lesson note</span><span className="mt-1 block text-xs font-normal text-muted">Uses {lessonFile?.name ?? "the lesson file above"}</span></span></button>
                <div className="rounded-xl border border-violet-200 bg-white p-3"><FilePicker compact id="quiz-file" file={quizFile} label="Upload an existing quiz" help="PDF, TXT or Markdown" onChange={setQuizFile} /><SkulKidButton type="button" variant="outline" className="mt-3 w-full" disabled={!quizFile || importing !== null || aiConfigured === false} onClick={() => importFile("quiz")}>
                  {importing === "quiz" ? <><LoaderCircle className="size-4 animate-spin" />Importing quiz…</> : <><FileText className="size-4" />Extract quiz questions</>}
                </SkulKidButton></div>
              </div>
              <p className="mt-3 text-xs text-muted">Importing replaces the current question list. You can add, remove or edit questions immediately afterwards.</p>
            </div>
            {form.questions.map((question, questionIndex) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={question.id}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black">Question {questionIndex + 1}</h3>
                  <SkulKidButton type="button" size="icon" variant="ghost" disabled={form.questions.length === 1} onClick={() => removeQuestion(question.id)} aria-label={`Remove question ${questionIndex + 1}`}><Trash2 className="size-4" /></SkulKidButton>
                </div>
                <div className="mt-4 grid gap-4">
                  <Field label="Question prompt"><Textarea value={question.prompt} onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })} required /></Field>
                  {(["optionA", "optionB", "optionC"] as const).map((key, optionIndex) => (
                    <label key={key} className={`grid grid-cols-[2rem_1fr] items-center gap-3 rounded-xl border p-2 ${question.correctOption === optionIndex ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"}`}>
                      <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-sm font-black">{String.fromCharCode(65 + optionIndex)}</span>
                      <Input aria-label={`Question ${questionIndex + 1}, option ${String.fromCharCode(65 + optionIndex)}`} value={question[key]} onChange={(event) => updateQuestion(question.id, { [key]: event.target.value })} placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} required />
                    </label>
                  ))}
                  <div className="grid gap-4 sm:grid-cols-2"><Field label="Hint"><Textarea value={question.hint} onChange={(event) => updateQuestion(question.id, { hint: event.target.value })} required /></Field><Field label="Explanation"><Textarea value={question.explanation} onChange={(event) => updateQuestion(question.id, { explanation: event.target.value })} required /></Field></div>
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <Field label="Set the correct answer">
                      <Select className="border-green-300 bg-white" value={question.correctOption} onChange={(event) => updateQuestion(question.id, { correctOption: Number(event.target.value) })}>
                        <option value={0}>Option A - {question.optionA || "not entered"}</option>
                        <option value={1}>Option B - {question.optionB || "not entered"}</option>
                        <option value={2}>Option C - {question.optionC || "not entered"}</option>
                      </Select>
                    </Field>
                    <p className="mt-2 text-xs text-green-900">This answer will be used when scoring the question.</p>
                  </div>
                </div>
              </div>
            ))}
            <SkulKidButton type="button" variant="outline" className="w-full border-dashed" onClick={addQuestion}><Plus className="size-5" />Add another question</SkulKidButton>
            <Field label="Summary points - one per line"><Textarea value={form.summary} onChange={(e) => update("summary", e.target.value)} required /></Field>
          </div>
        </Section>

        <Section number="6" title="Rewards and mastery" description="Design a motivating reward journey while keeping assessment fair and supportive.">
          <div className="grid gap-6">
            <div><p className="text-sm font-black text-slate-900">Choose a starting preset</p><p className="mt-1 text-xs text-muted">Presets fill the reward and retry settings. You can adjust every value afterwards.</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><RewardPreset title="Supportive" description="More retries and a gentler pass mark" icon={Lightbulb} tone="blue" onClick={() => applyRewardPreset("supportive")} /><RewardPreset title="Balanced" description="Recommended for most lessons" icon={Star} tone="violet" onClick={() => applyRewardPreset("balanced")} /><RewardPreset title="Challenge" description="Higher rewards and tougher mastery" icon={Trophy} tone="amber" onClick={() => applyRewardPreset("challenge")} /></div></div>

            <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-800"><Zap className="size-5" /></span><div><h3 className="font-black">Scoring rules</h3><p className="text-xs text-muted">Set the core rewards and success thresholds.</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><Field label="Lesson XP"><Input type="number" min={0} max={500} value={form.xp} onChange={(e) => update("xp", Number(e.target.value))} /><span className="font-normal text-muted">Awarded for completing the mission.</span></Field><Field label="Pass mark"><div className="relative"><Input className="pr-10" type="number" min={0} max={100} value={form.passingScore} onChange={(e) => update("passingScore", Number(e.target.value))} /><span className="absolute right-4 top-3 text-sm font-bold text-muted">%</span></div><span className="font-normal text-muted">Unlocks one star and completion.</span></Field><Field label="Mastery mark"><div className="relative"><Input className="pr-10" type="number" min={0} max={100} value={form.masteryScore} onChange={(e) => update("masteryScore", Number(e.target.value))} /><span className="absolute right-4 top-3 text-sm font-bold text-muted">%</span></div><span className="font-normal text-muted">Unlocks two stars; 100% earns three.</span></Field></div></div>

              <div className="rounded-2xl bg-gradient-to-br from-violet-700 to-fuchsia-700 p-5 text-white"><p className="text-xs font-black uppercase tracking-wider text-violet-100">Pupil reward preview</p><div className="mt-4 flex items-end justify-between gap-4"><div><p className="text-4xl font-black">Up to {maximumXp}</p><p className="mt-1 text-sm text-violet-100">XP for a perfect first attempt</p></div><div className="flex gap-1" aria-label="Three stars available"><Star className="size-6 fill-amber-300 text-amber-300" /><Star className="size-6 fill-amber-300 text-amber-300" /><Star className="size-6 fill-amber-300 text-amber-300" /></div></div><div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs"><RewardFact value={`${form.xp}`} label="Lesson XP" /><RewardFact value={`${assessmentCount * 10}`} label="Quiz XP" /><RewardFact value="20" label="Perfect bonus" /></div><div className="mt-4 flex items-center gap-3 rounded-xl bg-white/10 p-3"><Trophy className="size-5 text-amber-300" /><div><p className="text-xs text-violet-100">Subject badge progress</p><p className="font-black">{subjectBadge}</p></div></div></div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-amber-200 text-amber-900"><RotateCcw className="size-5" /></span><div><h3 className="font-black text-amber-950">Retry and recovery rules</h3><p className="text-xs text-amber-900">Give pupils another chance without making progress feel punishing.</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Attempts for each question"><Input type="number" min={1} max={5} value={form.maximumAttempts} onChange={(e) => update("maximumAttempts", Number(e.target.value))} /><span className="font-normal text-muted">A retry earns 5 XP instead of 10 XP.</span></Field><Field label="Lesson retries after an unsuccessful attempt"><Input type="number" min={0} max={20} value={form.lessonRedos} onChange={(e) => update("lessonRedos", Number(e.target.value))} /><span className="font-normal text-muted">Set to 0 to disable full lesson retries.</span></Field></div><div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-white/70 p-3 text-xs leading-5 text-amber-950"><Flame className="mt-0.5 size-4 shrink-0" /><p>Hints reduce the answer reward by 2 XP. Improving a previous score earns a 15 XP bonus, encouraging pupils to try again.</p></div></div>
          </div>
        </Section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start"><LessonSectionNav format={form.lessonFormat} />
        <SkulKidCard id="finish-lesson" className="scroll-mt-6 overflow-hidden"><div className="border-b border-slate-200 bg-slate-50 px-6 py-4"><p className="text-xs font-black uppercase tracking-wider text-violet-700">Finish lesson</p><h2 className="mt-1 text-xl font-black">Review and save</h2><p className="mt-1 text-sm leading-6 text-muted">Drafts remain private. Published lessons are marked ready for pupils.</p></div><div className="p-6"><SkulKidButton type="button" variant="outline" className="w-full" disabled={!canBuild} onClick={build}><CheckCircle2 className="size-5" />Check lesson</SkulKidButton>{message ? <div role="status" className={`mt-4 flex gap-2 rounded-xl p-3 text-sm ${result && !result.issues.some((issue) => issue.severity === "error") ? "bg-green-50 text-green-900" : "bg-amber-50 text-amber-950"}`}>{result && !result.issues.some((issue) => issue.severity === "error") ? <CheckCircle2 className="size-5 shrink-0" /> : <TriangleAlert className="size-5 shrink-0" />}<span>{message}</span></div> : null}<div className="mt-5 grid gap-3"><SkulKidButton type="button" size="lg" variant="outline" disabled={!canBuild || savingStatus !== null} onClick={() => saveLesson("draft")}><Save className="size-5" />{savingStatus === "draft" ? "Saving…" : "Save as draft"}</SkulKidButton><SkulKidButton type="button" size="lg" variant="success" disabled={!canBuild || savingStatus !== null} onClick={() => saveLesson("published")}><Send className="size-5" />{savingStatus === "published" ? "Publishing…" : "Publish lesson"}</SkulKidButton></div>{result ? <><div className="mt-4 text-sm text-text-secondary"><p><b>{result.fixture.lessonVersions[0].blocks.length}</b> lesson blocks</p><p className="mt-1"><b>{result.issues.length}</b> validation notices</p></div><SkulKidButton type="button" variant="ghost" className="mt-3 w-full" onClick={download}><Download className="size-4" />Download JSON copy</SkulKidButton></> : null}</div></SkulKidCard>
      </aside>
    </div>
  </main></LessonFormatContext.Provider>;
}

function Section({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) { const lessonFormat = useContext(LessonFormatContext); const textOnly = title === "Teaching material" || title === "Worked example"; const tone = sectionTones[number] ?? sectionTones["1"]; if (textOnly && lessonFormat === "video") return null; return <section id={sectionId(title)} className={`scroll-mt-6 overflow-hidden rounded-[1.5rem] border-2 bg-white shadow-sm ${tone.border} ${textOnly ? "text-lesson-fields" : ""}`}><div className={`flex gap-4 border-b px-5 py-4 sm:px-6 ${tone.border} ${tone.header}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl text-sm font-black text-white shadow-sm ${tone.badge}`}>{number.padStart(2, "0")}</span><div><h2 className="text-xl font-black text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div></div><div className="p-5 sm:p-6">{children}</div></section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-bold text-slate-800">{label}{children}</label>; }
function LessonSectionNav({ format }: { format: LessonFormat }) {
  const items = [
    { id: "lesson-format", label: "Lesson format" },
    ...(format === "text" ? [{ id: "ai-extraction", label: "AI text extraction" }] : []),
    { id: "learning-path", label: "Learning path" },
    { id: "course-placement", label: "Course placement" },
    { id: "learning-objectives", label: "Learning objectives" },
    ...(format !== "video" ? [{ id: "teaching-material", label: "Teaching material" }, { id: "worked-example", label: "Worked example" }] : []),
    ...(format !== "text" ? [{ id: "video-content", label: "Video content" }] : []),
    { id: "assessment", label: "Assessment" },
    { id: "rewards-mastery", label: "Rewards and mastery" },
    { id: "finish-lesson", label: "Review and save" }
  ];
  return <nav aria-label="Create lesson sections" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-200 bg-slate-950 px-5 py-4 text-white"><ListTree className="size-5" /><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">On this page</p><h2 className="font-black">Lesson sections</h2></div></div><ol className="grid gap-1 p-3">{items.map((item, index) => <li key={item.id}><a href={`#${item.id}`} className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-[11px] font-black group-hover:bg-violet-100">{String(index + 1).padStart(2, "0")}</span><span className="flex-1">{item.label}</span><ChevronRight className="size-4 text-slate-300 group-hover:text-violet-600" /></a></li>)}</ol><p className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs leading-5 text-muted">Showing the steps required for a <b>{format === "text" ? "text" : format === "video" ? "video" : "blended"}</b> lesson.</p></nav>;
}
function LessonFormatButton({ active, icon: Icon, title, subtitle, onClick }: { active: boolean; icon: LucideIcon; title: string; subtitle: string; onClick: () => void }) { return <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-16 items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${active ? "border-violet-600 bg-violet-50 shadow-sm" : "border-slate-200 bg-white hover:border-violet-300"}`}><span className={`grid size-9 shrink-0 place-items-center rounded-lg ${active ? "bg-violet-700 text-white" : "bg-slate-100 text-slate-600"}`}><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block font-black text-slate-950">{title}</span><span className="block text-[11px] text-muted">{subtitle}</span></span>{active ? <CheckCircle2 className="size-4 shrink-0 text-violet-700" /> : null}</button>; }
function RewardPreset({ title, description, icon: Icon, tone, onClick }: { title: string; description: string; icon: LucideIcon; tone: "blue" | "violet" | "amber"; onClick: () => void }) { const colours = { blue: "bg-blue-100 text-blue-800", violet: "bg-violet-100 text-violet-800", amber: "bg-amber-100 text-amber-900" }; return <button type="button" onClick={onClick} className="group flex min-h-20 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${colours[tone]}`}><Icon className="size-5" /></span><span><span className="block font-black">{title}</span><span className="mt-0.5 block text-xs leading-5 text-muted">{description}</span></span></button>; }
function RewardFact({ value, label }: { value: string; label: string }) { return <div className="rounded-xl bg-white/10 p-2"><b className="block text-base">{value}</b><span className="text-violet-100">{label}</span></div>; }
function FilePicker({ id, file, label, help, onChange, compact = false }: { id: string; file: File | null; label: string; help: string; onChange: (file: File | null) => void; compact?: boolean }) {
  return <div><span className="text-sm font-bold">{label}</span><label htmlFor={id} className={`mt-2 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 hover:border-violet-400 hover:bg-violet-50 ${compact ? "min-h-16" : "min-h-20"}`}><FileUp className="size-5 shrink-0 text-violet-700" /><span className="min-w-0"><span className="block truncate text-sm font-bold">{file?.name ?? "Choose a file"}</span><span className="mt-0.5 block text-xs text-muted">{help}</span></span></label><input id={id} type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" className="sr-only" onChange={(event) => onChange(event.target.files?.[0] ?? null)} /></div>;
}
function Tool({ label, shortcut, icon: Icon, onClick }: { label: string; shortcut?: string; icon: LucideIcon; onClick: () => void }) { const title = shortcut ? `${label} (${shortcut})` : label; return <button type="button" onClick={onClick} title={title} aria-label={title} className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"><Icon className="size-4" aria-hidden="true" /></button>; }
function questionComplete(question: QuizQuestion) { return Boolean(question.prompt && question.optionA && question.optionB && question.optionC && question.hint && question.explanation); }
function toGeneratedChallenge(question: QuizQuestion) { return { prompt: question.prompt, options: [question.optionA, question.optionB, question.optionC] as [string, string, string], correctOptionIndex: question.correctOption, hint: question.hint, explanation: question.explanation }; }
function subjectLabel(subject: SupportedCurriculumSubject) { return subject === "english-language" ? "English Language" : subject[0].toUpperCase() + subject.slice(1); }
function subjectFromId(subjectId: string): SupportedCurriculumSubject { return subjectId.includes("english") ? "english-language" : subjectId.includes("science") ? "science" : "mathematics"; }
function gradeFromUnitId(unitId: string) { return Number(unitId.match(/basic-(\d)/)?.[1] ?? 4); }
function sectionId(title: string) { const ids: Record<string, string> = { "Course placement": "course-placement", "Lesson foundations": "learning-objectives", "Teaching material": "teaching-material", "Worked example": "worked-example", "Assessment and feedback": "assessment", "Rewards and mastery": "rewards-mastery" }; return ids[title] ?? title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, ""); }
function slug(value: string) { return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "") || "lesson"; }




