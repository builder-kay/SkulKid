"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Flame, LayoutDashboard, Loader2, Medal, RotateCcw, Save, Settings2, Sparkles, Star, Trophy } from "lucide-react";
import { Input, Select } from "@/components/design-system/form-controls";
import { deleteAdminSetting, readAdminSetting, writeAdminSetting } from "@/lib/admin/settings";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type DashboardSettings = {
  showXp: boolean; showStars: boolean; showStreak: boolean; showDailyGoal: boolean;
  showRecommendations: boolean; celebrateMastery: boolean; dailyGoalXp: number;
  defaultSubject: "mathematics" | "english-language" | "science";
  courseCardDensity: "comfortable" | "compact";
};

const defaults: DashboardSettings = {
  showXp: true, showStars: true, showStreak: true, showDailyGoal: true,
  showRecommendations: true, celebrateMastery: true, dailyGoalXp: 60,
  defaultSubject: "mathematics", courseCardDensity: "comfortable"
};

const presets = {
  balanced: defaults,
  focused: { ...defaults, showStreak: false, showRecommendations: false, celebrateMastery: false, courseCardDensity: "compact" as const },
  celebratory: { ...defaults, dailyGoalXp: 40, showXp: true, showStars: true, showStreak: true, celebrateMastery: true }
};

export function UserDashboardSettings() {
  const [settings, setSettings] = useState(defaults);
  const [savedSettings, setSavedSettings] = useState(defaults);
  const [settingsKey, setSettingsKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const dirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  useEffect(() => {
    void (async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Authentication required.");
        const key = `teacher-dashboard-${user.id}`;
        setSettingsKey(key);
        const stored = await readAdminSetting<Partial<DashboardSettings>>(key);
        const resolved = { ...defaults, ...(stored ?? {}) };
        setSettings(resolved);
        setSavedSettings(resolved);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Settings could not be loaded.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update<K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setNotice("");
  }

  async function save() {
    if (!settingsKey) return;
    if (settings.dailyGoalXp < 10 || settings.dailyGoalXp > 500) {
      setError("Daily XP goal must be between 10 and 500.");
      return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      await writeAdminSetting(settingsKey, settings);
      setSavedSettings(settings);
      setNotice("Teacher settings saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!settingsKey) return;
    setSaving(true); setError("");
    try {
      await deleteAdminSetting(settingsKey);
      setSettings(defaults);
      setSavedSettings(defaults);
      setNotice("Default settings restored.");
      setConfirmReset(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Defaults could not be restored.");
    } finally {
      setSaving(false);
    }
  }

  const visibleCount = useMemo(() => [
    settings.showXp, settings.showStars, settings.showStreak,
    settings.showDailyGoal, settings.showRecommendations
  ].filter(Boolean).length, [settings]);

  if (loading) return <div className="grid min-h-96 place-items-center"><Loader2 className="size-7 animate-spin text-violet-700" /></div>;

  return <main className="mx-auto grid w-full max-w-7xl gap-6">
    <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-violet-950 to-blue-900 p-6 text-white shadow-xl sm:p-8">
      <div className="absolute -right-16 -top-20 size-64 rounded-full bg-violet-500/25 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-violet-300"><Settings2 className="size-4" />Teacher settings</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Learner experience</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Choose the progress features and learning defaults you want to use in your teaching workspace.</p></div>
        <div className="grid grid-cols-2 gap-2"><Metric value={visibleCount} label="Visible sections" /><Metric value={`${settings.dailyGoalXp}`} label="Daily XP goal" /></div>
      </div>
    </header>

    {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900" role="alert">{error}</p> : null}
    {notice ? <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-900" role="status"><CheckCircle2 className="size-5" />{notice}</p> : null}

    <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-black text-violet-950">Quick setup</h2><p className="mt-1 text-xs text-violet-800">Start with a preset, then adjust any option below.</p></div><div className="flex flex-wrap gap-2">{Object.entries(presets).map(([name, preset]) => <button className="min-h-10 rounded-xl border border-violet-200 bg-white px-4 text-sm font-black capitalize text-violet-800 hover:border-violet-500" key={name} onClick={() => { setSettings(preset); setNotice(""); }} type="button">{name}</button>)}</div></div>
    </section>

    <div className="grid items-start gap-6 xl:grid-cols-[1fr_24rem]">
      <div className="grid gap-6">
        <SettingsCard icon={LayoutDashboard} title="Dashboard sections" text="Hide visual sections without deleting learner progress.">
          <div className="grid gap-3 sm:grid-cols-2"><Toggle label="XP and level" description="Show total XP and level progress." checked={settings.showXp} onChange={(value) => update("showXp", value)} /><Toggle label="Stars" description="Show stars earned from learning activities." checked={settings.showStars} onChange={(value) => update("showStars", value)} /><Toggle label="Learning streak" description="Encourage a regular learning rhythm." checked={settings.showStreak} onChange={(value) => update("showStreak", value)} /><Toggle label="Daily goal" description="Show progress towards a daily XP target." checked={settings.showDailyGoal} onChange={(value) => update("showDailyGoal", value)} /><Toggle label="Recommendations" description="Suggest the next useful learning activity." checked={settings.showRecommendations} onChange={(value) => update("showRecommendations", value)} /><Toggle label="Mastery celebrations" description="Celebrate important learning milestones." checked={settings.celebrateMastery} onChange={(value) => update("celebrateMastery", value)} /></div>
        </SettingsCard>
        <SettingsCard icon={Sparkles} title="Learning defaults" text="Set the starting experience while allowing learners to explore other subjects.">
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-black">Daily XP goal<Input type="number" min={10} max={500} step={10} value={settings.dailyGoalXp} onChange={(event) => update("dailyGoalXp", Number(event.target.value))} /><span className="text-xs font-normal text-slate-500">Between 10 and 500 XP.</span></label><label className="grid gap-2 text-sm font-black">Default subject<Select value={settings.defaultSubject} onChange={(event) => update("defaultSubject", event.target.value as DashboardSettings["defaultSubject"])}><option value="mathematics">Mathematics</option><option value="english-language">English Language</option><option value="science">Science</option></Select></label><label className="grid gap-2 text-sm font-black">Subject-card spacing<Select value={settings.courseCardDensity} onChange={(event) => update("courseCardDensity", event.target.value as DashboardSettings["courseCardDensity"])}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></Select></label></div>
        </SettingsCard>
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
          <button className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-violet-700 px-5 font-black text-white disabled:opacity-50" disabled={!dirty || saving} onClick={() => void save()} type="button">{saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}Save changes</button>
          <button className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 px-5 font-black text-slate-700 disabled:opacity-50" disabled={saving} onClick={() => setConfirmReset(true)} type="button"><RotateCcw className="size-5" />Restore defaults</button>
          <span className={cn("ml-auto text-xs font-black", dirty ? "text-amber-700" : "text-emerald-700")}>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        </div>
      </div>

      <aside className="xl:sticky xl:top-8">
        <div className="overflow-hidden rounded-[1.75rem] border-8 border-slate-900 bg-slate-100 shadow-2xl">
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-3 text-white"><Eye className="size-4" /><h2 className="text-sm font-black">Dashboard preview</h2></div>
          <div className="p-4"><div className="rounded-2xl bg-gradient-to-br from-violet-700 to-blue-700 p-4 text-white"><p className="text-xs font-bold text-violet-200">Welcome back</p><h3 className="mt-1 text-xl font-black">Ready to learn?</h3></div><div className={cn("mt-3 grid gap-2", settings.courseCardDensity === "compact" ? "grid-cols-2" : "grid-cols-1")}>{settings.showXp ? <PreviewItem icon={Medal} label="XP and level" value="1,240 XP" /> : null}{settings.showStars ? <PreviewItem icon={Star} label="Stars" value="18 earned" /> : null}{settings.showStreak ? <PreviewItem icon={Flame} label="Learning streak" value="4 days" /> : null}{settings.showDailyGoal ? <PreviewItem icon={Trophy} label="Daily goal" value={`25 / ${settings.dailyGoalXp} XP`} /> : null}{settings.showRecommendations ? <div className="rounded-xl border border-blue-200 bg-blue-50 p-3"><b className="text-sm">Recommended next</b><p className="mt-1 text-xs text-slate-600">{subjectName(settings.defaultSubject)} practice</p></div> : null}</div>{visibleCount === 0 ? <p className="rounded-xl bg-amber-50 p-4 text-center text-sm font-bold text-amber-900">The dashboard would have no progress sections.</p> : null}</div>
        </div>
      </aside>
    </div>

    {confirmReset ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h2 className="text-xl font-black">Restore default settings?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Your saved teacher preferences will be replaced by the recommended defaults.</p><div className="mt-5 flex justify-end gap-2"><button className="min-h-11 rounded-xl border px-4 font-black" onClick={() => setConfirmReset(false)} type="button">Cancel</button><button className="min-h-11 rounded-xl bg-rose-600 px-4 font-black text-white" onClick={() => void reset()} type="button">Restore defaults</button></div></div></div> : null}
  </main>;
}

function SettingsCard({ icon: Icon, title, text, children }: { icon: typeof Settings2; title: string; text: string; children: React.ReactNode }) { return <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700"><Icon className="size-5" /></span><div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-600">{text}</p></div></div><div className="mt-5">{children}</div></section>; }
function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) { return <button aria-pressed={checked} className={cn("flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition", checked ? "border-violet-400 bg-violet-50 ring-1 ring-violet-300" : "border-slate-200 bg-slate-50")} onClick={() => onChange(!checked)} type="button"><span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border", checked ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white")}>{checked ? <CheckCircle2 className="size-4" /> : null}</span><span><b className="block">{label}</b><span className="mt-1 block text-sm leading-5 text-slate-600">{description}</span></span></button>; }
function Metric({ value, label }: { value: string | number; label: string }) { return <div className="rounded-xl bg-white/10 px-4 py-3 text-center ring-1 ring-white/15"><b className="block text-xl">{value}</b><span className="text-[10px] font-black uppercase tracking-wider text-slate-300">{label}</span></div>; }
function PreviewItem({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"><span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700"><Icon className="size-4" /></span><span><b className="block text-sm">{label}</b><span className="text-xs text-slate-500">{value}</span></span></div>; }
function subjectName(subject: DashboardSettings["defaultSubject"]) { return subject === "english-language" ? "English Language" : subject[0].toUpperCase() + subject.slice(1); }
