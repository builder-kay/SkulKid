"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, ShieldCheck, UserPlus, UserRoundCheck, UserX } from "lucide-react";
import type { ClassCourseAssignmentView, ClassTeachingTeamMember } from "@/lib/classes/types";

export function TeacherClassTeam({ classId, subjects }: { classId: string; subjects: ClassCourseAssignmentView[] }) {
  const [team, setTeam] = useState<ClassTeachingTeamMember[]>([]);
  const [teacherQuery, setTeacherQuery] = useState("");
  const [courseIds, setCourseIds] = useState<string[]>([]);
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
    if (saved) { setTeacherQuery(""); setCourseIds([]); }
  }

  async function revoke(assignmentId: string) {
    if (!window.confirm("Remove this teacher's access to the class? Their original content will not be deleted.")) return;
    await mutate("DELETE", { assignmentId }, "Teacher access revoked.");
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
      <label className="mt-5 grid gap-2 text-sm font-black">Teacher username or name<input className="min-h-11 rounded-xl border border-slate-300 px-3 font-medium" onChange={(event) => setTeacherQuery(event.target.value)} placeholder="e.g. teacher_kay or Joyce Mensah" required value={teacherQuery} /><span className="text-xs font-medium text-slate-500">If several teachers share a name, use the exact username.</span></label>
      <SubjectPicker selected={courseIds} subjects={subjects} onChange={setCourseIds} />
      <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 font-black text-white disabled:opacity-50" disabled={busy || teacherQuery.trim().length < 3 || !courseIds.length}>{busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}Send invitation</button>
    </form>
    <div><h3 className="text-xl font-black">Subject teachers</h3><div className="mt-3 grid gap-3 md:grid-cols-2">
      {subjectTeachers.length ? subjectTeachers.map((member) => <TeamCard busy={busy} key={member.assignmentId} member={member} subjects={subjects} onRevoke={revoke} onSave={(assignmentId, selected) => mutate("PATCH", { assignmentId, courseIds: selected }, "Assigned subjects updated.")} />) : <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-600 md:col-span-2"><ShieldCheck className="mx-auto size-8 text-slate-300" /><p className="mt-2 font-black">No subject teachers yet</p></div>}
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
