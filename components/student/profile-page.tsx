"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Award, BookOpen, Camera, Check, Flame, GraduationCap, Save, School, Sparkles, Star, Trophy, UserRound, Zap } from "lucide-react";
import { StudentShell } from "@/components/student/student-shell";
import { ProgressBar } from "@/components/shared/progress-bar";
import { getStudentLevel } from "@/lib/gamification/calculate-level";
import { useStudentGame } from "@/lib/gamification/student-game";
import { useStudentProfile, type StudentProfileData } from "@/lib/student/student-profile";

export function ProfilePage() {
  const { profile, save } = useStudentProfile();
  const { state, achievements } = useStudentGame();
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const level = getStudentLevel(state.xp);
  useEffect(() => setForm(profile), [profile]);

  const update = <K extends keyof StudentProfileData>(field: K, value: StudentProfileData[K]) => { setForm((current) => ({ ...current, [field]: value })); setSaved(false); };
  function submit(event: React.FormEvent) { event.preventDefault(); save(form); setSaved(true); }
  function upload(event: React.ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file || !file.type.startsWith("image/") || file.size > 2_000_000) return; const reader = new FileReader(); reader.onload = () => update("avatarUrl", String(reader.result)); reader.readAsDataURL(file); }

  return <StudentShell activeItem="profile"><main className="mx-auto grid w-full max-w-7xl gap-6">
    <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-800 via-violet-700 to-fuchsia-700 p-6 text-white shadow-[0_24px_70px_rgba(76,29,149,.22)] sm:p-8"><div className="absolute -right-20 -top-24 size-72 rounded-full bg-cyan-300/20 blur-3xl" /><div className="relative flex flex-col gap-6 sm:flex-row sm:items-center"><Avatar profile={form} size="large" /><div className="min-w-0 flex-1"><p className="text-sm font-black uppercase tracking-wider text-violet-200">Student profile</p><h1 className="mt-1 truncate text-4xl font-black sm:text-5xl">{form.displayName}</h1><p className="mt-2 text-lg text-violet-100">{form.grade} · {level.title}</p><div className="mt-4 flex flex-wrap gap-2"><Pill icon={Trophy} text={`Level ${level.level}`} /><Pill icon={Zap} text={`${state.xp} XP`} /><Pill icon={Flame} text={`${state.streak} day streak`} /></div></div><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 font-black text-violet-800 shadow-sm" onClick={() => fileRef.current?.click()}><Camera className="size-5" />Change photo</button><input accept="image/*" className="sr-only" onChange={upload} ref={fileRef} type="file" /></div></header>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <form className="grid gap-6" onSubmit={submit}>
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6"><SectionTitle icon={UserRound} title="About me" description="The details shown on your student profile." /><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Display name"><input required value={form.displayName} onChange={(event) => update("displayName", event.target.value)} /></Field><Field label="Age"><input max={18} min={5} required type="number" value={form.age} onChange={(event) => update("age", Number(event.target.value))} /></Field><Field label="Grade"><select value={form.grade} onChange={(event) => update("grade", event.target.value)}>{[1,2,3,4,5,6].map((grade) => <option key={grade}>Basic {grade}</option>)}</select></Field><Field label="School"><input placeholder="Enter your school" value={form.school} onChange={(event) => update("school", event.target.value)} /></Field><Field className="sm:col-span-2" label="My learning bio"><textarea maxLength={180} rows={3} value={form.bio} onChange={(event) => update("bio", event.target.value)} /><span className="mt-1 block text-right text-xs text-muted">{form.bio.length}/180</span></Field></div></section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6"><SectionTitle icon={Sparkles} title="Learning preferences" description="Personalise your learning targets and favourite subject." /><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Favourite subject"><select value={form.favouriteSubject} onChange={(event) => update("favouriteSubject", event.target.value as StudentProfileData["favouriteSubject"])}><option>Mathematics</option><option>English</option><option>Science</option></select></Field><Field label="Daily XP goal"><select value={form.dailyGoalXp} onChange={(event) => update("dailyGoalXp", Number(event.target.value))}><option value={30}>30 XP · Light</option><option value={60}>60 XP · Regular</option><option value={100}>100 XP · Champion</option></select></Field></div></section>

        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-black text-white shadow-sm hover:bg-primary-dark" type="submit">{saved ? <Check className="size-5" /> : <Save className="size-5" />}{saved ? "Profile saved" : "Save profile"}</button>
      </form>

      <aside className="grid content-start gap-5 lg:sticky lg:top-8"><section className="rounded-[2rem] border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5"><SectionTitle icon={GraduationCap} title="Learning power" description="Your progress at a glance." /><div className="mt-5"><ProgressBar label="Next level" value={level.progressToNextLevel} /></div><div className="mt-4 grid grid-cols-2 gap-2"><Stat icon={Star} value={state.stars} label="Stars" /><Stat icon={BookOpen} value={state.completedLessonIds.length} label="Lessons" /><Stat icon={Award} value={achievements.filter((item) => item.earned).length} label="Badges" /><Stat icon={Flame} value={state.streak} label="Streak" /></div></section><section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-3"><School className="size-6 text-emerald-700" /><h2 className="font-black">Learner since</h2></div><p className="mt-3 text-2xl font-black text-emerald-900">{new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(form.joinedAt))}</p><p className="mt-1 text-sm text-emerald-800">Keep growing, one lesson at a time.</p></section></aside>
    </div>
  </main></StudentShell>;
}

function Avatar({ profile, size = "small" }: { profile: StudentProfileData; size?: "small" | "large" }) { const classes = size === "large" ? "size-24 text-3xl sm:size-28" : "size-11 text-base"; return <div className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white/80 bg-gradient-to-br from-cyan-300 to-violet-400 font-black text-violet-950 shadow-xl ${classes}`}>{profile.avatarUrl ? <Image alt="Student profile" className="object-cover" fill sizes="112px" src={profile.avatarUrl} unoptimized /> : initials(profile.displayName)}</div>; }
function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) { return <label className={`block text-sm font-black text-text-secondary [&_input]:mt-2 [&_input]:min-h-12 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:px-4 [&_select]:mt-2 [&_select]:min-h-12 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-4 [&_textarea]:mt-2 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:p-4 ${className}`}>{label}{children}</label>; }
function SectionTitle({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) { return <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700"><Icon className="size-5" /></span><div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-sm text-text-secondary">{description}</p></div></div>; }
function Pill({ icon: Icon, text }: { icon: React.ElementType; text: string }) { return <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-black ring-1 ring-white/20"><Icon className="size-4 text-amber-300" />{text}</span>; }
function Stat({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) { return <div className="rounded-xl bg-white p-3 text-center shadow-sm"><Icon className="mx-auto size-4 text-blue-600" /><p className="mt-1 text-xl font-black">{value}</p><p className="text-[10px] font-bold uppercase text-muted">{label}</p></div>; }
function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
