"use client";

/* eslint-disable @next/next/no-img-element -- teachers may use image hosts that are not known at build time */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Bold, Bot, CheckCircle2, ChevronRight, Download, FileImage, FileText, FileUp, Flame, Heading2, Italic, Lightbulb, Link2, List, ListOrdered, ListTree, LoaderCircle, Plus, Quote, RemoveFormatting, RotateCcw, Save, Send, Sparkles, Star, Trash2, TriangleAlert, Trophy, Underline, Video, Zap } from "lucide-react";
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
import { deleteAdminSetting, readAdminSetting, writeAdminSetting } from "@/lib/admin/settings";
import type { AdminLessonRecord, AdminLessonStatus } from "@/lib/admin/lesson-library";
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
type ExampleField = "exampleProblem" | "exampleSteps" | "exampleAnswer";
const exampleFieldLabels: Record<ExampleField, string> = { exampleProblem: "Problem", exampleSteps: "Steps", exampleAnswer: "Final answer" };
const subjectExampleTools = {
  mathematics: [
    ["＋", "+"], ["−", "−"], ["×", "×"], ["÷", "÷"], ["=", "="], ["≠", "≠"], ["≤", "≤"], ["≥", "≥"], ["½", "½"], ["²", "²"], ["√", "√"], ["π", "π"], ["%", "%"], ["→", " → "], ["Fraction", "numerator/denominator"], ["Equation", "x = "]
  ],
  science: [
    ["°C", "°C"], ["→", " → "], ["⇌", " ⇌ "], ["H₂O", "H₂O"], ["CO₂", "CO₂"], ["O₂", "O₂"], ["cm³", "cm³"], ["m/s", "m/s"], ["Δ", "Δ"], ["Observe", "Observation: "], ["Predict", "Prediction: "], ["Result", "Result: "], ["Conclusion", "Conclusion: "]
  ],
  "english-language": [
    ["“ ”", "“text”"], ["‘ ’", "‘text’"], ["—", "—"], [":", ": "], [";", "; "], ["Dialogue", "Speaker: “Dialogue”"], ["Evidence", "Evidence: “quotation”"], ["Meaning", "This means that…"], ["PEEL", "Point:\nEvidence:\nExplanation:\nLink:"], ["Paragraph", "\n\n"]
  ]
} satisfies Record<SupportedCurriculumSubject, string[][]>;
type ImportedLesson = {
  unit: string; chapter: string; topic: string; title: string; description: string; curriculumReference: string;
  objectives: string[]; estimatedMinutes: number; difficulty: FormState["difficulty"]; teachingHeading: string; teachingText: string;
  exampleTitle: string; exampleProblem: string; exampleSteps: string[]; exampleAnswer: string;
  trueFalseStatement: string; trueFalseAnswer: boolean; summaryPoints: string[]; questions: ImportedChallenge[];
};

type FormatAction = "heading" | "bold" | "italic" | "underline" | "bullet" | "numbered" | "quote" | "tip" | "link" | "clear";
type LessonFormat = "text" | "video";
type LessonVideo = { id: string; url: string; title: string; caption: string; participationPrompt: string; participationOptionA: string; participationOptionB: string; participationOptionC: string; participationCorrectOption: number; participationExplanation: string; participationXp: number };
type TextLessonSection = { id: string; heading: string; body: string; imageUrl: string; imageAlt: string; imageCaption: string; videoUrl: string; videoTitle: string; videoCaption: string };
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
  videos: LessonVideo[];
  textSections: TextLessonSection[];
  questions: QuizQuestion[];
  summary: string;
  xp: number; passingScore: number; masteryScore: number; maximumAttempts: number; lessonRedos: number;
};

const initial: FormState = {
  lessonFormat: "text", subject: "mathematics", grade: 4, unit: "", chapter: "", topic: "", prerequisiteLessonId: "", title: "", description: "", curriculumReference: "",
  objectives: ["", ""], minutes: 10, difficulty: "beginner", heading: "Let's learn", body: "", exampleTitle: "See it in action", videoUrl: "", videoTitle: "Watch and learn", videoCaption: "",
  exampleProblem: "", exampleSteps: "", exampleAnswer: "", videos: [{ id: "video-1", url: "", title: "Watch and learn", caption: "", participationPrompt: "", participationOptionA: "", participationOptionB: "", participationOptionC: "", participationCorrectOption: 0, participationExplanation: "", participationXp: 5 }], textSections: [{ id: "text-section-1", heading: "Let's learn", body: "", imageUrl: "", imageAlt: "", imageCaption: "", videoUrl: "", videoTitle: "Watch and learn", videoCaption: "" }], questions: [{ id: "question-1", prompt: "", optionA: "", optionB: "", optionC: "", correctOption: 0, hint: "", explanation: "" }],
  summary: "", xp: 100, passingScore: 60, masteryScore: 80, maximumAttempts: 2, lessonRedos: 2
};

export function ManualLessonBuilder({ initialAiConfigured = false, initialAiModel = "Not configured", editLessonId }: { initialAiConfigured?: boolean; initialAiModel?: string; editLessonId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState<MaterialisedCourse | null>(null);
  const [message, setMessage] = useState("");
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [quizFile, setQuizFile] = useState<File | null>(null);
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const aiConfigured = initialAiConfigured;
  const aiModel = initialAiModel;
  const [importing, setImporting] = useState<"lesson" | "quiz" | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [savedLessonId, setSavedLessonId] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<AdminLessonStatus | null>(null);
  const [libraryLessons, setLibraryLessons] = useState<AdminLessonRecord[]>([]);
  const [exampleTarget, setExampleTarget] = useState<ExampleField>("exampleSteps");
  const hasText = form.lessonFormat === "text" && form.textSections.some((section) => section.body.trim());
  const validVideos = form.lessonFormat === "text" ? [] : form.videos.filter((video) => resolveVideoEmbed(video.url));
  const hasVideo = validVideos.length > 0;
  const completeQuestions = form.questions.filter(questionComplete);
  const canBuild = useMemo(() => Boolean(form.title.trim().length >= 3 && (hasText || hasVideo)), [form.title, hasText, hasVideo]);
  const wordCount = form.textSections.reduce((total, section) => total + (section.body.trim() ? section.body.trim().split(/\s+/).length : 0), 0);
  const assessmentCount = completeQuestions.length;
  const participationBonusXp = validVideos.reduce((total, video) => total + (videoCheckpointComplete(video) ? video.participationXp : 0), 0);
  const maximumXp = form.xp + assessmentCount * 10 + participationBonusXp + 20;
  const subjectBadge = form.subject === "mathematics" ? "Mathematics Explorer" : form.subject === "science" ? "Science Explorer" : "English Explorer";

  useEffect(() => {
    void readAdminLessons().then((lessons) => {
      setLibraryLessons(lessons);
      if (!editLessonId) return;
      const lesson = lessons.find((candidate) => candidate.id === editLessonId);
      if (!lesson) { setMessage("The lesson to edit could not be found."); return; }
      if (lesson.builderState && typeof lesson.builderState === "object") {
        const saved = lesson.builderState as Partial<FormState>;
        const restoredVideos = saved.videos?.length ? saved.videos.map((video) => ({ ...initial.videos[0], ...video, participationPrompt: video.participationPrompt ?? "", participationXp: video.participationXp ?? 5 })) : saved.videoUrl ? [{ ...initial.videos[0], id: "restored-video-1", url: saved.videoUrl, title: saved.videoTitle || "Watch and learn", caption: saved.videoCaption || "" }] : initial.videos;
        const legacyFormat = (saved as { lessonFormat?: string }).lessonFormat;
        const restoredTextSections = saved.textSections?.length ? saved.textSections : [{ ...initial.textSections[0], heading: saved.heading || initial.heading, body: saved.body || "", ...(legacyFormat === "blended" && restoredVideos[0]?.url ? { videoUrl: restoredVideos[0].url, videoTitle: restoredVideos[0].title, videoCaption: restoredVideos[0].caption } : {}) }];
        setForm({ ...initial, ...saved, lessonFormat: saved.lessonFormat === "video" ? "video" : "text", videos: restoredVideos, textSections: restoredTextSections });
      } else setForm(restoreFormFromLesson(lesson));
      setSavedLessonId(lesson.id);
      setMessage(`Editing ${lesson.status === "published" ? "published" : "draft"} lesson: ${lesson.title}`);
    }).catch(() => setMessage("Lessons could not be loaded from Supabase."));
  }, [editLessonId]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((current) => ({ ...current, [key]: value })); setResult(null); }
  function insertExampleText(text: string) {
    const area = document.getElementById(`worked-${exampleTarget}`) as HTMLTextAreaElement | HTMLInputElement | null;
    const current = form[exampleTarget];
    const start = area?.selectionStart ?? current.length;
    const end = area?.selectionEnd ?? start;
    const placeholderStart = text.indexOf("text");
    const next = current.slice(0, start) + text + current.slice(end);
    update(exampleTarget, next);
    requestAnimationFrame(() => {
      area?.focus();
      const selectionStart = placeholderStart >= 0 ? start + placeholderStart : start + text.length;
      const selectionEnd = placeholderStart >= 0 ? selectionStart + 4 : selectionStart;
      area?.setSelectionRange(selectionStart, selectionEnd);
    });
  }
  function updateQuestion(id: string, changes: Partial<QuizQuestion>) { setForm((current) => ({ ...current, questions: current.questions.map((question) => question.id === id ? { ...question, ...changes } : question) })); setResult(null); }
  function addQuestion() { setForm((current) => ({ ...current, questions: [...current.questions, emptyQuestion()] })); setResult(null); }
  function addVideo() { setForm((current) => ({ ...current, videos: [...current.videos, { ...initial.videos[0], id: crypto.randomUUID(), title: `Video ${current.videos.length + 1}` }] })); setResult(null); }
  function updateVideo(id: string, changes: Partial<LessonVideo>) { setForm((current) => ({ ...current, videos: current.videos.map((video) => video.id === id ? { ...video, ...changes } : video) })); setResult(null); }
  function removeVideo(id: string) { setForm((current) => ({ ...current, videos: current.videos.filter((video) => video.id !== id) })); setResult(null); }
  function addTextSection() { setForm((current) => ({ ...current, textSections: [...current.textSections, { id: crypto.randomUUID(), heading: `Section ${current.textSections.length + 1}`, body: "", imageUrl: "", imageAlt: "", imageCaption: "", videoUrl: "", videoTitle: "Watch and learn", videoCaption: "" }] })); setResult(null); }
  function updateTextSection(id: string, changes: Partial<TextLessonSection>) { setForm((current) => ({ ...current, textSections: current.textSections.map((section) => section.id === id ? { ...section, ...changes } : section) })); setResult(null); }
  function removeTextSection(id: string) { setForm((current) => ({ ...current, textSections: current.textSections.filter((section) => section.id !== id) })); setResult(null); }
  function moveTextSection(index: number, direction: -1 | 1) { setForm((current) => { const target = index + direction; if (target < 0 || target >= current.textSections.length) return current; const textSections = [...current.textSections]; const [moved] = textSections.splice(index, 1); if (!moved) return current; textSections.splice(target, 0, moved); return { ...current, textSections }; }); setResult(null); }
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
    payload.set("file", sourceFile); payload.set("mode", mode); payload.set("subject", form.subject); payload.set("grade", String(form.grade)); payload.set("questionCount", String(quizQuestionCount));
    try {
      const response = await fetch("/api/admin/lessons/import", { method: "POST", body: payload });
      const result = await response.json() as { data?: ImportedLesson | { questions: ImportedChallenge[] }; error?: string };
      if (!response.ok || !result.data) throw new Error(result.error ?? "The file could not be extracted.");
      if (mode === "lesson") applyImportedLesson(result.data as ImportedLesson);
      else applyImportedQuiz((result.data as { questions: ImportedChallenge[] }).questions);
      setImportMessage(mode === "lesson" ? "Lesson fields and quiz questions filled from the uploaded note. Review or remove anything before saving." : "Quiz questions imported. Check the answers and feedback before saving.");
    } catch (cause: unknown) {
      setImportMessage(cause instanceof Error ? cause.message : "The file could not be extracted.");
    } finally { setImporting(null); }
  }

  function applyImportedLesson(data: ImportedLesson) {
    setForm((current) => ({ ...current, unit: data.unit, chapter: data.chapter, topic: data.topic, title: data.title,
      description: data.description, curriculumReference: data.curriculumReference, objectives: data.objectives.length ? data.objectives : [""],
      minutes: data.estimatedMinutes, difficulty: data.difficulty,
      heading: data.teachingHeading, body: data.teachingText, textSections: [{ ...initial.textSections[0], id: crypto.randomUUID(), heading: data.teachingHeading, body: data.teachingText }], exampleTitle: data.exampleTitle, exampleProblem: data.exampleProblem,
      exampleSteps: data.exampleSteps.join("\n"), exampleAnswer: data.exampleAnswer, summary: data.summaryPoints.join("\n"),
      questions: data.questions.map((question) => ({ id: crypto.randomUUID(), prompt: question.prompt,
        optionA: question.options[0] ?? "", optionB: question.options[1] ?? "", optionC: question.options[2] ?? "",
        correctOption: question.correctOptionIndex, hint: question.hint, explanation: question.explanation })) }));
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
    if (!["mathematics", "english-language", "science"].includes(form.subject)) { setMessage("Course / subject is invalid. Choose a subject again."); return null; }
    if (!["foundation", "beginner", "developing", "proficient", "challenge"].includes(form.difficulty)) { setMessage("Difficulty is invalid. Choose a difficulty again."); return null; }
    if (form.title.trim().length < 3) { setMessage("Lesson title must contain at least 3 characters."); return null; }
    if (!hasText && !hasVideo) { setMessage("Add lesson text or a valid video before publishing."); return null; }
    if (form.masteryScore < form.passingScore) { setMessage("Mastery score must be at least the passing score."); return null; }
    if (form.passingScore < 0 || form.passingScore > 100 || form.masteryScore > 100) { setMessage("Pass and mastery scores must be between 0 and 100."); return null; }
    if (form.maximumAttempts < 1 || form.maximumAttempts > 5) { setMessage("Attempts per question must be between 1 and 5."); return null; }
    if (form.lessonFormat !== "text" && form.videos.some((video) => video.url.trim() && !resolveVideoEmbed(video.url))) { setMessage("Every added video must use a valid public YouTube, Vimeo or TikTok link."); return null; }
    if (form.lessonFormat !== "text" && form.videos.some((video) => video.participationPrompt.trim() && !videoCheckpointComplete(video))) { setMessage("Complete all three video checkpoint answers and choose the correct one, or leave the checkpoint question empty."); return null; }
    if (form.lessonFormat !== "text" && form.videos.some((video) => video.participationXp < 1 || video.participationXp > 50)) { setMessage("Video participation rewards must be between 1 and 50 XP."); return null; }
    if (form.lessonFormat === "text" && form.textSections.some((section) => section.videoUrl.trim() && !resolveVideoEmbed(section.videoUrl))) { setMessage("Every video embedded in a text section must use a valid public YouTube, Vimeo or TikTok link."); return null; }
    if (form.lessonFormat === "text" && form.textSections.some((section) => section.imageUrl.trim() && section.imageAlt.trim().length < 8)) { setMessage("Every section image needs alternative text of at least 8 characters."); return null; }
    if (form.lessonRedos < 0 || form.lessonRedos > 20) { setMessage("Lesson redos must be between 0 and 20."); return null; }
    const unit = form.unit.trim() || "General lessons";
    const chapter = form.chapter.trim() || "General";
    const topic = form.topic.trim() || form.title.trim();
    const description = form.description.trim() || `Learn the key ideas in ${form.title.trim()}.`;
    const objectives = form.objectives.map((objective) => objective.trim()).filter((objective) => objective.length >= 5);
    const summaryPoints = form.summary.split("\n").map((point) => point.replace(/^[-\s]+/, "").trim()).filter((point) => point.length >= 5);
    const exampleSteps = form.exampleSteps.split("\n").map((step) => step.replace(/^[-\d.)\s]+/, "").trim()).filter((step) => step.length >= 3);
    const includeExample = Boolean(form.exampleProblem.trim() && form.exampleAnswer.trim() && exampleSteps.length >= 2);
    const fallbackChallenge = { prompt: "What did you learn in this lesson?", options: ["The main lesson idea", "An unrelated idea", "Nothing new"] as [string, string, string], correctOptionIndex: 0, hint: "Think about the lesson title.", explanation: "The first answer matches the lesson focus." };
    const course = generatedCourseSchema.safeParse({
      title: `${subjectLabel(form.subject)}: ${unit}`, subject: form.subject,
      sourceSummary: `Manual administrator lesson for Basic ${form.grade}, ${unit}, chapter ${chapter}.`,
      designRationale: "Administrator-authored short mission with instruction, worked practice, assessment and retrieval summary.",
      units: [{ title: unit, description: `Basic ${form.grade} learning unit: ${unit}.`, grade: form.grade, topics: [{ title: topic, description: `Learn and practise ${topic} in this lesson.`, lessons: [{
        title: form.title.trim(), description, curriculumReferences: [form.curriculumReference.trim() || `B${form.grade}.MANUAL`],
        objectives: objectives.length ? objectives : [`Understand ${form.title.trim()}.`], estimatedMinutes: form.minutes, difficulty: form.difficulty,
        teachingHeading: form.textSections[0]?.heading.trim() || form.heading.trim() || "Let's learn", teachingText: hasText ? form.textSections.map((section) => section.body).filter(Boolean).join("\n\n") : "Watch the lesson video and focus on the key ideas being demonstrated.", exampleTitle: form.exampleTitle.trim() || "Lesson example", exampleProblem: includeExample ? form.exampleProblem : "Review the main idea from the lesson.",
        exampleSteps: includeExample ? exampleSteps : ["Review the lesson content.", "Identify the main idea."], exampleAnswer: includeExample ? form.exampleAnswer : "Use the main lesson idea.",
        challenge: completeQuestions[0] ? toGeneratedChallenge(completeQuestions[0]) : fallbackChallenge,
        trueFalseStatement: "This lesson has been completed.", trueFalseAnswer: true,
        summaryPoints: summaryPoints.length >= 2 ? summaryPoints.slice(0, 4) : [`Review ${form.title.trim()}.`, "Continue practising the main lesson idea."]
      }] }] }]
    });
    if (!course.success) { setMessage(formatCourseIssue(course.error.issues[0])); return null; }
    const materialised = materialiseGeneratedCourse(course.data, `manual-${Date.now()}`, { baseXpReward: form.xp, passingScore: form.passingScore, masteryScore: form.masteryScore, maximumAttempts: form.maximumAttempts, maximumLessonRedos: form.lessonRedos, includeTrueFalse: false, includeText: hasText, includeWorkedExample: includeExample, includeAssessment: completeQuestions.length > 0, contentSections: form.lessonFormat === "text" ? form.textSections.map((section) => ({ heading: section.heading, body: section.body, imageUrl: section.imageUrl, imageAlt: section.imageAlt, imageCaption: section.imageCaption, videoUrl: section.videoUrl, videoTitle: section.videoTitle, videoCaption: section.videoCaption })) : undefined, videos: validVideos.map((video) => ({ url: video.url, title: video.title || form.title, caption: video.caption, participationPrompt: video.participationPrompt, participationOptions: videoCheckpointComplete(video) ? [{ id: "a", label: "A", text: video.participationOptionA.trim() }, { id: "b", label: "B", text: video.participationOptionB.trim() }, { id: "c", label: "C", text: video.participationOptionC.trim() }] : undefined, participationCorrectOptionId: videoCheckpointComplete(video) ? ["a", "b", "c"][video.participationCorrectOption] : undefined, participationExplanation: video.participationExplanation, participationXp: video.participationXp })), additionalChallenges: completeQuestions.slice(1).map(toGeneratedChallenge) });
    setResult(materialised); setMessage(materialised.issues.some((issue) => issue.severity === "error") ? "The draft needs corrections." : "Draft validated successfully.");
    return materialised;
  }

  async function saveLesson(status: AdminLessonStatus) {
    setSavingStatus(status);
    const materialised = build();
    if (!materialised || (status === "published" && materialised.issues.some((issue) => issue.severity === "error"))) { setSavingStatus(null); return; }
    const now = new Date().toISOString();
    const id = savedLessonId ?? crypto.randomUUID();
    const existingLesson = libraryLessons.find((lesson) => lesson.id === id);
    const fixture = structuredClone(materialised.fixture);
    fixture.lessons[0].prerequisiteLessonId = form.prerequisiteLessonId || null;
    if (status === "published") fixture.lessonVersions.forEach((version) => { version.status = "published"; version.publishedAt = now; version.updatedAt = now; });
    await writeAdminLesson({ id, subject: form.subject, grade: form.grade, unit: form.unit, chapter: form.chapter, topic: form.topic,
      title: form.title, description: form.description, estimatedMinutes: form.minutes, xp: form.xp,
      questionCount: completeQuestions.length, format: form.lessonFormat, prerequisiteLessonId: form.prerequisiteLessonId || null, gamification: { passingScore: form.passingScore, masteryScore: form.masteryScore,
        maximumAttempts: form.maximumAttempts, lessonRetries: form.lessonRedos, maximumXp, badge: subjectBadge },
      status, createdAt: existingLesson?.createdAt ?? now, updatedAt: now, fixture, builderState: structuredClone(form) });
    const subjectIds = [...libraryLessons.filter((lesson) => lesson.subject === form.subject).map((lesson) => lesson.id), id];
    await placeLessonAfter(form.subject, id, form.prerequisiteLessonId || null, subjectIds);
    setSavedLessonId(id);
    await deleteAdminSetting("manual-lesson-draft");
    router.push(`/admin/lessons?subject=${form.subject}`);
  }

  async function saveLocally() { await writeAdminSetting("manual-lesson-draft", form); setMessage("Draft saved to Supabase."); }
  async function restore() { const restored = await readAdminSetting<Partial<FormState> & { objectiveOne?: string; objectiveTwo?: string }>("manual-lesson-draft"); if (!restored) { setMessage("No saved draft was found."); return; } const legacyDraftFormat = (restored as { lessonFormat?: string }).lessonFormat; const legacyObjectives = [restored.objectiveOne, restored.objectiveTwo].filter((objective): objective is string => Boolean(objective)); const legacyVideo = restored.videos?.[0]; const textSections = restored.textSections?.length ? restored.textSections : [{ ...initial.textSections[0], heading: restored.heading || initial.heading, body: restored.body || "", ...(legacyDraftFormat === "blended" && legacyVideo?.url ? { videoUrl: legacyVideo.url, videoTitle: legacyVideo.title, videoCaption: legacyVideo.caption } : {}) }]; setForm({ ...initial, ...restored, lessonFormat: legacyDraftFormat === "video" ? "video" : "text", textSections, objectives: restored.objectives?.length ? restored.objectives : legacyObjectives.length ? legacyObjectives : [""], questions: restored.questions?.length ? restored.questions : [emptyQuestion()] }); setResult(null); setMessage("Supabase draft restored."); }
  function download() { if (!result) return; const url = URL.createObjectURL(new Blob([JSON.stringify(result.fixture, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `${slug(form.title)}-lesson-draft.json`; link.click(); URL.revokeObjectURL(url); }
  function format(action: FormatAction, sectionId: string) {
    const area = document.getElementById(`lesson-body-${sectionId}`) as HTMLTextAreaElement | null;
    if (!area) return;
    const section = form.textSections.find((item) => item.id === sectionId);
    if (!section) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = section.body.slice(start, end) || defaultText[action];
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
    updateTextSection(sectionId, { body: section.body.slice(0, start) + replacement + section.body.slice(end) });
    requestAnimationFrame(() => { area.focus(); area.setSelectionRange(start, start + replacement.length); });
  }
  function handleEditorShortcut(event: React.KeyboardEvent<HTMLTextAreaElement>, sectionId: string) {
    if (!(event.ctrlKey || event.metaKey)) return;
    const action = event.key.toLowerCase() === "b" ? "bold" : event.key.toLowerCase() === "i" ? "italic" : event.key.toLowerCase() === "u" ? "underline" : null;
    if (action) { event.preventDefault(); format(action, sectionId); }
  }

  return <LessonFormatContext.Provider value={form.lessonFormat}><main data-lesson-format={form.lessonFormat} className="mx-auto w-full max-w-[94rem] [&[data-lesson-format=text]_.video-only-fields]:hidden [&[data-lesson-format=video]_.text-lesson-fields]:hidden [&[data-lesson-format=video]_.ai-text-only]:hidden">
    <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-violet-950 to-violet-800 p-6 text-white shadow-xl sm:p-8 lg:p-10"><div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-fuchsia-400/15 blur-3xl" /><div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">Content Studio</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">Create a pupil-ready lesson</h1><p className="mt-4 max-w-3xl text-base leading-7 text-violet-100 sm:text-lg">Write from scratch or extract an editable starting point from your lesson notes. Review every detail before publishing.</p></div><div className="flex flex-wrap gap-3"><SkulKidButton type="button" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={saveLocally}><Save className="size-4" />Save draft</SkulKidButton><SkulKidButton type="button" variant="ghost" className="text-white hover:bg-white/10" onClick={restore}>Restore draft</SkulKidButton></div></div></header>

    <section id="lesson-format" className="scroll-mt-6 mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Lesson format</p><h2 className="mt-1 text-xl font-black">Choose your content</h2></div><div className="grid gap-2 sm:grid-cols-2 lg:min-w-[28rem]"><LessonFormatButton active={form.lessonFormat === "text"} icon={FileText} title="Text lesson" subtitle="Sections, images & embeds" onClick={() => update("lessonFormat", "text")} /><LessonFormatButton active={form.lessonFormat === "video"} icon={Video} title="Video lesson" subtitle="Hosted videos" onClick={() => update("lessonFormat", "video")} /></div></div></section>

    {form.lessonFormat === "text" ? <SkulKidCard id="ai-extraction" className="ai-text-only scroll-mt-6 mt-4 overflow-hidden border-violet-200 shadow-sm">
      <div className="grid gap-5 border-b border-violet-100 bg-violet-50 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-700 text-white"><Sparkles className="size-5" /></span><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Optional AI assistant</p><h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">Start from a lesson file</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">Upload a PDF, TXT or Markdown file. The assistant fills the lesson and quiz sections, and you can review, change or remove every field.</p></div></div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-black ${aiConfigured ? "bg-green-300 text-green-950" : "bg-amber-300 text-amber-950"}`}>{aiConfigured ? "AI ready" : "API key required"}</span>
      </div>
      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_12rem_auto] lg:items-end">
        <FilePicker id="lesson-note-file" file={lessonFile} label="Lesson note" help="PDF, TXT or Markdown · maximum 10 MB" onChange={setLessonFile} />
        <Field label="Quiz questions"><Select value={quizQuestionCount} onChange={(event) => setQuizQuestionCount(Number(event.target.value))}>{Array.from({ length: 10 }, (_, index) => index + 1).map((count) => <option value={count} key={count}>{count} question{count === 1 ? "" : "s"}</option>)}</Select></Field>
        <SkulKidButton type="button" size="lg" disabled={!lessonFile || importing !== null || aiConfigured === false} onClick={() => importFile("lesson")}>
          {importing === "lesson" ? <><LoaderCircle className="size-5 animate-spin" />Extracting lesson and quiz…</> : <><FileUp className="size-5" />Extract lesson and quiz</>}
        </SkulKidButton>
      </div>
      {aiConfigured === false ? <p className="mx-5 mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 sm:mx-6">Add <code>GEMINI_API_KEY</code> to the server environment and restart SkulKid. Manual authoring remains available.</p> : null}
      {importMessage ? <p role="status" className="mx-5 mb-5 rounded-xl bg-violet-50 p-3 text-sm text-violet-950 sm:mx-6">{importMessage}</p> : null}
      <p className="border-t border-slate-200 px-5 py-3 text-xs text-muted sm:px-6">Model: {aiModel || "checking…"}. Uploaded files are processed only when you click Extract.</p>
    </SkulKidCard> : null}

    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.65fr)]">
      <div className="space-y-6">
        <Section number="1" title="Course placement" description="Choose exactly where this lesson belongs."><div className="grid gap-4 sm:grid-cols-2"><Field label="Course / subject"><Select value={form.subject} onChange={(e) => update("subject", e.target.value as FormState["subject"])}><option value="mathematics">Mathematics</option><option value="english-language">English Language</option><option value="science">Science</option></Select></Field><Field label="Grade"><Select value={form.grade} onChange={(e) => update("grade", Number(e.target.value))}><option value={4}>Basic 4</option><option value={5}>Basic 5</option><option value={6}>Basic 6</option></Select></Field><Field label="Unit"><Input value={form.unit} onChange={(e) => update("unit", e.target.value)} placeholder="e.g. Fractions" required /></Field><Field label="Chapter"><Input value={form.chapter} onChange={(e) => update("chapter", e.target.value)} placeholder="e.g. Chapter 2" required /></Field><Field label="Topic"><Input value={form.topic} onChange={(e) => update("topic", e.target.value)} placeholder="e.g. Comparing fractions" required /></Field></div></Section>

        <Section number="2" title="Lesson foundations" description="State what pupils will learn and why."><div className="grid gap-5"><Field label="Lesson title"><Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="A short, motivating title" required /></Field><Field label="Short description"><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What will happen in this lesson?" required /></Field>
          <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><legend className="font-black text-slate-900">Learning objectives</legend><p className="mt-1 text-xs leading-5 text-muted">Add every measurable outcome pupils should achieve. Begin with an action verb such as identify, explain, compare or create.</p></div><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-800">{form.objectives.length} {form.objectives.length === 1 ? "objective" : "objectives"}</span></div><div className="mt-4 grid gap-3">{form.objectives.map((objective, index) => <div className="grid grid-cols-[2.25rem_1fr_auto] items-start gap-3" key={index}><span className="mt-1 grid size-9 place-items-center rounded-xl bg-white text-sm font-black text-violet-700 shadow-sm">{index + 1}</span><Textarea className="min-h-20 bg-white" aria-label={`Learning objective ${index + 1}`} value={objective} onChange={(event) => updateObjective(index, event.target.value)} placeholder="Pupils will be able to…" required /><SkulKidButton type="button" size="icon" variant="ghost" disabled={form.objectives.length === 1} onClick={() => removeObjective(index)} aria-label={`Remove learning objective ${index + 1}`}><Trash2 className="size-4" /></SkulKidButton></div>)}</div><SkulKidButton type="button" variant="outline" className="mt-4 w-full border-dashed" onClick={addObjective}><Plus className="size-4" />Add another learning objective</SkulKidButton></fieldset>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Estimated minutes"><Input type="number" min={5} max={20} value={form.minutes} onChange={(e) => update("minutes", Number(e.target.value))} /></Field><Field label="Difficulty"><Select value={form.difficulty} onChange={(e) => update("difficulty", e.target.value as FormState["difficulty"])}><option value="foundation">Foundation</option><option value="beginner">Beginner</option><option value="developing">Developing</option><option value="proficient">Proficient</option><option value="challenge">Challenge</option></Select></Field></div></div></Section>

        <Section number="3" title="Teaching material" description="Build a readable lesson with multiple rich-text sections, images and embedded media."><div className="grid gap-6">{form.textSections.map((section, index) => { const sectionVideo = section.videoUrl.trim() ? resolveVideoEmbed(section.videoUrl) : null; const sectionWords = section.body.trim() ? section.body.trim().split(/\s+/).length : 0; return <article className="overflow-hidden rounded-[1.35rem] border border-slate-300 bg-[#e9edf3] shadow-[0_12px_35px_rgba(15,23,42,.12)]" key={section.id}>
          <header className="flex flex-wrap items-center justify-between gap-3 bg-[#185abd] px-4 py-3 text-white"><div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded bg-white text-lg font-black text-[#185abd]">W</span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Teaching document {index + 1}</p><h3 className="truncate font-bold">{section.heading || "Untitled section"}</h3></div></div><div className="flex gap-1 [&_button]:text-white [&_button:hover]:bg-white/15"><SkulKidButton type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => moveTextSection(index, -1)} aria-label={`Move section ${index + 1} up`}><ArrowUp className="size-4" /></SkulKidButton><SkulKidButton type="button" size="icon" variant="ghost" disabled={index === form.textSections.length - 1} onClick={() => moveTextSection(index, 1)} aria-label={`Move section ${index + 1} down`}><ArrowDown className="size-4" /></SkulKidButton><SkulKidButton type="button" size="icon" variant="ghost" disabled={form.textSections.length === 1} onClick={() => removeTextSection(section.id)} aria-label={`Remove section ${index + 1}`}><Trash2 className="size-4" /></SkulKidButton></div></header>
          <div className="border-b border-slate-300 bg-white px-3 pt-2"><div className="flex gap-5 text-xs font-semibold text-slate-700"><span className="border-b-2 border-[#185abd] px-2 pb-2 text-[#185abd]">Home</span><span className="px-2 pb-2">Insert</span><span className="px-2 pb-2">Lesson tools</span></div></div>
          <div className="border-b border-slate-300 bg-[#f7f8fa] p-2"><div className="flex flex-wrap items-stretch gap-2" role="toolbar" aria-label={`Formatting tools for section ${index + 1}`}><RibbonGroup label="Styles"><Tool label="Heading" icon={Heading2} onClick={() => format("heading", section.id)} /></RibbonGroup><RibbonGroup label="Font"><Tool label="Bold" shortcut="Ctrl+B" icon={Bold} onClick={() => format("bold", section.id)} /><Tool label="Italic" shortcut="Ctrl+I" icon={Italic} onClick={() => format("italic", section.id)} /><Tool label="Underline" shortcut="Ctrl+U" icon={Underline} onClick={() => format("underline", section.id)} /><Tool label="Clear formatting" icon={RemoveFormatting} onClick={() => format("clear", section.id)} /></RibbonGroup><RibbonGroup label="Paragraph"><Tool label="Bullet list" icon={List} onClick={() => format("bullet", section.id)} /><Tool label="Numbered list" icon={ListOrdered} onClick={() => format("numbered", section.id)} /><Tool label="Quote" icon={Quote} onClick={() => format("quote", section.id)} /></RibbonGroup><RibbonGroup label="Lesson"><Tool label="Teaching tip" icon={Lightbulb} onClick={() => format("tip", section.id)} /><Tool label="Link" icon={Link2} onClick={() => format("link", section.id)} /></RibbonGroup></div></div>
          <div className="p-4 sm:p-6"><div className="mx-auto max-w-4xl bg-white p-5 shadow-[0_3px_15px_rgba(15,23,42,.14)] sm:min-h-[32rem] sm:p-9"><Field label="Document heading"><Input className="border-0 border-b border-slate-200 px-0 text-xl font-black shadow-none focus-visible:ring-0" value={section.heading} onChange={(event) => updateTextSection(section.id, { heading: event.target.value })} placeholder="Give this part a clear heading" /></Field><label className="mt-6 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor={`lesson-body-${section.id}`}>Page content</label><Textarea id={`lesson-body-${section.id}`} className="mt-2 min-h-80 resize-y rounded-none border-0 bg-white px-0 font-serif text-[16px] leading-8 shadow-none focus-visible:ring-0" value={section.body} onChange={(event) => updateTextSection(section.id, { body: event.target.value })} onKeyDown={(event) => handleEditorShortcut(event, section.id)} placeholder={"Start writing your lesson here…"} /></div>
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-[#185abd] px-3 py-2 text-[11px] font-semibold text-white"><span>Page 1 of 1</span><span>{sectionWords} words · {section.body.length} characters</span><span>English (Ghana) · Saved locally</span></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><details className="rounded-xl border border-blue-200 bg-blue-50 p-4"><summary className="cursor-pointer font-black text-blue-950"><span className="inline-flex items-center gap-2"><FileImage className="size-4" />Insert image</span></summary><div className="mt-4 grid gap-4"><Field label="Image URL"><Input type="url" value={section.imageUrl} onChange={(event) => updateTextSection(section.id, { imageUrl: event.target.value })} placeholder="https://…/diagram.jpg" /></Field><Field label="Alternative text"><Input value={section.imageAlt} onChange={(event) => updateTextSection(section.id, { imageAlt: event.target.value })} placeholder="Describe the image for pupils" /></Field><Field label="Image caption (optional)"><Input value={section.imageCaption} onChange={(event) => updateTextSection(section.id, { imageCaption: event.target.value })} /></Field></div>{section.imageUrl ? <img alt={section.imageAlt || "Lesson image preview"} className="mt-4 max-h-72 w-full rounded-xl bg-white object-contain" src={section.imageUrl} /> : null}</details><details className="rounded-xl border border-sky-200 bg-sky-50 p-4"><summary className="cursor-pointer font-black text-sky-950"><span className="inline-flex items-center gap-2"><Video className="size-4" />Insert video</span></summary><div className="mt-4 grid gap-4"><Field label="YouTube, Vimeo or TikTok link"><Input type="url" value={section.videoUrl} onChange={(event) => updateTextSection(section.id, { videoUrl: event.target.value })} aria-invalid={Boolean(section.videoUrl && !sectionVideo)} /></Field><Field label="Video title"><Input value={section.videoTitle} onChange={(event) => updateTextSection(section.id, { videoTitle: event.target.value })} /></Field><Field label="Video caption (optional)"><Input value={section.videoCaption} onChange={(event) => updateTextSection(section.id, { videoCaption: event.target.value })} /></Field></div>{sectionVideo ? <div className="mt-4"><EmbeddedVideo url={section.videoUrl} title={section.videoTitle || section.heading} caption={section.videoCaption} /></div> : section.videoUrl ? <p className="mt-3 text-sm font-bold text-red-700">Use a valid public YouTube, Vimeo or TikTok link.</p> : null}</details></div>
          </div>
        </article>; })}<SkulKidButton type="button" variant="outline" className="w-full border-dashed" onClick={addTextSection}><Plus className="size-5" />Add another lesson section</SkulKidButton><p className="text-xs text-muted">{wordCount} words across {form.textSections.length} section{form.textSections.length === 1 ? "" : "s"}.</p></div></Section>

        <Section number="4" title="Worked example" description="Optional: show pupils how to apply the skill before they practise.">
          <div className="grid gap-4">
            <Field label="Example title (optional)"><Input value={form.exampleTitle} onChange={(e) => update("exampleTitle", e.target.value)} /></Field>
            <div className={`rounded-2xl border p-4 ${form.subject === "mathematics" ? "border-blue-200 bg-blue-50" : form.subject === "science" ? "border-emerald-200 bg-emerald-50" : "border-violet-200 bg-violet-50"}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-slate-600">{subjectLabel(form.subject)} toolkit</p><h3 className="mt-1 font-black text-slate-950">{form.subject === "mathematics" ? "Mathematical symbols and structures" : form.subject === "science" ? "Scientific notation and investigation prompts" : "Language, quotation and paragraph tools"}</h3><p className="mt-1 text-xs leading-5 text-muted">Click inside a field below or choose where the tool should insert its content.</p></div><label className="text-xs font-black text-slate-700">Insert into<Select className="mt-1 min-w-36 bg-white" value={exampleTarget} onChange={(event) => setExampleTarget(event.target.value as ExampleField)}>{(Object.keys(exampleFieldLabels) as ExampleField[]).map((field) => <option value={field} key={field}>{exampleFieldLabels[field]}</option>)}</Select></label></div>
              <div className="mt-4 flex flex-wrap gap-2" role="toolbar" aria-label={`${subjectLabel(form.subject)} worked example tools`}>{subjectExampleTools[form.subject].map(([label, text]) => <button className="min-h-10 rounded-xl border border-white bg-white px-3 text-sm font-black text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50" key={`${label}-${text}`} onClick={() => insertExampleText(text)} title={`Insert ${text}`} type="button">{label}</button>)}</div>
            </div>
            <Field label="Problem or situation (optional)"><Textarea id="worked-exampleProblem" value={form.exampleProblem} onFocus={() => setExampleTarget("exampleProblem")} onChange={(e) => update("exampleProblem", e.target.value)} placeholder={form.subject === "mathematics" ? "e.g. Ama has ¾ of a metre of ribbon…" : form.subject === "science" ? "Describe the investigation, materials or observation." : "Add the sentence, passage or writing situation."} /></Field>
            <Field label="Steps - one per line (optional)"><Textarea id="worked-exampleSteps" value={form.exampleSteps} onFocus={() => setExampleTarget("exampleSteps")} onChange={(e) => update("exampleSteps", e.target.value)} placeholder={form.subject === "mathematics" ? "Write each calculation or reasoning step on a new line" : form.subject === "science" ? "Observe\nPredict\nTest\nRecord the result" : "Point\nEvidence\nExplanation\nLink"} /></Field>
            <Field label="Final answer (optional)"><Input id="worked-exampleAnswer" value={form.exampleAnswer} onFocus={() => setExampleTarget("exampleAnswer")} onChange={(e) => update("exampleAnswer", e.target.value)} /></Field>
          </div>
        </Section>

        {form.lessonFormat !== "text" ? <section id="video-content" className="video-only-fields scroll-mt-6 overflow-hidden rounded-[1.5rem] border border-sky-200 bg-white shadow-sm">
          <div className="flex gap-4 border-b border-sky-200 bg-sky-50 px-5 py-4 sm:px-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-700 text-white"><Video className="size-5" /></span>
            <div><h2 className="text-xl font-black text-slate-950">Add lesson videos</h2><p className="mt-1 text-sm leading-6 text-muted">Add one or more hosted videos in the order pupils should watch them.</p></div>
          </div>
          <div className="grid gap-5 p-5 sm:p-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><b>How to add videos:</b> upload each video to YouTube or Vimeo, copy its public link, then paste it below. TikTok links can also be used when the creator allows embedding. SkulKid stores the links only.</div>
            {form.videos.length ? form.videos.map((video, index) => {
              const embed = video.url.trim() ? resolveVideoEmbed(video.url) : null;
              return <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-4 sm:p-5" key={video.id}>
                <div className="flex items-center justify-between gap-3"><h3 className="font-black text-slate-950">Video {index + 1}</h3><SkulKidButton type="button" size="icon" variant="ghost" onClick={() => removeVideo(video.id)} aria-label={`Remove video ${index + 1}`}><Trash2 className="size-4" /></SkulKidButton></div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Video link"><Input type="url" value={video.url} onChange={(event) => updateVideo(video.id, { url: event.target.value })} placeholder="https://www.youtube.com/watch?v=…" aria-invalid={Boolean(video.url && !embed)} /><span className={`font-normal ${video.url && !embed ? "text-red-700" : "text-muted"}`}>{video.url ? embed ? `${embed.provider[0].toUpperCase() + embed.provider.slice(1)} link recognised` : "Use a valid YouTube, Vimeo or TikTok video link." : "Paste a public video link."}</span></Field><Field label="Video title"><Input value={video.title} onChange={(event) => updateVideo(video.id, { title: event.target.value })} placeholder="What pupils will watch" /></Field></div>
                <div className="mt-4"><Field label="Caption or viewing instruction (optional)"><Textarea className="min-h-20" value={video.caption} onChange={(event) => updateVideo(video.id, { caption: event.target.value })} placeholder="Tell pupils what to notice while watching." /></Field></div>
                <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4"><div className="grid gap-4 sm:grid-cols-[1fr_9rem]"><Field label="Video checkpoint question (optional)"><Input value={video.participationPrompt} onChange={(event) => updateVideo(video.id, { participationPrompt: event.target.value })} placeholder="Which idea was explained in the video?" /><span className="font-normal text-muted">A correct answer is required before XP is awarded.</span></Field><Field label="Checkpoint reward"><div className="relative"><Input type="number" min={1} max={50} value={video.participationXp} onChange={(event) => updateVideo(video.id, { participationXp: Math.min(50, Math.max(1, Number(event.target.value) || 1)) })} /><span className="absolute right-4 top-3 text-xs font-black text-muted">XP</span></div></Field></div>{video.participationPrompt.trim() ? <div className="mt-4 grid gap-3 sm:grid-cols-3"><Field label="Answer A"><Input value={video.participationOptionA} onChange={(event) => updateVideo(video.id, { participationOptionA: event.target.value })} /></Field><Field label="Answer B"><Input value={video.participationOptionB} onChange={(event) => updateVideo(video.id, { participationOptionB: event.target.value })} /></Field><Field label="Answer C"><Input value={video.participationOptionC} onChange={(event) => updateVideo(video.id, { participationOptionC: event.target.value })} /></Field><Field label="Correct answer"><Select value={String(video.participationCorrectOption)} onChange={(event) => updateVideo(video.id, { participationCorrectOption: Number(event.target.value) })}><option value="0">Answer A</option><option value="1">Answer B</option><option value="2">Answer C</option></Select></Field><div className="sm:col-span-2"><Field label="Explanation shown after success"><Input value={video.participationExplanation} onChange={(event) => updateVideo(video.id, { participationExplanation: event.target.value })} placeholder="Explain why this answer is correct." /></Field></div></div> : null}</div>
                {embed ? <div className="mt-5"><p className="mb-2 text-sm font-black">Embedded preview</p><EmbeddedVideo url={video.url} title={video.title || form.title || `Lesson video ${index + 1}`} caption={video.caption} /></div> : null}
              </div>;
            }) : <div className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 p-6 text-center text-sm text-muted">No videos added yet.</div>}
            <SkulKidButton type="button" variant="outline" className="w-full border-dashed border-sky-300" onClick={addVideo}><Plus className="size-5" />Add another video</SkulKidButton>
          </div>
        </section> : null}

        <Section number="5" title="Assessment and feedback" description="Optional: add quiz questions when the lesson needs an assessment, or leave this section empty.">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 sm:p-5">
              <div className="flex items-start gap-3"><Bot className="mt-0.5 size-5 shrink-0 text-violet-700" /><div><h3 className="font-black">Choose how to create the quiz</h3><p className="mt-1 text-sm text-text-secondary">Keep editing manually below, generate from the uploaded lesson note, or import a quiz you already prepared.</p></div></div>
              <div className="mt-4"><Field label="Number of questions to generate"><Select value={quizQuestionCount} onChange={(event) => setQuizQuestionCount(Number(event.target.value))}>{Array.from({ length: 10 }, (_, index) => index + 1).map((count) => <option value={count} key={count}>{count} question{count === 1 ? "" : "s"}</option>)}</Select></Field></div>
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
                  <SkulKidButton type="button" size="icon" variant="ghost" onClick={() => removeQuestion(question.id)} aria-label={`Remove question ${questionIndex + 1}`}><Trash2 className="size-4" /></SkulKidButton>
                </div>
                <div className="mt-4 grid gap-4">
                  <Field label="Question prompt"><Textarea value={question.prompt} onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })} required /></Field>
                  {(["optionA", "optionB", "optionC"] as const).map((key, optionIndex) => (
                    <label key={key} className={`grid grid-cols-[2rem_1fr] items-center gap-3 rounded-xl border p-2 ${question.correctOption === optionIndex ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"}`}>
                      <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-sm font-black">{String.fromCharCode(65 + optionIndex)}</span>
                      <Input aria-label={`Question ${questionIndex + 1}, option ${String.fromCharCode(65 + optionIndex)}`} value={question[key]} onChange={(event) => updateQuestion(question.id, { [key]: event.target.value })} placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} required />
                    </label>
                  ))}
                  <div className="grid gap-4 sm:grid-cols-2"><Field label="Hint (optional)"><Textarea value={question.hint} onChange={(event) => updateQuestion(question.id, { hint: event.target.value })} /></Field><Field label="Explanation (optional)"><Textarea value={question.explanation} onChange={(event) => updateQuestion(question.id, { explanation: event.target.value })} /></Field></div>
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
            <Field label="Summary points - one per line (optional)"><Textarea value={form.summary} onChange={(e) => update("summary", e.target.value)} /></Field>
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
  return <nav aria-label="Create lesson sections" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-200 bg-slate-950 px-5 py-4 text-white"><ListTree className="size-5" /><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">On this page</p><h2 className="font-black">Lesson sections</h2></div></div><ol className="grid gap-1 p-3">{items.map((item, index) => <li key={item.id}><a href={`#${item.id}`} className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-[11px] font-black group-hover:bg-violet-100">{String(index + 1).padStart(2, "0")}</span><span className="flex-1">{item.label}</span><ChevronRight className="size-4 text-slate-300 group-hover:text-violet-600" /></a></li>)}</ol><p className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs leading-5 text-muted">Showing the steps required for a <b>{format}</b> lesson.</p></nav>;
}
function LessonFormatButton({ active, icon: Icon, title, subtitle, onClick }: { active: boolean; icon: LucideIcon; title: string; subtitle: string; onClick: () => void }) { return <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-16 items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${active ? "border-violet-600 bg-violet-50 shadow-sm" : "border-slate-200 bg-white hover:border-violet-300"}`}><span className={`grid size-9 shrink-0 place-items-center rounded-lg ${active ? "bg-violet-700 text-white" : "bg-slate-100 text-slate-600"}`}><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block font-black text-slate-950">{title}</span><span className="block text-[11px] text-muted">{subtitle}</span></span>{active ? <CheckCircle2 className="size-4 shrink-0 text-violet-700" /> : null}</button>; }
function RewardPreset({ title, description, icon: Icon, tone, onClick }: { title: string; description: string; icon: LucideIcon; tone: "blue" | "violet" | "amber"; onClick: () => void }) { const colours = { blue: "bg-blue-100 text-blue-800", violet: "bg-violet-100 text-violet-800", amber: "bg-amber-100 text-amber-900" }; return <button type="button" onClick={onClick} className="group flex min-h-20 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${colours[tone]}`}><Icon className="size-5" /></span><span><span className="block font-black">{title}</span><span className="mt-0.5 block text-xs leading-5 text-muted">{description}</span></span></button>; }
function RewardFact({ value, label }: { value: string; label: string }) { return <div className="rounded-xl bg-white/10 p-2"><b className="block text-base">{value}</b><span className="text-violet-100">{label}</span></div>; }
function FilePicker({ id, file, label, help, onChange, compact = false }: { id: string; file: File | null; label: string; help: string; onChange: (file: File | null) => void; compact?: boolean }) {
  return <div><span className="text-sm font-bold">{label}</span><label htmlFor={id} className={`mt-2 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 hover:border-violet-400 hover:bg-violet-50 ${compact ? "min-h-16" : "min-h-20"}`}><FileUp className="size-5 shrink-0 text-violet-700" /><span className="min-w-0"><span className="block truncate text-sm font-bold">{file?.name ?? "Choose a file"}</span><span className="mt-0.5 block text-xs text-muted">{help}</span></span></label><input id={id} type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" className="sr-only" onChange={(event) => onChange(event.target.files?.[0] ?? null)} /></div>;
}
function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) { return <div className="flex min-w-fit flex-col border-r border-slate-300 pr-2 last:border-0"><div className="flex flex-1 items-center gap-1">{children}</div><span className="mt-1 text-center text-[9px] font-semibold text-slate-500">{label}</span></div>; }
function Tool({ label, shortcut, icon: Icon, onClick }: { label: string; shortcut?: string; icon: LucideIcon; onClick: () => void }) { const title = shortcut ? `${label} (${shortcut})` : label; return <button type="button" onClick={onClick} title={title} aria-label={title} className="grid size-9 place-items-center rounded border border-transparent bg-transparent text-slate-700 hover:border-slate-300 hover:bg-white hover:text-[#185abd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#185abd]"><Icon className="size-4" aria-hidden="true" /></button>; }
function questionComplete(question: QuizQuestion) { return Boolean(question.prompt.trim().length >= 5 && question.optionA.trim() && question.optionB.trim() && (question.correctOption !== 2 || question.optionC.trim())); }
function videoCheckpointComplete(video: LessonVideo) { return Boolean(video.participationPrompt.trim().length >= 5 && video.participationOptionA.trim() && video.participationOptionB.trim() && video.participationOptionC.trim() && video.participationCorrectOption >= 0 && video.participationCorrectOption <= 2); }
function toGeneratedChallenge(question: QuizQuestion) { return { prompt: question.prompt.trim(), options: [question.optionA.trim(), question.optionB.trim(), question.optionC.trim() || "None of these"] as [string, string, string], correctOptionIndex: question.correctOption, hint: question.hint.trim() || "Review the lesson content and try again.", explanation: question.explanation.trim() || "The correct answer follows from the lesson content." }; }
type StoredBlock = { type: string; order?: number; heading?: string; body?: string; source?: string; title?: string; caption?: string; altText?: string; participationPrompt?: string; participationOptions?: Array<{ id: string; text: string }>; participationCorrectOptionId?: string; participationExplanation?: string; participationXp?: number; problem?: string; orderedSteps?: string[]; finalAnswer?: string; prompt?: string; options?: Array<{ id: string; text: string }>; correctOptionId?: string; hint?: string; explanation?: string; keyPoints?: string[] };
type StoredFixture = { lessonVersions?: Array<{ difficulty?: FormState["difficulty"]; learningObjectives?: Array<{ code: string; description: string }>; blocks?: StoredBlock[] }> };
function restoreFormFromLesson(lesson: AdminLessonRecord): FormState {
  const fixture = lesson.fixture as StoredFixture | null;
  const version = fixture?.lessonVersions?.[0];
  const blocks = version?.blocks ?? [];
  const text = blocks.find((block) => block.type === "text");
  const videoBlocks = blocks.filter((block) => block.type === "video");
  const video = videoBlocks[0];
  const example = blocks.find((block) => block.type === "worked_example");
  const summary = blocks.find((block) => block.type === "summary");
  const questions = blocks.filter((block) => block.type === "multiple_choice").map((block, index) => ({ id: `restored-question-${index + 1}`, prompt: block.prompt ?? "", optionA: block.options?.[0]?.text ?? "", optionB: block.options?.[1]?.text ?? "", optionC: block.options?.[2]?.text ?? "", correctOption: Math.max(0, block.options?.findIndex((option) => option.id === block.correctOptionId) ?? 0), hint: block.hint ?? "", explanation: block.explanation ?? "" }));
  const objectives = version?.learningObjectives?.map((objective) => objective.description) ?? [];
  const videos = videoBlocks.map((block, index) => ({ id: `restored-video-${index + 1}`, url: block.source ?? "", title: block.title ?? `Lesson video ${index + 1}`, caption: block.caption ?? "", participationPrompt: block.participationPrompt ?? "", participationOptionA: block.participationOptions?.[0]?.text ?? "", participationOptionB: block.participationOptions?.[1]?.text ?? "", participationOptionC: block.participationOptions?.[2]?.text ?? "", participationCorrectOption: Math.max(0, block.participationOptions?.findIndex((option) => option.id === block.participationCorrectOptionId) ?? 0), participationExplanation: block.participationExplanation ?? "", participationXp: block.participationXp ?? 5 }));
  const textBlocks = blocks.filter((block) => block.type === "text");
  const textSections = textBlocks.map((block, index) => { const nextOrder = textBlocks[index + 1]?.order ?? Number.POSITIVE_INFINITY; const related = blocks.filter((candidate) => (candidate.order ?? 0) > (block.order ?? 0) && (candidate.order ?? 0) < nextOrder); const image = related.find((candidate) => candidate.type === "image"); const embeddedVideo = related.find((candidate) => candidate.type === "video"); return { id: `restored-text-section-${index + 1}`, heading: block.heading ?? `Section ${index + 1}`, body: block.body ?? "", imageUrl: image?.source ?? "", imageAlt: image?.altText ?? "", imageCaption: image?.caption ?? "", videoUrl: embeddedVideo?.source ?? "", videoTitle: embeddedVideo?.title ?? "Watch and learn", videoCaption: embeddedVideo?.caption ?? "" }; });
  return { ...initial, subject: lesson.subject, grade: lesson.grade, unit: lesson.unit, chapter: lesson.chapter, topic: lesson.topic, prerequisiteLessonId: lesson.prerequisiteLessonId ?? "", title: lesson.title, description: lesson.description, curriculumReference: version?.learningObjectives?.[0]?.code ?? "", objectives: objectives.length ? objectives : [""], minutes: lesson.estimatedMinutes, difficulty: version?.difficulty ?? "beginner", heading: text?.heading ?? initial.heading, body: text?.body ?? "", textSections: textSections.length ? textSections : initial.textSections, exampleTitle: example?.title ?? initial.exampleTitle, exampleProblem: example?.problem ?? "", exampleSteps: example?.orderedSteps?.join("\n") ?? "", exampleAnswer: example?.finalAnswer ?? "", videos: videos.length ? videos : initial.videos, videoUrl: video?.source ?? "", videoTitle: video?.title ?? initial.videoTitle, videoCaption: video?.caption ?? "", questions, summary: summary?.keyPoints?.join("\n") ?? "", xp: lesson.xp, passingScore: lesson.gamification?.passingScore ?? initial.passingScore, masteryScore: lesson.gamification?.masteryScore ?? initial.masteryScore, maximumAttempts: lesson.gamification?.maximumAttempts ?? initial.maximumAttempts, lessonRedos: lesson.gamification?.lessonRetries ?? initial.lessonRedos, lessonFormat: lesson.format === "video" ? "video" : "text" };
}
function formatCourseIssue(issue: { path: PropertyKey[]; message: string } | undefined) {
  if (!issue) return "Complete the required fields.";
  const fieldNames: Record<string, string> = {
    title: "Lesson title", description: "Description", objectives: "Learning objectives", estimatedMinutes: "Estimated minutes",
    difficulty: "Difficulty", teachingHeading: "Teaching heading", teachingText: "Teaching material", exampleTitle: "Example title",
    exampleProblem: "Example problem", exampleSteps: "Example steps", exampleAnswer: "Example answer", prompt: "Question",
    options: "Answer options", correctOptionIndex: "Correct answer", hint: "Question hint", explanation: "Answer explanation",
    summaryPoints: "Summary points", subject: "Course / subject", unit: "Unit", topic: "Topic"
  };
  const key = [...issue.path].reverse().find((part) => typeof part === "string");
  const field = typeof key === "string" ? (fieldNames[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())) : "Lesson";
  return `${field}: ${issue.message}`;
}
function subjectLabel(subject: SupportedCurriculumSubject) { return subject === "english-language" ? "English Language" : subject[0].toUpperCase() + subject.slice(1); }
function sectionId(title: string) { const ids: Record<string, string> = { "Course placement": "course-placement", "Lesson foundations": "learning-objectives", "Teaching material": "teaching-material", "Worked example": "worked-example", "Assessment and feedback": "assessment", "Rewards and mastery": "rewards-mastery" }; return ids[title] ?? title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, ""); }
function slug(value: string) { return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "") || "lesson"; }




