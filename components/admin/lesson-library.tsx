"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, BookOpen, CheckCircle2, Clock3, Eye, FilePenLine, Filter, Globe2, GripVertical, Layers3, Loader2, LockKeyhole, Pencil, Plus, Search, Trophy, Users } from "lucide-react";
import { Input, Select } from "@/components/design-system/form-controls";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { subjects } from "@/data/subjects";
import { courseIdForSubject, readAdminLessons } from "@/lib/admin/lesson-library";
import type { AdminLessonRecord, AdminLessonStatus } from "@/lib/admin/lesson-library";
import { useCourses, writeModuleLessonOrder } from "@/lib/courses/course-library";
import type { SupportedCurriculumSubject } from "@/domains/curriculum-ai/schemas/generated-course";

const subjectStyles: Record<SupportedCurriculumSubject, { accent: string; soft: string }> = {
  mathematics: { accent: "bg-blue-600", soft: "bg-blue-50 text-blue-800" },
  "english-language": { accent: "bg-violet-600", soft: "bg-violet-50 text-violet-800" },
  science: { accent: "bg-green-600", soft: "bg-green-50 text-green-800" }
};

export function LessonLibrary({ initialSubject, initialCourseId }: { initialSubject: SupportedCurriculumSubject; initialCourseId?: string }) {
  const { courses } = useCourses();
  const [courseId, setCourseId] = useState(initialCourseId ?? courseIdForSubject(initialSubject));
  const [status, setStatus] = useState<"all" | AdminLessonStatus>("all");
  const [query, setQuery] = useState("");
  const [savedLessons, setSavedLessons] = useState<AdminLessonRecord[]>([]);
  const [accessData, setAccessData] = useState<{
    classes: Array<{ id: string; name: string }>;
    subjects: Array<{ courseId: string; visibility: "class" | "platform"; ownerClassId: string | null; classIds: string[] }>;
  }>({ classes: [], subjects: [] });
  const [accessMode, setAccessMode] = useState<"class_only" | "public" | "both">("public");
  const [accessClassIds, setAccessClassIds] = useState<string[]>([]);
  const [savingAccess, setSavingAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");
  useEffect(() => { void readAdminLessons().then(setSavedLessons); }, []);
  async function loadAccess() {
    const response = await fetch("/api/teacher/subject-access", { cache: "no-store" });
    const payload = await response.json() as typeof accessData & { error?: string };
    if (!response.ok) throw new Error(payload.error || "Subject access could not be loaded.");
    setAccessData({ classes: payload.classes ?? [], subjects: payload.subjects ?? [] });
  }
  useEffect(() => { void loadAccess().catch((cause) => setAccessMessage(cause instanceof Error ? cause.message : "Subject access could not be loaded.")); }, []);
  const activeAccess = accessData.subjects.find((item) => item.courseId === courseId);
  useEffect(() => {
    if (!activeAccess) return;
    const mode = activeAccess.visibility === "class" ? "class_only" : activeAccess.classIds.length ? "both" : "public";
    setAccessMode(mode);
    setAccessClassIds(mode === "class_only" ? [activeAccess.ownerClassId ?? activeAccess.classIds[0]].filter(Boolean) as string[] : activeAccess.classIds);
    setAccessMessage("");
  }, [activeAccess]);

  async function saveSubjectAccess() {
    setSavingAccess(true);
    setAccessMessage("");
    try {
      const response = await fetch("/api/teacher/subject-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, mode: accessMode, classIds: accessMode === "public" ? [] : accessClassIds })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Subject access could not be updated.");
      await loadAccess();
      setAccessMessage("Subject access updated. Its modules and lessons follow the same access setting.");
    } catch (cause) {
      setAccessMessage(cause instanceof Error ? cause.message : "Subject access could not be updated.");
    } finally {
      setSavingAccess(false);
    }
  }

  const allLessons = savedLessons;
  const lessonCourseId = (lesson: AdminLessonRecord) => lesson.courseId ?? courseIdForSubject(lesson.subject);
  const subjectLessons = allLessons.filter((lesson) => lessonCourseId(lesson) === courseId);
  const visible = subjectLessons.filter((lesson) => (status === "all" || lesson.status === status) && `${lesson.title} ${lesson.unit} ${lesson.topic}`.toLowerCase().includes(query.toLowerCase()));
  const publishedCount = subjectLessons.filter((lesson) => lesson.status === "published").length;
  const draftCount = subjectLessons.filter((lesson) => lesson.status === "draft").length;
  const activeCourse = courses.find((course) => course.id === courseId);
  const legacySubject = subjects.find((item) => `subject-${item.slug}` === courseId);
  const displayedCourses = courses.filter((course) => allLessons.some((lesson) => lessonCourseId(lesson) === course.id) || course.id === courseId);
  const modules = activeCourse?.units ?? [];
  const moduleGroups = [
    ...modules.map((module) => {
      const allModuleLessons = subjectLessons.filter((lesson) => lesson.unitId === module.id);
      return {
        id: module.id,
        title: module.title,
        description: module.description,
        allLessons: allModuleLessons,
        lessons: visible.filter((lesson) => lesson.unitId === module.id)
      };
    }).filter((group) => group.lessons.length > 0),
    {
      id: null,
      title: "Unassigned lessons",
      description: "Lessons that have not yet been placed inside a module.",
      allLessons: subjectLessons.filter((lesson) => !lesson.unitId || !modules.some((module) => module.id === lesson.unitId)),
      lessons: visible.filter((lesson) => !lesson.unitId || !modules.some((module) => module.id === lesson.unitId))
    }
  ].filter((group) => group.lessons.length > 0);

  function moveLesson(moduleId: string, moduleLessons: AdminLessonRecord[], lessonId: string, direction: -1 | 1) {
    const current = moduleLessons.map((lesson) => lesson.id);
    const index = current.indexOf(lessonId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return;
    [current[index], current[target]] = [current[target], current[index]];
    const rank = new Map(current.map((id, position) => [id, position]));
    setSavedLessons((lessons) => [...lessons].sort((a, b) => a.unitId === moduleId && b.unitId === moduleId ? (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0) : 0));
    void writeModuleLessonOrder(courseId, moduleId, current);
  }

  return <main className="mx-auto w-full max-w-[94rem] space-y-6">
    <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8 lg:p-10"><div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-violet-600 opacity-20 blur-3xl" /><div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Lesson library</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">{activeCourse?.name ?? legacySubject?.name ?? "Subject"} lessons</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">Lessons are organised under their assigned modules. Reorder lessons without moving them out of their module.</p></div><Link href={`/teacher/lessons/new?${activeCourse?.ownerClassId ? `classId=${encodeURIComponent(activeCourse.ownerClassId)}&` : ""}courseId=${encodeURIComponent(courseId)}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-black text-slate-950 shadow-lg hover:bg-slate-100"><Plus className="size-5" />Create another lesson</Link></div></header>

    <nav aria-label="Choose subject" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{displayedCourses.map((course) => { const count = allLessons.filter((lesson) => lessonCourseId(lesson) === course.id).length; return <button type="button" onClick={() => setCourseId(course.id)} key={course.id} className={`rounded-2xl border p-4 text-left transition ${courseId === course.id ? "border-slate-950 bg-slate-950 text-white shadow-lg" : "border-slate-200 bg-white hover:border-slate-400"}`}><span className="flex items-center justify-between gap-3"><span className="font-black">{course.name}</span><span className={`rounded-full px-2.5 py-1 text-xs font-black ${courseId === course.id ? "bg-white/15" : "bg-violet-50 text-violet-800"}`}>{count}</span></span><span className={`mt-1 block text-xs ${courseId === course.id ? "text-slate-300" : "text-muted"}`}>{course.units.length} module{course.units.length === 1 ? "" : "s"} · {course.visibility === "class" ? "Class subject" : "Platform subject"}</span></button>; })}</nav>

    {activeAccess ? <section className="rounded-[1.5rem] border border-sky-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-sky-700">Subject access</p><h2 className="mt-1 text-xl font-black">Who can access {activeCourse?.name ?? "this subject"}?</h2><p className="mt-1 text-sm text-slate-600">This setting applies to the subject and every module and lesson inside it.</p></div><span className="inline-flex items-center gap-2 self-start rounded-full bg-sky-50 px-3 py-2 text-xs font-black text-sky-800"><Globe2 className="size-4" />Subject-level access</span></div><div className="mt-5 grid gap-3 md:grid-cols-3">{([
      ["class_only", LockKeyhole, "Class only", "Only one selected class can open this subject."],
      ["public", Globe2, "Public", "Anyone on the platform can view and learn."],
      ["both", Users, "Class and public", "Assigned classes get it, and it remains public."]
    ] as const).map(([mode, Icon, title, description]) => <label className={`cursor-pointer rounded-2xl border p-4 ${accessMode === mode ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100" : "border-slate-200"}`} key={mode}><span className="flex items-center gap-3"><input checked={accessMode === mode} name="subject-access-mode" onChange={() => { setAccessMode(mode); if (mode === "public") setAccessClassIds([]); else if (mode === "class_only") setAccessClassIds((current) => current.slice(0, 1)); }} type="radio" /><Icon className="size-5 text-sky-700" /><b>{title}</b></span><span className="mt-2 block text-xs leading-5 text-slate-600">{description}</span></label>)}</div>{accessMode !== "public" ? <fieldset className="mt-5"><legend className="text-sm font-black">{accessMode === "class_only" ? "Choose one class" : "Assign to classes"}</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{accessData.classes.map((classroom) => <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50" key={classroom.id}><input checked={accessClassIds.includes(classroom.id)} name="subject-access-classes" onChange={() => setAccessClassIds((current) => accessMode === "class_only" ? [classroom.id] : current.includes(classroom.id) ? current.filter((id) => id !== classroom.id) : [...current, classroom.id])} type={accessMode === "class_only" ? "radio" : "checkbox"} /><span className="font-bold">{classroom.name}</span></label>)}</div></fieldset> : null}<div className="mt-5 flex flex-wrap items-center gap-3"><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-700 px-5 font-black text-white disabled:opacity-50" disabled={savingAccess || (accessMode !== "public" && !accessClassIds.length)} onClick={() => void saveSubjectAccess()} type="button">{savingAccess ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}Save access</button>{accessMessage ? <p className="text-sm font-bold text-slate-700">{accessMessage}</p> : null}</div></section> : activeCourse ? <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-700">This is a shared platform subject. Only subjects you created can have their access changed.</p></section> : null}

    <section className="grid gap-4 sm:grid-cols-3"><Stat icon={BookOpen} label="Total lessons" value={visible.length} /><Stat icon={CheckCircle2} label="Published" value={publishedCount} tone="green" /><Stat icon={FilePenLine} label="Drafts" value={draftCount} tone="amber" /></section>

    <SkulKidCard className="p-4 sm:p-5"><div className="grid gap-3 sm:grid-cols-[1fr_13rem]"><label className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted" /><Input className="pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lessons, modules or topics" aria-label="Search lessons" /></label><label className="relative"><Filter className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted" /><Select className="pl-11" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Filter by status"><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Drafts</option></Select></label></div></SkulKidCard>

    {visible.length ? <div className="grid gap-5">{moduleGroups.map((group, moduleIndex) => <section className={`overflow-hidden rounded-[1.75rem] border bg-white shadow-sm ${group.id ? "border-violet-200" : "border-amber-200"}`} key={group.id ?? "unassigned"}><header className={`flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between ${group.id ? "border-violet-100 bg-violet-50" : "border-amber-100 bg-amber-50"}`}><div className="flex items-start gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${group.id ? "bg-violet-700 text-white" : "bg-amber-500 text-slate-950"}`}><Layers3 className="size-5" /></span><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">{group.id ? `Module ${moduleIndex + 1}` : "Needs placement"}</p><h2 className="text-xl font-black">{group.title}</h2><p className="mt-1 text-sm text-slate-600">{group.description}</p></div></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black ring-1 ring-slate-200">{group.lessons.length} lesson{group.lessons.length === 1 ? "" : "s"}</span></header><div className="p-4 sm:p-5">{group.id ? <div className="mb-4 flex items-center gap-2 text-sm font-bold text-muted"><GripVertical className="size-4" />Arrow controls reorder lessons only inside this module.</div> : null}<ol className="grid gap-4 lg:grid-cols-2">{group.lessons.map((lesson) => { const orderIndex = group.allLessons.findIndex((item) => item.id === lesson.id); return <li key={lesson.id}><LessonCard lesson={lesson} number={orderIndex + 1} canMoveUp={Boolean(group.id) && orderIndex > 0} canMoveDown={Boolean(group.id) && orderIndex < group.allLessons.length - 1} onMoveUp={() => group.id && moveLesson(group.id, group.allLessons, lesson.id, -1)} onMoveDown={() => group.id && moveLesson(group.id, group.allLessons, lesson.id, 1)} /></li>; })}</ol></div></section>)}</div> : <SkulKidCard className="grid min-h-72 place-items-center p-8 text-center"><div><BookOpen className="mx-auto size-12 text-slate-300" /><h2 className="mt-4 text-2xl font-black">No lessons found</h2><p className="mt-2 text-text-secondary">Try another filter or create the first lesson for this subject.</p><Link href={`/teacher/lessons/new?${activeCourse?.ownerClassId ? `classId=${encodeURIComponent(activeCourse.ownerClassId)}&` : ""}courseId=${encodeURIComponent(courseId)}`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 font-bold text-white"><Plus className="size-4" />Create lesson</Link></div></SkulKidCard>}
  </main>;
}

function LessonCard({ lesson, number, canMoveUp, canMoveDown, onMoveUp, onMoveDown }: { lesson: AdminLessonRecord; number: number; canMoveUp: boolean; canMoveDown: boolean; onMoveUp: () => void; onMoveDown: () => void }) {
  const style = subjectStyles[lesson.subject];
  return <article className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg sm:p-6"><span className={`absolute inset-y-0 left-0 w-1.5 ${style.accent}`} /><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-xl text-sm font-black ${style.soft}`}>{String(number).padStart(2, "0")}</span><div className="min-w-0"><p className="text-xs font-black uppercase tracking-wider text-muted">Lesson {number} / Basic {lesson.grade}</p><h2 className="mt-1 truncate text-xl font-black">{lesson.title}</h2></div></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${lesson.status === "published" ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-950"}`}>{lesson.status === "published" ? "Published" : "Draft"}</span></div><p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-text-secondary">{lesson.description}</p><p className="mt-3 text-xs font-bold text-violet-700">{lesson.unit} / {lesson.topic}</p><div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs font-bold text-muted"><span className="flex items-center gap-1.5"><Clock3 className="size-4" />{lesson.estimatedMinutes} min</span><span className="flex items-center gap-1.5"><Trophy className="size-4" />{lesson.xp} XP</span><span>{lesson.questionCount} questions</span><span className="ml-auto flex items-center gap-1 text-violet-700">{lesson.status === "published" ? <><Eye className="size-4" />Ready for pupils</> : <><FilePenLine className="size-4" />Continue editing</>}</span></div><div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-2"><Link href={`/teacher/lessons/new?edit=${encodeURIComponent(lesson.id)}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 text-xs font-black text-violet-800 hover:bg-violet-50"><Pencil className="size-4" />Edit lesson</Link><div className="flex gap-1"><button type="button" disabled={!canMoveUp} onClick={onMoveUp} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Move ${lesson.title} earlier`}><ArrowUp className="size-4" /></button><button type="button" disabled={!canMoveDown} onClick={onMoveDown} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Move ${lesson.title} later`}><ArrowDown className="size-4" /></button></div></div></article>;
}

function Stat({ icon: Icon, label, value, tone = "violet" }: { icon: typeof BookOpen; label: string; value: number; tone?: "violet" | "green" | "amber" }) { const colours = { violet: "bg-violet-100 text-violet-800", green: "bg-green-100 text-green-800", amber: "bg-amber-100 text-amber-900" }; return <SkulKidCard className="flex items-center gap-4 p-4"><span className={`grid size-11 place-items-center rounded-xl ${colours[tone]}`}><Icon className="size-5" /></span><div><p className="text-2xl font-black">{value}</p><p className="text-sm font-bold text-muted">{label}</p></div></SkulKidCard>; }
