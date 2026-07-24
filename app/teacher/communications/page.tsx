"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, Loader2, Mail, Send, Users } from "lucide-react";

type MessagingData = {
  classes: Array<{ id: string; name: string; students: Array<{ id: string; name: string }> }>;
  messages: Array<{ id: string; classId: string; className: string; studentId: string; studentName: string; body: string; createdAt: string; readAt: string | null }>;
};

export default function TeacherCommunicationsPage() {
  const [data, setData] = useState<MessagingData>({ classes: [], messages: [] });
  const [audience, setAudience] = useState<"all" | "class" | "selected" | "student">("class");
  const [classId, setClassId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/teacher/communications", { cache: "no-store" });
    const payload = await response.json() as MessagingData & { error?: string };
    if (!response.ok) throw new Error(payload.error || "Unable to load communications.");
    setData(payload);
    setClassId((current) => current || payload.classes[0]?.id || "");
    setLoading(false);
  }
  useEffect(() => { void load().catch((cause) => { setError(cause instanceof Error ? cause.message : "Unable to load communications."); setLoading(false); }); }, []);

  const allStudents = useMemo(() => {
    const map = new Map<string, { id: string; name: string; classes: string[] }>();
    for (const classroom of data.classes) for (const student of classroom.students) {
      const existing = map.get(student.id);
      if (existing) existing.classes.push(classroom.name);
      else map.set(student.id, { ...student, classes: [classroom.name] });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [data.classes]);

  async function sendNotification(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/teacher/communications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, classId: audience === "class" ? classId : undefined, studentIds: audience === "selected" || audience === "student" ? selected : undefined, title, body })
      });
      const payload = await response.json() as { error?: string; recipientCount?: number };
      if (!response.ok) throw new Error(payload.error || "Unable to send notification.");
      setSuccess(`Notification sent to ${payload.recipientCount} student${payload.recipientCount === 1 ? "" : "s"}.`);
      setTitle(""); setBody(""); setSelected([]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to send notification."); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto grid w-full max-w-7xl gap-6">
    <header className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8"><p className="text-xs font-black uppercase tracking-wider text-violet-300">Teacher communications</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Messages & notifications</h1><p className="mt-3 max-w-2xl text-slate-300">Read messages from students and send targeted notices to the right learners.</p></header>
    {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900">{error}</p> : null}{success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-900">{success}</p> : null}
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_1fr]">
      <form className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" onSubmit={sendNotification}>
        <h2 className="flex items-center gap-2 text-xl font-black"><BellRing className="size-5 text-violet-700" />Send a notification</h2>
        <label className="mt-4 grid gap-1.5 text-sm font-bold">Audience<select className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => { setAudience(event.target.value as typeof audience); setSelected([]); }} value={audience}><option value="all">All my students</option><option value="class">A particular class</option><option value="selected">A selected set of students</option><option value="student">One student</option></select></label>
        {audience === "class" ? <label className="mt-3 grid gap-1.5 text-sm font-bold">Class<select className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setClassId(event.target.value)} required value={classId}>{data.classes.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.students.length})</option>)}</select></label> : null}
        {audience === "selected" || audience === "student" ? <fieldset className="mt-3"><legend className="text-sm font-bold">{audience === "student" ? "Choose one student" : "Choose students"}</legend><div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">{allStudents.map((student) => <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50" key={student.id}><input checked={selected.includes(student.id)} name="notification-students" onChange={() => setSelected((current) => audience === "student" ? [student.id] : current.includes(student.id) ? current.filter((id) => id !== student.id) : [...current, student.id])} type={audience === "student" ? "radio" : "checkbox"} /><span><b className="block text-sm">{student.name}</b><span className="text-xs text-slate-500">{student.classes.join(", ")}</span></span></label>)}</div></fieldset> : null}
        <label className="mt-3 grid gap-1.5 text-sm font-bold">Title<input className="min-h-11 rounded-xl border border-slate-300 px-3" maxLength={120} minLength={2} onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
        <label className="mt-3 grid gap-1.5 text-sm font-bold">Message<textarea className="min-h-32 rounded-xl border border-slate-300 px-3 py-2" maxLength={1000} minLength={2} onChange={(event) => setBody(event.target.value)} required value={body} /></label>
        <button className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 font-black text-white disabled:opacity-50" disabled={busy || loading} type="submit">{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Send notification</button>
      </form>
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-xl font-black"><Mail className="size-5 text-teal-700" />Student inbox</h2><p className="mt-1 text-sm text-slate-600">Messages sent directly by students in your classes.</p><div className="mt-4 grid gap-3">{loading ? <p className="text-sm text-slate-500">Loading messages…</p> : data.messages.length === 0 ? <div className="rounded-xl bg-slate-50 p-6 text-center"><Users className="mx-auto size-8 text-slate-400" /><p className="mt-2 font-bold">No student messages yet</p></div> : data.messages.map((message) => <article className="rounded-xl border border-slate-200 p-4" key={message.id}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black">{message.studentName}</h3><span className="text-xs font-bold text-slate-500">{message.className}</span></div><p className="mt-2 text-sm leading-6 text-slate-700">{message.body}</p><time className="mt-2 block text-xs text-slate-500">{new Date(message.createdAt).toLocaleString()}</time><button className="mt-3 text-xs font-black text-violet-700" onClick={() => { setAudience("student"); setSelected([message.studentId]); setTitle(`Reply to ${message.studentName}`); }} type="button">Send a notification reply</button></article>)}</div></section>
    </div>
  </main>;
}
