"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Search, ShieldCheck, UserPlus, UserRoundCheck, UserX } from "lucide-react";
import type { ClassCourseAssignmentView, ClassTeachingTeamMember } from "@/lib/classes/types";

export function TeacherClassTeam({ classId, subjects }: { classId: string; subjects: ClassCourseAssignmentView[] }) {
  const [availableSubjects, setAvailableSubjects] = useState(subjects);
  const [team, setTeam] = useState<ClassTeachingTeamMember[]>([]);
  const [teacherQuery, setTeacherQuery] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ id: string; displayName: string; username: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDescription, setNewSubjectDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await fetch(`/api/teacher/classes/${classId}/team`, { cache: "no-store" });
    const payload = await response.json() as { team?: ClassTeachingTeamMember[]; error?: string };
    if (!response.ok) throw new Error(payload.error || "Unable to load the teaching team.");
    setTeam(payload.team ?? []);
  }

  useEffect(() => { void load().catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load the teaching team.")); }, [classId]);
  useEffect(() => { setAvailableSubjects(subjects); }, [subjects]);
  useEffect(() => {
    const query = teacherQuery.trim();
    if (query.length < 2 || selectedTeacherId) { setSuggestions([]); setSearching(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/teacher/classes/${classId}/team?q=${encodeURIComponent(query)}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json() as { school?: string; teachers?: Array<{ id: string; displayName: string; username: string }> };
        if (response.ok) {
          setSchoolName(payload.school ?? "");
          setSuggestions(payload.teachers ?? []);
        }
      } finally { if (!controller.signal.aborted) setSearching(false); }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [classId, selectedTeacherId, teacherQuery]);

  async function mutate(method: "POST" | "PATCH" | "DELETE", body: object, success: string) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/team`, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      const payload = await response.json() as { team?: ClassTeachingTeamMember[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to update the teaching team.");
      setTeam(payload.team ?? []); setNotice(success);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update the teaching team.");
      return false;
    } finally { setBusy(false); }
  }

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    const saved = await mutate("POST", { teacherQuery, courseIds }, "Invitation sent. Access begins after the teacher accepts.");
    if (saved) { setTeacherQuery(""); setSelectedTeacherId(""); setCourseIds([]); }
  }

  async function revoke(assignmentId: string) {
    if (!window.confirm("Remove this teacher's access to the class? Their original content will not be deleted.")) return;
    await mutate("DELETE", { assignmentId }, "Teacher access revoked.");
  }

  async function createSubject() {
    setBusy(true); setError(""); setNotice("");
    try {
      const previousIds = new Set(availableSubjects.map((subject) => subject.courseId));
      const response = await fetch(`/api/teacher/classes/${classId}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createClassOnly: true, name: newSubjectName, description: newSubjectDescription })
      });
      const payload = await response.json() as { courseAssignments?: ClassCourseAssignmentView[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to create this subject.");
      const nextSubjects = payload.courseAssignments ?? [];
      const created = nextSubjects.find((subject) => !previousIds.has(subject.courseId));
      setAvailableSubjects(nextSubjects);
      if (created) setCourseIds((current) => current.includes(created.courseId) ? current : [...current, created.courseId]);
      setNewSubjectName(""); setNewSubjectDescription(""); setShowCreateSubject(false);
      setNotice(created ? `${created.courseName} was created and selected.` : "Subject created.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create this subject.");
    } finally { setBusy(false); }
  }

  const subjectTeachers = team.filter((item) => item.role === "subject_teacher");
  return <section className="grid gap-5">
    <div className="rounded-[1.75rem] bg-gradient-to-br from-blue-800 via-indigo-800 to-slate-950 p-6 text-white shadow-xl sm:p-8">
      <div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10"><UserRoundCheck className="size-6" /></span><div><p className="text-xs font-black uppercase tracking-wider text-blue-200">Class staffing</p><h2 className="mt-1 text-3xl font-black">Teaching team</h2><p className="mt-2 max-w-2xl text-blue-100/80">Invite registered teachers by their exact SkulKid username and choose the subjects they teach.</p></div></div>
    </div>
    {error ? <p className="rounded-xl bg-rose-50 p-3 font-bold text-rose-900">{error}</p> : null}
    {notice ? <p className="rounded-xl bg-emerald-50 p-3 font-bold text-emerald-900">{notice}</p> : null}
    <form className="rounded-[1.5rem] border border-blue-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={invite}>
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-700"><UserPlus className="size-5" /></span><div><h3 className="text-xl font-black">Invite a subject teacher</h3><p className="text-sm text-slate-600">Find a registered teacher using their exact username or full name.</p></div></div>
      <label className="relative mt-5 grid gap-2 text-sm font-black">Teacher username or name<div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input aria-autocomplete="list" autoComplete="off" className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-10 font-medium" onChange={(event) => { setTeacherQuery(event.target.value); setSelectedTeacherId(""); }} placeholder="e.g. teacher_kay or Joyce Mensah" required value={teacherQuery} />{searching ? <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-blue-600" /> : null}</div>
        {teacherQuery.trim().length >= 2 && !selectedTeacherId ? <div className="absolute left-0 right-0 top-[4.8rem] z-20 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl" role="listbox">{suggestions.length ? suggestions.map((teacher) => <button className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-blue-50" key={teacher.id} onClick={() => { setTeacherQuery(teacher.username); setSelectedTeacherId(teacher.id); setSuggestions([]); }} role="option" type="button"><span><b className="block text-sm text-slate-900">{teacher.displayName}</b><span className="text-xs font-medium text-slate-500">@{teacher.username}</span></span><span className="text-[10px] font-black uppercase text-blue-700">Select</span></button>) : !searching ? <p className="px-3 py-3 text-xs font-medium text-slate-500">{schoolName ? `No matching teachers found at ${schoolName}.` : "Your school name must match the one in the other teacher’s account."}</p> : null}</div> : null}
        <span className="text-xs font-medium text-slate-500">Suggestions include only registered teachers whose school name matches yours. If several teachers share a name, use the exact username.</span></label>
      <SubjectPicker selected={courseIds} subjects={availableSubjects} onChange={setCourseIds} />
      <button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-dashed border-blue-300 px-3 text-sm font-black text-blue-700 hover:bg-blue-50" onClick={() => setShowCreateSubject((open) => !open)} type="button"><UserPlus className="size-4" />{showCreateSubject ? "Cancel new subject" : "Create a new subject"}</button>
      {showCreateSubject ? <div className="mt-3 grid gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4"><div><p className="font-black text-blue-950">Create a class subject</p><p className="mt-1 text-xs text-blue-800">It will belong to this class and be selected for this invitation automatically.</p></div><label className="grid gap-1.5 text-sm font-black text-slate-800">Subject name<input className="min-h-11 rounded-xl border border-blue-200 bg-white px-3 font-medium" maxLength={120} minLength={2} onChange={(event) => setNewSubjectName(event.target.value)} placeholder="e.g. Creative Writing" required value={newSubjectName} /></label><label className="grid gap-1.5 text-sm font-black text-slate-800">Description <span className="font-medium text-slate-500">(optional)</span><textarea className="min-h-20 rounded-xl border border-blue-200 bg-white px-3 py-2 font-medium" maxLength={500} onChange={(event) => setNewSubjectDescription(event.target.value)} placeholder="What will students learn?" value={newSubjectDescription} /></label><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 font-black text-white disabled:opacity-50" disabled={busy || newSubjectName.trim().length < 2} onClick={() => void createSubject()} type="button">{busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}Create and select subject</button></div> : null}
      <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 font-black text-white disabled:opacity-50" disabled={busy || teacherQuery.trim().length < 3 || !courseIds.length}>{busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}Send invitation</button>
    </form>
    <div><h3 className="text-xl font-black">Subject teachers</h3><div className="mt-3 grid gap-3 md:grid-cols-2">
      {subjectTeachers.length ? subjectTeachers.map((member) => <TeamCard busy={busy} key={member.assignmentId} member={member} subjects={availableSubjects} onRevoke={revoke} onSave={(assignmentId, selected) => mutate("PATCH", { assignmentId, courseIds: selected }, "Assigned subjects updated.")} />) : <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-600 md:col-span-2"><ShieldCheck className="mx-auto size-8 text-slate-300" /><p className="mt-2 font-black">No subject teachers yet</p></div>}
    </div></div>
  </section>;
}

function SubjectPicker({ selected, subjects, onChange }: { selected: string[]; subjects: ClassCourseAssignmentView[]; onChange: (ids: string[]) => void }) {
  return <fieldset className="mt-4"><legend className="text-sm font-black">Subjects they will teach</legend><div className="mt-2 flex flex-wrap gap-2">{subjects.map((subject) => <label className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-black ${selected.includes(subject.courseId) ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200"}`} key={subject.courseId}><input className="sr-only" type="checkbox" checked={selected.includes(subject.courseId)} onChange={() => onChange(selected.includes(subject.courseId) ? selected.filter((id) => id !== subject.courseId) : [...selected, subject.courseId])} />{subject.courseName}</label>)}</div></fieldset>;
}

function TeamCard({ busy, member, subjects, onRevoke, onSave }: { busy: boolean; member: ClassTeachingTeamMember; subjects: ClassCourseAssignmentView[]; onRevoke: (id: string) => Promise<void>; onSave: (id: string, subjects: string[]) => Promise<unknown> }) {
  const initial = member.subjects.map((subject) => subject.id);
  const [selected, setSelected] = useState(initial);
  const changed = [...initial].sort().join("|") !== [...selected].sort().join("|");
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div><h4 className="font-black">{member.teacherName}</h4><p className="text-xs font-bold text-slate-500">@{member.username || "teacher"} · <span className="capitalize">{member.status}</span></p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${member.status === "active" ? "bg-emerald-100 text-emerald-800" : member.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{member.status}</span></div>
    {!["revoked", "declined"].includes(member.status) ? <><SubjectPicker selected={selected} subjects={subjects} onChange={setSelected} /><div className="mt-4 flex flex-wrap gap-2">{changed ? <button className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-700 px-3 text-xs font-black text-white disabled:opacity-50" disabled={busy || !selected.length} onClick={() => void onSave(member.assignmentId, selected)} type="button"><Save className="size-4" />Save subjects</button> : null}<button className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-rose-200 px-3 text-xs font-black text-rose-700" disabled={busy} onClick={() => void onRevoke(member.assignmentId)} type="button"><UserX className="size-4" />Revoke access</button></div></> : <div className="mt-3 flex flex-wrap gap-1.5">{member.subjects.map((subject) => <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600" key={subject.id}>{subject.name}</span>)}</div>}
  </article>;
}
