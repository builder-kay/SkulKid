"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, BookOpenCheck, CheckCircle2, GraduationCap, Loader2, Save, School, UserRound } from "lucide-react";

type TeacherProfile = {
  displayName: string;
  username: string;
  school: string;
  subjectsTaught: string;
  bio: string;
  qualification: string;
  yearsExperience: number;
  phone: string;
};

const emptyProfile: TeacherProfile = {
  displayName: "", username: "", school: "", subjectsTaught: "", bio: "", qualification: "", yearsExperience: 0, phone: ""
};

export function TeacherProfilePage() {
  const [savedProfile, setSavedProfile] = useState(emptyProfile);
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const changed = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedProfile), [form, savedProfile]);
  const completion = useMemo(() => {
    const fields = [form.displayName, form.username, form.school, form.subjectsTaught, form.bio, form.qualification];
    return Math.round(fields.filter((value) => value.trim().length >= 2).length / fields.length * 100);
  }, [form]);

  useEffect(() => {
    void fetch("/api/teacher/profile", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { profile?: TeacherProfile; error?: string };
        if (!response.ok || !payload.profile) throw new Error(payload.error || "Unable to load your profile.");
        setSavedProfile(payload.profile); setForm(payload.profile);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load your profile."))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof TeacherProfile>(key: K, value: TeacherProfile[K]) {
    setForm((current) => ({ ...current, [key]: value })); setSaved(false); setError("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setSaved(false); setError("");
    try {
      const response = await fetch("/api/teacher/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json() as { profile?: TeacherProfile; error?: string };
      if (!response.ok || !payload.profile) throw new Error(payload.error || "Unable to save your profile.");
      setSavedProfile(payload.profile); setForm(payload.profile); setSaved(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save your profile."); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="grid min-h-[60vh] place-items-center"><Loader2 className="size-8 animate-spin text-blue-700" /></main>;
  return <main className="mx-auto grid w-full max-w-6xl gap-6">
    <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-800 p-6 text-white shadow-xl sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15"><UserRound className="size-7" /></span><div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Your teacher identity</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Teacher profile</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">Keep your school and teaching information accurate so colleagues can find and invite you.</p></div></div><div className="min-w-48 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15"><div className="flex items-center justify-between text-xs font-black"><span>Profile complete</span><span>{completion}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${completion}%` }} /></div></div></div>
    </header>
    {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900" role="alert">{error}</p> : null}
    {saved ? <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-900"><CheckCircle2 className="size-5" />Your profile has been saved.</p> : null}
    <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" onSubmit={submit}>
      <section className="grid gap-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div><h2 className="text-xl font-black text-slate-950">Personal and school details</h2><p className="mt-1 text-sm text-slate-600">These details help teachers at your school identify you.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" icon={UserRound}><input autoComplete="name" maxLength={60} minLength={2} onChange={(event) => update("displayName", event.target.value)} required value={form.displayName} /></Field>
          <Field label="Teacher username" icon={BadgeCheck}><input autoComplete="username" maxLength={20} minLength={3} onChange={(event) => update("username", event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} pattern="[a-z0-9_]{3,20}" placeholder="e.g. teacher_joyce" required value={form.username} /><span className="text-xs text-slate-500">Teachers can use this unique username to invite you.</span></Field>
          <Field label="School or learning centre" icon={School}><input autoComplete="organization" maxLength={100} minLength={2} onChange={(event) => update("school", event.target.value)} required value={form.school} /></Field>
          <Field label="Subjects you teach" icon={BookOpenCheck}><input maxLength={120} minLength={2} onChange={(event) => update("subjectsTaught", event.target.value)} placeholder="e.g. Mathematics and Science" required value={form.subjectsTaught} /></Field>
          <Field label="Qualification" icon={GraduationCap}><input maxLength={120} onChange={(event) => update("qualification", event.target.value)} placeholder="e.g. Diploma in Basic Education" value={form.qualification} /></Field>
          <Field label="Years of teaching experience" icon={BadgeCheck}><input max={60} min={0} onChange={(event) => update("yearsExperience", Number(event.target.value))} type="number" value={form.yearsExperience} /></Field>
        </div>
        <label className="grid gap-2 text-sm font-black text-slate-800">Professional bio<textarea className="min-h-32 rounded-xl border border-slate-300 px-3 py-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" maxLength={500} onChange={(event) => update("bio", event.target.value)} placeholder="Tell colleagues about your teaching interests and approach." value={form.bio} /><span className="text-right text-xs font-medium text-slate-500">{form.bio.length}/500</span></label>
      </section>
      <aside className="grid content-start gap-4">
        <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5"><h2 className="font-black text-blue-950">Account contact</h2><p className="mt-2 text-xs leading-5 text-blue-800">Your verified phone number is used for signing in and account recovery. It cannot be changed from this profile.</p><p className="mt-4 rounded-xl bg-white px-3 py-3 font-black text-slate-900 ring-1 ring-blue-100">{form.phone || "Not available"}</p></div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black">Before saving</h2><ul className="mt-3 grid gap-2 text-sm leading-5 text-slate-600"><li>• Use the same school name as your colleagues.</li><li>• Choose a username you can share easily.</li><li>• Keep professional information accurate.</li></ul></div>
        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 font-black text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50" disabled={saving || !changed} type="submit">{saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}{saving ? "Saving profile…" : "Save profile"}</button>
      </aside>
    </form>
  </main>;
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof UserRound; children: React.ReactNode }) {
  return <label className="grid content-start gap-2 text-sm font-black text-slate-800"><span className="inline-flex items-center gap-2"><Icon className="size-4 text-blue-700" />{label}</span><span className="[&>input]:min-h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-300 [&>input]:px-3 [&>input]:font-medium [&>input]:outline-none [&>input]:focus:border-blue-500 [&>input]:focus:ring-2 [&>input]:focus:ring-blue-100">{children}</span></label>;
}
