"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, CheckCircle2, ChevronDown, ChevronRight, Eye, EyeOff, ImageIcon, Layers3, Loader2, Palette, Pencil, Plus, Save, Send, Tags, X } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { readAdminLessons, type AdminLessonRecord } from "@/lib/admin/lesson-library";
import {
  attachLessonToModule,
  attachLessonToTopic,
  detachLessonFromModule,
  moveStrand,
  moveSubStrand,
  saveCourse,
  saveTopic,
  saveUnit,
  setCourseStatus,
  slugify,
  useCourses,
  writeModuleLessonOrder,
  type CourseInput,
  type ManagedCourse
} from "@/lib/courses/course-library";

const emptyForm: CourseInput = {
  name: "",
  slug: "",
  description: "",
  color: "#2563EB",
  coverUrl: null,
  gradeLevels: [1, 2, 3, 4, 5, 6],
  status: "draft",
  audience: "public",
  classIds: []
};

type PublicationState = {
  currentRevisionId: string | null;
  currentVersion: number | null;
  publishedAt: string | null;
  latest: null | { id: string; version: number; status: string; submittedAt: string; reviewedAt: string | null; reviewNote: string | null };
};
type AccessItem = {
  courseId: string;
  visibility: "class" | "platform";
  ownerClassId: string | null;
  classIds: string[];
  publication: PublicationState | null;
};

export function CourseManagement({ initialCreate = false, initialSelectedCourseId }: { initialCreate?: boolean; initialSelectedCourseId?: string }) {
  const { courses, loading, error, refresh } = useCourses();
  const [form, setForm] = useState<CourseInput | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedCourseId ?? null);
  const [lessons, setLessons] = useState<AdminLessonRecord[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const createDeepLinkHandled = useRef(false);
  const [access, setAccess] = useState<{
    classes: Array<{ id: string; name: string }>;
    subjects: AccessItem[];
    settings: { allowTeacherPublishing: boolean; requireLessonApproval: boolean };
  }>({ classes: [], subjects: [], settings: { allowTeacherPublishing: true, requireLessonApproval: true } });
  const manageableCourses = courses.filter((course) => course.canManage);
  const selected = manageableCourses.find((course) => course.id === selectedId) ?? manageableCourses[0];

  async function refreshAccess() {
    const response = await fetch("/api/teacher/subject-access", { cache: "no-store" });
    const result = await response.json() as typeof access & { error?: string };
    if (!response.ok) throw new Error(result.error || "Could not load course audiences.");
    setAccess({
      classes: result.classes ?? [],
      subjects: result.subjects ?? [],
      settings: result.settings ?? { allowTeacherPublishing: true, requireLessonApproval: true }
    });
  }

  useEffect(() => {
    void readAdminLessons().then(setLessons);
    const refreshLessons = () => { void readAdminLessons().then(setLessons); };
    window.addEventListener("skulkid:lessons-changed", refreshLessons);
    return () => window.removeEventListener("skulkid:lessons-changed", refreshLessons);
  }, []);
  useEffect(() => { void refreshAccess().catch((cause) => setMessage(cause instanceof Error ? cause.message : "Could not load course audiences.")); }, []);
  useEffect(() => {
    if (!initialCreate || createDeepLinkHandled.current) return;
    createDeepLinkHandled.current = true;
    setForm({ ...emptyForm, gradeLevels: [...emptyForm.gradeLevels], classIds: [] });
    const url = new URL(window.location.href);
    url.searchParams.delete("create");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    window.setTimeout(() => document.querySelector<HTMLElement>('[aria-labelledby="course-form-title"] input')?.focus(), 120);
  }, [initialCreate]);

  useEffect(() => {
    if (!selectedId && manageableCourses[0]) setSelectedId(manageableCourses[0].id);
  }, [courses, selectedId]);

  async function submitCourse() {
    if (!form?.name.trim() || !form.description.trim()) {
      setMessage("Add a subject name and description.");
      return;
    }
    setSaving(true); setMessage("");
    try {
      const id = await saveCourse({ ...form, slug: slugify(form.slug || form.name) });
      setSelectedId(id);
      setForm(null);
      await Promise.all([refresh(), refreshAccess()]);
      setMessage("Course saved. Every lesson follows this audience.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not save the subject.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(course: ManagedCourse) {
    setSaving(true); setMessage("");
    try {
      await setCourseStatus(course.id, course.status === "published" ? "draft" : "published");
      await refresh();
      setMessage(course.status === "published" ? "Course paused for its classes." : "Course is ready in its assigned classes.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not update the subject.");
    } finally {
      setSaving(false);
    }
  }

  async function changePublication(course: ManagedCourse, action: "submit" | "unpublish") {
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`/api/teacher/courses/${encodeURIComponent(course.id)}/publication`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error || "Could not update Public Learning.");
      await Promise.all([refresh(), refreshAccess()]);
      setMessage(result.message ?? "Public Learning updated.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not update Public Learning.");
    } finally {
      setSaving(false);
    }
  }

  function editCourse(course: ManagedCourse) {
    const item = access.subjects.find((subject) => subject.courseId === course.id);
    const audience = item?.visibility === "class" ? "class_only" : item?.classIds.length ? "both" : "public";
    setForm({ ...toForm(course), audience, classIds: item?.classIds ?? [] });
  }

  return (
    <section className="mt-6 grid gap-5" aria-labelledby="course-management-heading">
      <SkulKidCard className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-950 via-violet-950 to-violet-800 p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">Course workspace</p>
            <h2 className="mt-2 text-3xl font-black" id="course-management-heading">Browse every subject and lesson</h2>
            <p className="mt-2 max-w-2xl text-violet-100">Choose an audience once, then organise strands, sub-strands, topics and lessons. Public versions stay private until submitted.</p>
          </div>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-black text-slate-950 shadow-lg hover:bg-violet-50" onClick={() => setForm({ ...emptyForm, gradeLevels: [...emptyForm.gradeLevels], classIds: [] })} type="button"><Plus className="size-5" />Create subject</button>
        </div>
        {message ? <p className="m-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-bold text-blue-900" role="status">{message}</p> : null}
        {error ? <p className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</p> : null}
        {loading ? <div className="grid min-h-40 place-items-center"><Loader2 className="size-7 animate-spin text-violet-700" /></div> : (
          <div className="grid lg:grid-cols-[20rem_1fr]">
            <div className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
              <div className="grid gap-2">
                {manageableCourses.map((course) => (
                  <div className={`rounded-2xl border p-3 ${selected?.id === course.id ? "border-violet-400 bg-white shadow-sm" : "border-transparent hover:bg-white"}`} key={course.id}>
                    <button className="flex w-full items-center gap-3 text-left" onClick={() => setSelectedId(course.id)} type="button">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-sm" style={{ backgroundColor: course.color }}><BookOpen className="size-5" /></span>
                      <span className="min-w-0 flex-1"><b className="block truncate">{course.name}</b><span className="text-xs font-bold text-slate-500">{audienceLabel(access.subjects.find((item) => item.courseId === course.id))}</span></span>
                      <ChevronRight className="size-4 text-muted" />
                    </button>
                  </div>
                ))}
                {!manageableCourses.length ? <p className="p-5 text-center text-sm font-bold text-muted">Create the first subject to begin.</p> : null}
              </div>
            </div>
            <div className="min-w-0 p-4 sm:p-6">
              {selected ? <CourseWorkspace course={selected} lessons={lessons} saving={saving} access={access.subjects.find((item) => item.courseId === selected.id)} settings={access.settings} onEdit={() => editCourse(selected)} onStatus={() => void changeStatus(selected)} onPublication={(action) => void changePublication(selected, action)} onRefresh={refresh} setMessage={setMessage} /> : <EmptyCourse />}
            </div>
          </div>
        )}
      </SkulKidCard>
      {form ? <PublicCourseForm classes={access.classes} form={form} saving={saving} setForm={setForm} onClose={() => setForm(null)} onSave={() => void submitCourse()} /> : null}
    </section>
  );
}

function CourseWorkspace({ course, lessons, saving, access, settings, onEdit, onStatus, onPublication, onRefresh, setMessage }: {
  course: ManagedCourse;
  lessons: AdminLessonRecord[];
  saving: boolean;
  access?: AccessItem;
  settings: { allowTeacherPublishing: boolean; requireLessonApproval: boolean };
  onEdit: () => void;
  onStatus: () => void;
  onPublication: (action: "submit" | "unpublish") => void;
  onRefresh: () => Promise<void>;
  setMessage: (value: string) => void;
}) {
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitTitle, setUnitTitle] = useState("");
  const [unitDescription, setUnitDescription] = useState("");
  const courseLessons = lessons.filter((lesson) => (lesson.courseId ?? `subject-${lesson.subject}`) === course.id);
  const publishedCount = courseLessons.filter((lesson) => lesson.status === "published").length;
  const isPublic = access?.visibility !== "class";
  const publication = access?.publication;
  const latestStatus = publication?.latest?.status;

  async function addUnit() {
    if (!unitTitle.trim()) return;
    try {
      await saveUnit(course.id, { title: unitTitle, description: unitDescription });
      setUnitTitle(""); setUnitDescription(""); setUnitOpen(false);
      await onRefresh();
      setMessage("Strand added.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not add the strand."); }
  }

  async function reorderStrand(strandId: string, direction: -1 | 1) {
    try {
      await moveStrand(course.id, strandId, direction, course.units);
      await onRefresh();
      setMessage("Strand order updated.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not reorder the strand.");
    }
  }

  return <div className="grid gap-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-md" style={{ backgroundColor: course.color }}><BookOpen className="size-7" /></span>
        <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-2xl font-black">{course.name}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-black ${course.status === "published" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{course.status}</span></div><p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">{course.description}</p><p className="mt-2 text-xs font-bold text-muted">Basic {course.gradeLevels?.join(", Basic ") || "levels not set"} · /courses/{course.slug}</p></div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2"><Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-black text-white" href={`/teacher/lessons/new?${course.ownerClassId ? `classId=${encodeURIComponent(course.ownerClassId)}&` : ""}courseId=${encodeURIComponent(course.id)}`}><Plus className="size-4" />Create lesson</Link><button className="grid size-11 place-items-center rounded-xl border border-slate-300 hover:bg-slate-50" aria-label="Edit subject" onClick={onEdit} type="button"><Pencil className="size-4" /></button>{access?.classIds.length ? <button className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black ${course.status === "published" ? "bg-amber-100 text-amber-950" : "bg-violet-700 text-white"}`} disabled={saving} onClick={onStatus} type="button">{course.status === "published" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{course.status === "published" ? "Pause classes" : "Ready for classes"}</button> : null}</div>
    </div>
    {isPublic ? <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-emerald-800">Public Learning publication</p><h4 className="mt-1 text-lg font-black">{publication?.currentVersion ? `Version ${publication.currentVersion} is live` : "Not yet published publicly"}</h4><p className="mt-1 text-sm text-emerald-950/75">{latestStatus === "pending_review" ? `Version ${publication?.latest?.version} is with an administrator. The last approved version stays live.` : latestStatus === "changes_requested" ? publication?.latest?.reviewNote || "An administrator asked for changes." : settings.requireLessonApproval ? "Submit a frozen course version for administrator approval." : "Publishing makes a frozen version available immediately."}</p></div><div className="flex shrink-0 flex-wrap gap-2">{publication?.currentRevisionId ? <button className="min-h-11 rounded-xl border border-amber-300 bg-white px-4 text-sm font-black text-amber-950 disabled:opacity-50" disabled={saving} onClick={() => onPublication("unpublish")} type="button">Unpublish</button> : null}<button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white disabled:opacity-50" disabled={saving || !settings.allowTeacherPublishing || latestStatus === "pending_review" || !publishedCount} onClick={() => onPublication("submit")} type="button">{latestStatus === "pending_review" ? <Loader2 className="size-4" /> : latestStatus === "changes_requested" ? <CheckCircle2 className="size-4" /> : <Send className="size-4" />}{latestStatus === "pending_review" ? "In review" : latestStatus === "changes_requested" ? "Resubmit changes" : publication?.currentRevisionId ? "Submit updated version" : "Submit to Public Learning"}</button></div></div>{access?.classIds.length && (latestStatus === "pending_review" || latestStatus === "changes_requested") ? <p className="mt-3 rounded-xl bg-sky-50 p-3 text-sm font-bold text-sky-900">Your assigned classes can use the latest ready lessons now. Public learners still see version {publication?.currentVersion ?? "—"}.</p> : null}{!settings.allowTeacherPublishing ? <p className="mt-3 rounded-xl bg-white p-3 text-sm font-bold text-amber-900">An administrator has paused Public Learning submissions. You can keep editing and saving this course.</p> : null}{!publishedCount ? <p className="mt-3 text-sm font-bold text-emerald-950">Publish at least one complete lesson before submitting.</p> : null}</section> : null}
    <div className="grid grid-cols-3 gap-2 text-center"><Stat value={course.units.length} label="Strands" /><Stat value={courseLessons.filter((lesson) => Boolean(lesson.unitId)).length} label="Linked lessons" /><Stat value={publishedCount} label="Live lessons" /></div>
    <div>
      <div className="flex items-center justify-between gap-3"><div><h4 className="text-lg font-black">Strands</h4><p className="text-sm text-muted">Subject → Strand → Sub-strand → Topic → Lesson.</p></div><button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-100 px-3 text-sm font-black text-violet-900" onClick={() => setUnitOpen((open) => !open)} type="button"><Plus className="size-4" />Add strand</button></div>
      {unitOpen ? <InlineForm title="New strand" value={unitTitle} description={unitDescription} onValue={setUnitTitle} onDescription={setUnitDescription} onCancel={() => setUnitOpen(false)} onSave={() => void addUnit()} /> : null}
      <div className="mt-4 grid gap-3">{course.units.map((unit, index) => <UnitPanel canMoveDown={index < course.units.length - 1} canMoveUp={index > 0} course={course} unit={unit} lessons={lessons} key={unit.id} onMove={(direction) => void reorderStrand(unit.id, direction)} onRefresh={onRefresh} setMessage={setMessage} />)}{!course.units.length ? <div className="rounded-2xl border border-dashed border-slate-300 p-7 text-center"><Layers3 className="mx-auto size-8 text-violet-500" /><p className="mt-2 font-black">No strands yet</p><p className="text-sm text-muted">Add a strand, then create its sub-strands and lessons.</p></div> : null}</div>
    </div>
  </div>;
}

function UnitPanel({ course, unit, lessons, canMoveUp, canMoveDown, onMove, onRefresh, setMessage }: { course: ManagedCourse; unit: ManagedCourse["units"][number]; lessons: AdminLessonRecord[]; canMoveUp: boolean; canMoveDown: boolean; onMove: (direction: -1 | 1) => void; onRefresh: () => Promise<void>; setMessage: (value: string) => void }) {
  const [open, setOpen] = useState(true);
  const [addingTopic, setAddingTopic] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachId, setAttachId] = useState("");
  const [busy, setBusy] = useState(false);

  const moduleLessons = lessons
    .filter((lesson) => lesson.unitId === unit.id)
    .sort((a, b) => {
      const aIndex = lessons.findIndex((item) => item.id === a.id);
      const bIndex = lessons.findIndex((item) => item.id === b.id);
      return aIndex - bIndex;
    });
  // Prefer lessons already in this subject course, plus unlinked lessons for the matching curriculum subject slug
  const attachable = lessons.filter((lesson) => {
    if (lesson.unitId === unit.id) return false;
    const lessonCourse = lesson.courseId ?? `subject-${lesson.subject}`;
    return lessonCourse === course.id || lesson.subject === course.slug;
  });

  async function addTopic() {
    if (!title.trim()) return;
    try { await saveTopic(unit.id, { title, description }); setTitle(""); setDescription(""); setAddingTopic(false); await onRefresh(); setMessage("Sub-strand added."); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not add the sub-strand."); }
  }

  async function attach() {
    if (!attachId) return;
    setBusy(true);
    try {
      await attachLessonToModule(attachId, course.id, unit.id, unit.title);
      setAttachId("");
      await onRefresh();
      setMessage(`Lesson linked to ${unit.title}.`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not link the lesson.");
    } finally {
      setBusy(false);
    }
  }

  async function move(lessonId: string, direction: -1 | 1) {
    const ids = moduleLessons.map((lesson) => lesson.id);
    const index = ids.indexOf(lessonId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setBusy(true);
    try {
      await writeModuleLessonOrder(course.id, unit.id, ids);
      await onRefresh();
      setMessage("Lesson order updated in this strand.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not reorder lessons.");
    } finally {
      setBusy(false);
    }
  }

  async function unlink(lessonId: string) {
    setBusy(true);
    try {
      await detachLessonFromModule(lessonId, course.id);
      await onRefresh();
      setMessage("Lesson unlinked from this strand.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not unlink the lesson.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="flex items-center gap-2 bg-slate-50 p-3">
      <button className="flex min-w-0 flex-1 items-center gap-3 p-1 text-left" onClick={() => setOpen((value) => !value)} type="button">
        <span className="grid size-9 place-items-center rounded-xl bg-white text-violet-700 shadow-sm"><Layers3 className="size-4" /></span>
        <span className="flex-1"><b className="block">{unit.title}</b><span className="text-xs text-muted">{moduleLessons.length} lesson{moduleLessons.length === 1 ? "" : "s"} · Strand {course.units.findIndex((item) => item.id === unit.id) + 1}</span></span>
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <div className="flex shrink-0 gap-1"><MiniButton label={`Move ${unit.title} earlier`} disabled={!canMoveUp} onClick={() => onMove(-1)}><ArrowUp /></MiniButton><MiniButton label={`Move ${unit.title} later`} disabled={!canMoveDown} onClick={() => onMove(1)}><ArrowDown /></MiniButton></div>
      </div>
      {open ? (
        <div className="grid gap-3 p-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <b className="text-sm">Lessons in this strand</b>
              <span className="text-xs font-bold text-muted">Drag-free reorder with arrows</span>
            </div>
            {moduleLessons.length ? (
              <ol className="mt-3 grid gap-2">
                {moduleLessons.map((lesson, index) => (
                  <li className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" key={lesson.id}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-black text-violet-800 shadow-sm">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <Link className="block truncate text-sm font-black hover:text-violet-700 hover:underline" href={`/teacher/lessons/new?edit=${encodeURIComponent(lesson.id)}`}>{lesson.title}</Link>
                      <p className="text-[11px] font-bold text-muted">{lesson.status} · Basic {lesson.grade}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <MiniButton label="Move earlier" disabled={busy || index === 0} onClick={() => void move(lesson.id, -1)}><ArrowUp /></MiniButton>
                      <MiniButton label="Move later" disabled={busy || index === moduleLessons.length - 1} onClick={() => void move(lesson.id, 1)}><ArrowDown /></MiniButton>
                      <button className="rounded-lg px-2 text-[11px] font-black text-rose-700 hover:bg-rose-50 disabled:opacity-40" disabled={busy} onClick={() => void unlink(lesson.id)} type="button">Unlink</button>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-slate-300 p-3 text-center text-sm font-bold text-muted">No lessons linked yet.</p>
            )}
            {attachable.length ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <select className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm" disabled={busy} value={attachId} onChange={(event) => setAttachId(event.target.value)}>
                  <option value="">Choose a lesson to link…</option>
                  {attachable.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title} ({lesson.status}{lesson.unitId ? ` · currently in another strand` : ""})
                    </option>
                  ))}
                </select>
                <button className="rounded-lg bg-violet-700 px-3 text-sm font-black text-white disabled:opacity-50" disabled={busy || !attachId} onClick={() => void attach()} type="button">Link to strand</button>
              </div>
            ) : (
              <p className="mt-3 text-xs font-bold text-muted">Create lessons in the Lessons studio, then link them here.</p>
            )}
          </div>

          <div className="flex justify-end">
            <button className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-xs font-black" onClick={() => setAddingTopic(true)} type="button"><Plus className="size-3.5" />Add sub-strand</button>
          </div>
          {addingTopic ? <InlineForm title="New sub-strand" value={title} description={description} onValue={setTitle} onDescription={setDescription} onCancel={() => setAddingTopic(false)} onSave={() => void addTopic()} /> : null}
          {unit.topics.map((topic, index) => <TopicRow canMoveDown={index < unit.topics.length - 1} canMoveUp={index > 0} course={course} unitId={unit.id} topic={topic} lessons={lessons} key={topic.id} onRefresh={onRefresh} setMessage={setMessage} />)}
        </div>
      ) : null}
    </article>
  );
}

function TopicRow({ course, unitId, topic, lessons, canMoveUp, canMoveDown, onRefresh, setMessage }: { course: ManagedCourse; unitId: string; topic: ManagedCourse["units"][number]["topics"][number]; lessons: AdminLessonRecord[]; canMoveUp: boolean; canMoveDown: boolean; onRefresh: () => Promise<void>; setMessage: (value: string) => void }) {
  const attached = lessons.filter((lesson) => lesson.topicId === topic.id);
  const available = lessons.filter((lesson) => lesson.topicId !== topic.id);
  const [lessonId, setLessonId] = useState("");
  async function attach() {
    if (!lessonId) return;
    try { await attachLessonToTopic(lessonId, course.id, unitId, topic.id); setLessonId(""); setMessage("Lesson attached to sub-strand."); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not attach the lesson."); }
  }
  async function reorder(direction: -1 | 1) {
    try {
      const strand = course.units.find((item) => item.id === unitId);
      if (!strand) return;
      await moveSubStrand(unitId, topic.id, direction, strand.topics);
      await onRefresh();
      setMessage("Sub-strand order updated.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not reorder the sub-strand.");
    }
  }
  return <div className="rounded-xl border border-slate-200 p-3"><div className="flex items-center gap-2"><Tags className="size-4 text-emerald-700" /><div className="flex-1"><span className="block text-[10px] font-black uppercase tracking-wider text-emerald-700">Sub-strand</span><b>{topic.title}</b></div><span className="text-xs font-bold text-muted">{attached.length} lessons</span><div className="flex gap-1"><MiniButton label={`Move ${topic.title} earlier`} disabled={!canMoveUp} onClick={() => void reorder(-1)}><ArrowUp /></MiniButton><MiniButton label={`Move ${topic.title} later`} disabled={!canMoveDown} onClick={() => void reorder(1)}><ArrowDown /></MiniButton></div></div>{attached.length ? <ul className="mt-2 grid gap-1">{attached.map((lesson) => <li className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900" key={lesson.id}><b>{lesson.topic || "Untitled topic"}</b><span className="mt-0.5 block">{lesson.title} · {lesson.status}</span></li>)}</ul> : null}{available.length ? <div className="mt-3 flex gap-2"><select className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm" value={lessonId} onChange={(event) => setLessonId(event.target.value)}><option value="">Choose a lesson to attach</option>{available.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.topic}: {lesson.title} ({lesson.status})</option>)}</select><button className="rounded-lg bg-violet-700 px-3 text-sm font-black text-white disabled:opacity-50" disabled={!lessonId} onClick={() => void attach()} type="button">Attach</button></div> : null}</div>;
}

function PublicCourseForm({ classes, form, saving, setForm, onClose, onSave }: {
  classes: Array<{ id: string; name: string }>;
  form: CourseInput;
  saving: boolean;
  setForm: (form: CourseInput) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const audience = form.audience ?? "public";
  const classIds = form.classIds ?? [];
  return (
    <div className="fixed inset-0 z-[90] grid place-items-end bg-slate-950/55 p-3 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="course-form-title">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
          <div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Course details and audience</p><h2 className="text-2xl font-black" id="course-form-title">{form.id ? "Edit course" : "Create a course"}</h2></div>
          <button className="grid size-10 place-items-center rounded-xl bg-slate-100" onClick={onClose} type="button"><X className="size-5" /></button>
        </div>
        <div className="grid gap-5 p-5 sm:p-6">
          <FormField label="Course name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: form.id ? form.slug : slugify(event.target.value) })} /></FormField>
          <FormField label="Course URL"><div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 pl-3 text-sm text-muted"><span>/courses/</span><input className="!border-0 !bg-transparent !pl-1 !ring-0" value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} /></div></FormField>
          <FormField label="Description"><textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FormField>
          <fieldset>
            <legend className="text-sm font-black text-slate-700">Who is this course for?</legend>
            <p className="mt-1 text-xs text-slate-500">Every strand, sub-strand, topic and lesson inherits this choice.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {([
                ["class_only", "My classes", "Only the classes you choose"],
                ["public", "Public Learning", "Available after publishing approval"],
                ["both", "Classes + Public", "Classes update now; public keeps its approved version"]
              ] as const).map(([value, title, detail]) => <label className={`cursor-pointer rounded-2xl border p-4 ${audience === value ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100" : "border-slate-200"}`} key={value}><span className="flex items-center gap-2"><input checked={audience === value} name="course-audience" onChange={() => setForm({ ...form, audience: value, classIds: value === "public" ? [] : classIds })} type="radio" /><b>{title}</b></span><span className="mt-2 block text-xs leading-5 text-slate-600">{detail}</span></label>)}
            </div>
          </fieldset>
          {audience !== "public" ? <fieldset><legend className="text-sm font-black text-slate-700">Choose one or more classes</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{classes.map((classroom) => <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3" key={classroom.id}><input checked={classIds.includes(classroom.id)} onChange={() => setForm({ ...form, classIds: classIds.includes(classroom.id) ? classIds.filter((id) => id !== classroom.id) : [...classIds, classroom.id] })} type="checkbox" /><span className="font-bold">{classroom.name}</span></label>)}</div>{!classes.length ? <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-950">Create an active class before choosing a class audience.</p> : null}</fieldset> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Course colour"><div className="flex gap-2"><input className="!w-14 !p-1" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /><span className="flex items-center gap-2 text-sm text-muted"><Palette className="size-4" />{form.color}</span></div></FormField>
            <FormField label={audience === "public" ? "Working status" : "Class availability"}><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CourseInput["status"] })}><option value="draft">Draft</option><option value="published">{audience === "public" ? "Ready to submit" : "Ready for classes"}</option></select></FormField>
          </div>
          <FormField label="Cover image URL (optional)"><div className="relative"><ImageIcon className="absolute left-3 top-3 size-4 text-muted" /><input className="!pl-10" placeholder="https://…" value={form.coverUrl ?? ""} onChange={(event) => setForm({ ...form, coverUrl: event.target.value })} /></div></FormField>
          <fieldset><legend className="text-sm font-black text-slate-700">Primary levels</legend><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">{[1,2,3,4,5,6].map((grade) => <label className={`cursor-pointer rounded-xl border p-2 text-center text-sm font-black ${form.gradeLevels.includes(grade) ? "border-violet-500 bg-violet-50 text-violet-900" : "border-slate-200"}`} key={grade}><input className="sr-only" type="checkbox" checked={form.gradeLevels.includes(grade)} onChange={() => setForm({ ...form, gradeLevels: form.gradeLevels.includes(grade) ? form.gradeLevels.filter((item) => item !== grade) : [...form.gradeLevels, grade].sort() })} />B{grade}</label>)}</div></fieldset>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 font-black text-white disabled:opacity-60" disabled={saving || !form.gradeLevels.length || (audience !== "public" && !classIds.length)} onClick={onSave} type="button">{saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}{saving ? "Saving…" : "Save course"}</button>
        </div>
      </div>
    </div>
  );
}

function CourseForm({ form, saving, setForm, onClose, onSave }: { form: CourseInput; saving: boolean; setForm: (form: CourseInput) => void; onClose: () => void; onSave: () => void }) {
  return <div className="fixed inset-0 z-[90] grid place-items-end bg-slate-950/55 p-3 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="course-form-title"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5"><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Subject details</p><h2 className="text-2xl font-black" id="course-form-title">{form.id ? "Edit subject" : "Create a subject"}</h2></div><button className="grid size-10 place-items-center rounded-xl bg-slate-100" onClick={onClose} type="button"><X className="size-5" /></button></div><div className="grid gap-4 p-5 sm:p-6"><FormField label="Subject name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: form.id ? form.slug : slugify(event.target.value) })} /></FormField><FormField label="Subject URL"><div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 pl-3 text-sm text-muted"><span>/courses/</span><input className="!border-0 !bg-transparent !pl-1 !ring-0" value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} /></div></FormField><FormField label="Description"><textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FormField><div className="grid gap-4 sm:grid-cols-2"><FormField label="Subject colour"><div className="flex gap-2"><input className="!w-14 !p-1" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /><span className="flex items-center gap-2 text-sm text-muted"><Palette className="size-4" />{form.color}</span></div></FormField><FormField label="Initial status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CourseInput["status"] })}><option value="draft">Draft</option><option value="published">Published</option></select></FormField></div><FormField label="Cover image URL (optional)"><div className="relative"><ImageIcon className="absolute left-3 top-3 size-4 text-muted" /><input className="!pl-10" placeholder="https://…" value={form.coverUrl ?? ""} onChange={(event) => setForm({ ...form, coverUrl: event.target.value })} /></div></FormField><fieldset><legend className="text-sm font-black text-slate-700">Primary levels</legend><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">{[1,2,3,4,5,6].map((grade) => <label className={`cursor-pointer rounded-xl border p-2 text-center text-sm font-black ${form.gradeLevels.includes(grade) ? "border-violet-500 bg-violet-50 text-violet-900" : "border-slate-200"}`} key={grade}><input className="sr-only" type="checkbox" checked={form.gradeLevels.includes(grade)} onChange={() => setForm({ ...form, gradeLevels: form.gradeLevels.includes(grade) ? form.gradeLevels.filter((item) => item !== grade) : [...form.gradeLevels, grade].sort() })} />B{grade}</label>)}</div></fieldset><button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 font-black text-white disabled:opacity-60" disabled={saving} onClick={onSave} type="button">{saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}{saving ? "Saving…" : "Save subject"}</button></div></div></div>;
}

function InlineForm({ title, value, description, onValue, onDescription, onCancel, onSave }: { title: string; value: string; description: string; onValue: (value: string) => void; onDescription: (value: string) => void; onCancel: () => void; onSave: () => void }) { return <div className="mt-3 grid gap-2 rounded-xl border border-violet-200 bg-violet-50 p-3"><b className="text-sm">{title}</b><input className="min-h-10 rounded-lg border border-slate-300 px-3" placeholder="Title" value={value} onChange={(event) => onValue(event.target.value)} /><input className="min-h-10 rounded-lg border border-slate-300 px-3" placeholder="Short description (optional)" value={description} onChange={(event) => onDescription(event.target.value)} /><div className="flex justify-end gap-2"><button className="min-h-9 rounded-lg px-3 text-sm font-bold" onClick={onCancel} type="button">Cancel</button><button className="min-h-9 rounded-lg bg-violet-700 px-3 text-sm font-black text-white" onClick={onSave} type="button">Save</button></div></div>; }
function FormField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm font-black text-slate-700 [&_input]:min-h-11 [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:p-3 [&_select]:min-h-11 [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3">{label}{children}</label>; }
function MiniButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactElement<{ className?: string }> }) { return <button aria-label={label} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-slate-100 disabled:opacity-30" disabled={disabled} onClick={onClick} type="button">{children}</button>; }
function Stat({ value, label }: { value: number; label: string }) { return <div className="rounded-xl bg-slate-50 p-3"><b className="block text-xl">{value}</b><span className="text-xs text-muted">{label}</span></div>; }
function EmptyCourse() { return <div className="grid min-h-72 place-items-center text-center"><div><BookOpen className="mx-auto size-10 text-violet-500" /><h3 className="mt-3 text-xl font-black">Choose or create a subject</h3><p className="mt-1 text-sm text-muted">Subject details and learning structure appear here.</p></div></div>; }
function toForm(course: ManagedCourse): CourseInput { return { id: course.id, name: course.name, slug: course.slug, description: course.description, color: course.color, coverUrl: course.coverUrl ?? null, gradeLevels: course.gradeLevels ?? [], status: course.status, icon: course.icon }; }
function audienceLabel(access?: AccessItem) {
  if (!access) return "Shared course";
  if (access.visibility === "class") return access.classIds.length > 1 ? "My classes" : "My class";
  return access.classIds.length ? "Classes + Public Learning" : "Public Learning";
}
function publicationLabel(publication?: PublicationState | null) {
  if (!publication?.latest) return "Unpublished";
  const labels: Record<string, string> = {
    pending_review: "In review",
    changes_requested: "Changes requested",
    approved: "Published",
    superseded: "Updated",
    archived: "Unpublished"
  };
  return labels[publication.latest.status] ?? publication.latest.status;
}
