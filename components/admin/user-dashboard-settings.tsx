"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, Palette, RotateCcw, Save, Settings2 } from "lucide-react";
import { Checkbox, Input, Select } from "@/components/design-system/form-controls";
import { SkulKidButton } from "@/components/shared/skulkid-button";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import { deleteAdminSetting, readAdminSetting, writeAdminSetting } from "@/lib/admin/settings";

type DashboardSettings = {
  showXp: boolean;
  showStars: boolean;
  showStreak: boolean;
  showDailyGoal: boolean;
  showRecommendations: boolean;
  celebrateMastery: boolean;
  dailyGoalXp: number;
  defaultSubject: "mathematics" | "english-language" | "science";
  courseCardDensity: "comfortable" | "compact";
};

const defaults: DashboardSettings = {
  showXp: true, showStars: true, showStreak: true, showDailyGoal: true,
  showRecommendations: true, celebrateMastery: true, dailyGoalXp: 60,
  defaultSubject: "mathematics", courseCardDensity: "comfortable"
};

const settingsKey = "student-dashboard";

export function UserDashboardSettings() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void readAdminSetting<Partial<DashboardSettings>>(settingsKey).then((stored) => {
      if (stored) setSettings({ ...defaults, ...stored });
    });
  }, []);

  function update<K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value })); setSaved(false);
  }

  async function save() { await writeAdminSetting(settingsKey, settings); setSaved(true); }
  async function reset() { setSettings(defaults); await deleteAdminSetting(settingsKey); setSaved(false); }

  return <main className="mx-auto w-full max-w-6xl">
    <header className="rounded-[2rem] border border-white bg-white p-6 shadow-[var(--shadow-card)] sm:p-8"><div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Settings2 className="size-6" aria-hidden="true" /></span><div><p className="text-sm font-black uppercase tracking-wide text-violet-700">Student experience</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">User Dashboard Settings</h1><p className="mt-3 max-w-3xl text-lg leading-8 text-text-secondary">Choose which progress, reward and recommendation features pupils see on their dashboard.</p></div></div></header>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_21rem]">
      <div className="space-y-6"><SkulKidCard className="p-6"><h2 className="text-xl font-black">Dashboard sections</h2><p className="mt-1 text-sm text-muted">Turn modules on or off without removing the underlying learning records.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><Toggle label="XP and level" description="Show total XP and level progress." checked={settings.showXp} onChange={(value) => update("showXp", value)} /><Toggle label="Stars" description="Show stars earned from lessons." checked={settings.showStars} onChange={(value) => update("showStars", value)} /><Toggle label="Learning streak" description="Show supportive activity streaks." checked={settings.showStreak} onChange={(value) => update("showStreak", value)} /><Toggle label="Daily goal" description="Show progress toward the daily XP goal." checked={settings.showDailyGoal} onChange={(value) => update("showDailyGoal", value)} /><Toggle label="Recommendations" description="Show next lessons and revision suggestions." checked={settings.showRecommendations} onChange={(value) => update("showRecommendations", value)} /><Toggle label="Mastery celebrations" description="Show milestone celebrations for mastery." checked={settings.celebrateMastery} onChange={(value) => update("celebrateMastery", value)} /></div></SkulKidCard>
        <SkulKidCard className="p-6"><h2 className="text-xl font-black">Learning defaults</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Daily XP goal<Input type="number" min={10} max={500} step={10} value={settings.dailyGoalXp} onChange={(event) => update("dailyGoalXp", Number(event.target.value))} /></label><label className="grid gap-2 text-sm font-bold">Default subject<Select value={settings.defaultSubject} onChange={(event) => update("defaultSubject", event.target.value as DashboardSettings["defaultSubject"])}><option value="mathematics">Mathematics</option><option value="english-language">English Language</option><option value="science">Science</option></Select></label><label className="grid gap-2 text-sm font-bold">Course-card spacing<Select value={settings.courseCardDensity} onChange={(event) => update("courseCardDensity", event.target.value as DashboardSettings["courseCardDensity"])}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></Select></label></div></SkulKidCard>
        <div className="flex flex-wrap gap-3"><SkulKidButton type="button" size="lg" onClick={save}><Save className="size-5" />Save settings</SkulKidButton><SkulKidButton type="button" size="lg" variant="outline" onClick={reset}><RotateCcw className="size-5" />Restore defaults</SkulKidButton>{saved ? <span role="status" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-green-100 px-4 font-bold text-green-900"><CheckCircle2 className="size-5" />Saved to Supabase</span> : null}</div>
      </div>

      <aside className="space-y-5"><SkulKidCard className="p-5"><div className="flex items-center gap-2"><Eye className="size-5 text-violet-700" /><h2 className="font-black">Visible modules</h2></div><ul className="mt-4 space-y-2 text-sm">{[[settings.showXp, "XP and level"], [settings.showStars, "Stars"], [settings.showStreak, "Learning streak"], [settings.showDailyGoal, `Daily goal: ${settings.dailyGoalXp} XP`], [settings.showRecommendations, "Recommendations"]].filter(([visible]) => visible).map(([, label]) => <li key={String(label)} className="rounded-xl bg-slate-50 p-3 font-bold">{String(label)}</li>)}</ul></SkulKidCard><Link href="/dashboard" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 font-bold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"><Eye className="size-5" />Preview user dashboard</Link><Link href="/preview/design-system" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Palette className="size-4" />Internal design-system preview</Link></aside>
    </div>
  </main>;
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 ${checked ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-slate-50"}`}><Checkbox checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={label} /><span><span className="block font-bold">{label}</span><span className="mt-1 block text-sm leading-5 text-text-secondary">{description}</span></span></label>; }
