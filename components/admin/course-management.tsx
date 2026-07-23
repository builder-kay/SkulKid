"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, ChevronDown, ChevronRight, Eye, EyeOff, ImageIcon, Layers3, Loader2, Palette, Pencil, Plus, Save, Tags, X } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { readAdminLessons, type AdminLessonRecord } from "@/lib/admin/lesson-library";
import {
  attachLessonToTopic,
  moveCourse,
  saveCourse,
  saveTopic,
  saveUnit,
  setCourseStatus,
  slugify,
  useCourses,
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
  status: "draft"
};

export function CourseManagement() {
  const { courses, loading, error, refresh } = useCourses();
  const [form, setForm] = useState<CourseInput | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<AdminLessonRecord[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const selected = courses.find((course) => course.id === selectedId) ?? courses[0];

  useEffect(() => {
    void readAdminLessons().then(setLessons);
    const refreshLessons = () => { void readAdminLessons().then(setLessons); };
    window.addEventListener("skulkid:lessons-changed", refreshLessons);
    return () => window.removeEventListener("skulkid:lessons-changed", refreshLessons);
  }, []);

  useEffect(() => {
    if (!selectedId && courses[0]) setSelectedId(courses[0].id);
  }, [courses, selectedId]);

  async function submitCourse() {
    if (!form?.name.trim() || !form.description.trim()) {
      setMessage("Add a course name and description.");
      return;
    }
    setSaving(true); setMessage("");
    try {
      const id = await saveCourse({ ...form, slug: slugify(form.slug || form.name) });
      setSelectedId(id);
      setForm(null);
      await refresh();
      setMessage("Course saved successfully.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not save the course.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(course: ManagedCourse) {
    setSaving(true); setMessage("");
    try {
      await setCourseStatus(course.id, course.status === "published" ? "draft" : "published");
      await refresh();
      setMessage(course.status === "published" ? "Course unpublished." : "Course is now live for pupils.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not update the course.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 grid gap-5" aria-labelledby="course-management-heading">
      <SkulKidCard className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-950 via-violet-950 to-violet-800 p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">Live course management</p>
            <h2 className="mt-2 text-3xl font-black" id="course-management-heading">Build the student catalogue</h2>
            <p className="mt-2 max-w-2xl text-violet-100">Create course cards, organise units and topics, attach lessons and control what pupils can see.</p>
          </div>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-black text-slate-950 shadow-lg hover:bg-violet-50" onClick={() => setForm(emptyForm)} type="button"><Plus className="size-5" />Create course</button>
        </div>
        {message ? <p className="m-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-bold text-blue-900" role="status">{message}</p> : null}
        {error ? <p className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</p> : null}
        {loading ? <div className="grid min-h-40 place-items-center"><Loader2 className="size-7 animate-spin text-violet-700" /></div> : (
          <div className="grid lg:grid-cols-[20rem_1fr]">
            <div className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
              <div className="grid gap-2">
                {courses.map((course, index) => (
                  <div className={`rounded-2xl border p-3 ${selected?.id === course.id ? "border-violet-400 bg-white shadow-sm" : "border-transparent hover:bg-white"}`} key={course.id}>
                    <button className="flex w-full items-center gap-3 text-left" onClick={() => setSelectedId(course.id)} type="button">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-sm" style={{ backgroundColor: course.color }}><BookOpen className="size-5" /></span>
                      <span className="min-w-0 flex-1"><b className="block truncate">{course.name}</b><span className={`text-xs font-bold ${course.status === "published" ? "text-emerald-700" : "text-amber-700"}`}>{course.status === "published" ? "Published" : "Draft"}</span></span>
                      <ChevronRight className="size-4 text-muted" />
                    </button>
                    <div className="mt-2 flex justify-end gap-1">
                      <MiniButton label="Move up" disabled={index === 0} onClick={() => void moveCourse(course.id, -1, courses)}><ArrowUp /></MiniButton>
                      <MiniButton label="Move down" disabled={index === courses.length - 1} onClick={() => void moveCourse(course.id, 1, courses)}><ArrowDown /></MiniButton>
                    </div>
                  </div>
                ))}
                {!courses.length ? <p className="p-5 text-center text-sm font-bold text-muted">Create the first course to begin.</p> : null}
              </div>
            </div>
            <div className="min-w-0 p-4 sm:p-6">
              {selected ? <CourseWorkspace course={selected} lessons={lessons} saving={saving} onEdit={() => setForm(toForm(selected))} onStatus={() => void changeStatus(selected)} onRefresh={refresh} setMessage={setMessage} /> : <EmptyCourse />}
            </div>
          </div>
        )}
      </SkulKidCard>
      {form ? <CourseForm form={form} saving={saving} setForm={setForm} onClose={() => setForm(null)} onSave={() => void submitCourse()} /> : null}
    </section>
  );
}

function CourseWorkspace({ course, lessons, saving, onEdit, onStatus, onRefresh, setMessage }: { course: ManagedCourse; lessons: AdminLessonRecord[]; saving: boolean; onEdit: () => void; onStatus: () => void; onRefresh: () => Promise<void>; setMessage: (value: string) => void }) {
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitTitle, setUnitTitle] = useState("");
  const [unitDescription, setUnitDescription] = useState("");
  const courseLessons = lessons.filter((lesson) => (lesson.courseId ?? `subject-${lesson.subject}`) === course.id);
  const publishedCount = courseLessons.filter((lesson) => lesson.status === "published").length;

  async function addUnit() {
    if (!unitTitle.trim()) return;
    try {
      await saveUnit(course.id, { title: unitTitle, description: unitDescription });
      setUnitTitle(""); setUnitDescription(""); setUnitOpen(false);
      await onRefresh();
      setMessage("Unit added.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not add the unit."); }
  }

  return <div className="grid gap-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-md" style={{ backgroundColor: course.color }}><BookOpen className="size-7" /></span>
        <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-2xl font-black">{course.name}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-black ${course.status === "published" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{course.status}</span></div><p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">{course.description}</p><p className="mt-2 text-xs font-bold text-muted">Basic {course.gradeLevels?.join(", Basic ") || "levels not set"} · /courses/{course.slug}</p></div>
      </div>
      <div className="flex shrink-0 gap-2"><button className="grid size-11 place-items-center rounded-xl border border-slate-300 hover:bg-slate-50" aria-label="Edit course" onClick={onEdit} type="button"><Pencil className="size-4" /></button><button className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black ${course.status === "published" ? "bg-amber-100 text-amber-950" : "bg-emerald-600 text-white"}`} disabled={saving} onClick={onStatus} type="button">{course.status === "published" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{course.status === "published" ? "Unpublish" : "Publish"}</button></div>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center"><Stat value={course.units.length} label="Units" /><Stat value={course.units.reduce((sum, unit) => sum + unit.topics.length, 0)} label="Topics" /><Stat value={publishedCount} label="Live lessons" /></div>
    <div>
      <div className="flex items-center justify-between gap-3"><div><h4 className="text-lg font-black">Units and topics</h4><p className="text-sm text-muted">Build the learning hierarchy and place lessons.</p></div><button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-100 px-3 text-sm font-black text-violet-900" onClick={() => setUnitOpen((open) => !open)} type="button"><Plus className="size-4" />Add unit</button></div>
      {unitOpen ? <InlineForm title="New unit" value={unitTitle} description={unitDescription} onValue={setUnitTitle} onDescription={setUnitDescription} onCancel={() => setUnitOpen(false)} onSave={() => void addUnit()} /> : null}
      <div className="mt-4 grid gap-3">{course.units.map((unit) => <UnitPanel course={course} unit={unit} lessons={lessons} key={unit.id} onRefresh={onRefresh} setMessage={setMessage} />)}{!course.units.length ? <div className="rounded-2xl border border-dashed border-slate-300 p-7 text-center"><Layers3 className="mx-auto size-8 text-violet-500" /><p className="mt-2 font-black">No units yet</p><p className="text-sm text-muted">Add a unit, then create topics inside it.</p></div> : null}</div>
    </div>
  </div>;
}

function UnitPanel({ course, unit, lessons, onRefresh, setMessage }: { course: ManagedCourse; unit: ManagedCourse["units"][number]; lessons: AdminLessonRecord[]; onRefresh: () => Promise<void>; setMessage: (value: string) => void }) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  async function addTopic() {
    if (!title.trim()) return;
    try { await saveTopic(unit.id, { title, description }); setTitle(""); setDescription(""); setAdding(false); await onRefresh(); setMessage("Topic added."); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not add the topic."); }
  }
  return <article className="overflow-hidden rounded-2xl border border-slate-200"><button className="flex w-full items-center gap-3 bg-slate-50 p-4 text-left" onClick={() => setOpen((value) => !value)} type="button"><span className="grid size-9 place-items-center rounded-xl bg-white text-violet-700 shadow-sm"><Layers3 className="size-4" /></span><span className="flex-1"><b className="block">{unit.title}</b><span className="text-xs text-muted">{unit.topics.length} topics</span></span><ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} /></button>{open ? <div className="grid gap-3 p-3"><div className="flex justify-end"><button className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-xs font-black" onClick={() => setAdding(true)} type="button"><Plus className="size-3.5" />Add topic</button></div>{adding ? <InlineForm title="New topic" value={title} description={description} onValue={setTitle} onDescription={setDescription} onCancel={() => setAdding(false)} onSave={() => void addTopic()} /> : null}{unit.topics.map((topic) => <TopicRow course={course} unitId={unit.id} topic={topic} lessons={lessons} key={topic.id} setMessage={setMessage} />)}{!unit.topics.length && !adding ? <p className="rounded-xl border border-dashed p-4 text-center text-sm font-bold text-muted">Add the first topic.</p> : null}</div> : null}</article>;
}

function TopicRow({ course, unitId, topic, lessons, setMessage }: { course: ManagedCourse; unitId: string; topic: ManagedCourse["units"][number]["topics"][number]; lessons: AdminLessonRecord[]; setMessage: (value: string) => void }) {
  const attached = lessons.filter((lesson) => lesson.topicId === topic.id);
  const available = lessons.filter((lesson) => lesson.topicId !== topic.id);
  const [lessonId, setLessonId] = useState("");
  async function attach() {
    if (!lessonId) return;
    try { await attachLessonToTopic(lessonId, course.id, unitId, topic.id); setLessonId(""); setMessage("Lesson attached to topic."); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not attach the lesson."); }
  }
  return <div className="rounded-xl border border-slate-200 p-3"><div className="flex items-center gap-2"><Tags className="size-4 text-emerald-700" /><b className="flex-1">{topic.title}</b><span className="text-xs font-bold text-muted">{attached.length} lessons</span></div>{attached.length ? <ul className="mt-2 grid gap-1">{attached.map((lesson) => <li className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900" key={lesson.id}>{lesson.title} · {lesson.status}</li>)}</ul> : null}{available.length ? <div className="mt-3 flex gap-2"><select className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm" value={lessonId} onChange={(event) => setLessonId(event.target.value)}><option value="">Choose a lesson to attach</option>{available.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title} ({lesson.status})</option>)}</select><button className="rounded-lg bg-violet-700 px-3 text-sm font-black text-white disabled:opacity-50" disabled={!lessonId} onClick={() => void attach()} type="button">Attach</button></div> : null}</div>;
}

function CourseForm({ form, saving, setForm, onClose, onSave }: { form: CourseInput; saving: boolean; setForm: (form: CourseInput) => void; onClose: () => void; onSave: () => void }) {
  return <div className="fixed inset-0 z-[90] grid place-items-end bg-slate-950/55 p-3 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="course-form-title"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5"><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Course details</p><h2 className="text-2xl font-black" id="course-form-title">{form.id ? "Edit course" : "Create a course"}</h2></div><button className="grid size-10 place-items-center rounded-xl bg-slate-100" onClick={onClose} type="button"><X className="size-5" /></button></div><div className="grid gap-4 p-5 sm:p-6"><FormField label="Course name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: form.id ? form.slug : slugify(event.target.value) })} /></FormField><FormField label="Course URL"><div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 pl-3 text-sm text-muted"><span>/courses/</span><input className="!border-0 !bg-transparent !pl-1 !ring-0" value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} /></div></FormField><FormField label="Description"><textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FormField><div className="grid gap-4 sm:grid-cols-2"><FormField label="Course colour"><div className="flex gap-2"><input className="!w-14 !p-1" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /><span className="flex items-center gap-2 text-sm text-muted"><Palette className="size-4" />{form.color}</span></div></FormField><FormField label="Initial status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CourseInput["status"] })}><option value="draft">Draft</option><option value="published">Published</option></select></FormField></div><FormField label="Cover image URL (optional)"><div className="relative"><ImageIcon className="absolute left-3 top-3 size-4 text-muted" /><input className="!pl-10" placeholder="https://…" value={form.coverUrl ?? ""} onChange={(event) => setForm({ ...form, coverUrl: event.target.value })} /></div></FormField><fieldset><legend className="text-sm font-black text-slate-700">Primary levels</legend><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">{[1,2,3,4,5,6].map((grade) => <label className={`cursor-pointer rounded-xl border p-2 text-center text-sm font-black ${form.gradeLevels.includes(grade) ? "border-violet-500 bg-violet-50 text-violet-900" : "border-slate-200"}`} key={grade}><input className="sr-only" type="checkbox" checked={form.gradeLevels.includes(grade)} onChange={() => setForm({ ...form, gradeLevels: form.gradeLevels.includes(grade) ? form.gradeLevels.filter((item) => item !== grade) : [...form.gradeLevels, grade].sort() })} />B{grade}</label>)}</div></fieldset><button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 font-black text-white disabled:opacity-60" disabled={saving} onClick={onSave} type="button">{saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}{saving ? "Saving…" : "Save course"}</button></div></div></div>;
}

function InlineForm({ title, value, description, onValue, onDescription, onCancel, onSave }: { title: string; value: string; description: string; onValue: (value: string) => void; onDescription: (value: string) => void; onCancel: () => void; onSave: () => void }) { return <div className="mt-3 grid gap-2 rounded-xl border border-violet-200 bg-violet-50 p-3"><b className="text-sm">{title}</b><input className="min-h-10 rounded-lg border border-slate-300 px-3" placeholder="Title" value={value} onChange={(event) => onValue(event.target.value)} /><input className="min-h-10 rounded-lg border border-slate-300 px-3" placeholder="Short description (optional)" value={description} onChange={(event) => onDescription(event.target.value)} /><div className="flex justify-end gap-2"><button className="min-h-9 rounded-lg px-3 text-sm font-bold" onClick={onCancel} type="button">Cancel</button><button className="min-h-9 rounded-lg bg-violet-700 px-3 text-sm font-black text-white" onClick={onSave} type="button">Save</button></div></div>; }
function FormField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm font-black text-slate-700 [&_input]:min-h-11 [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:p-3 [&_select]:min-h-11 [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3">{label}{children}</label>; }
function MiniButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactElement<{ className?: string }> }) { return <button aria-label={label} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-slate-100 disabled:opacity-30" disabled={disabled} onClick={onClick} type="button">{children}</button>; }
function Stat({ value, label }: { value: number; label: string }) { return <div className="rounded-xl bg-slate-50 p-3"><b className="block text-xl">{value}</b><span className="text-xs text-muted">{label}</span></div>; }
function EmptyCourse() { return <div className="grid min-h-72 place-items-center text-center"><div><BookOpen className="mx-auto size-10 text-violet-500" /><h3 className="mt-3 text-xl font-black">Choose or create a course</h3><p className="mt-1 text-sm text-muted">Course details and learning structure appear here.</p></div></div>; }
function toForm(course: ManagedCourse): CourseInput { return { id: course.id, name: course.name, slug: course.slug, description: course.description, color: course.color, coverUrl: course.coverUrl ?? null, gradeLevels: course.gradeLevels ?? [], status: course.status, icon: course.icon }; }
