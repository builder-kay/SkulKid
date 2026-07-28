"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Save, Settings2 } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

type SystemSettings = {
  maintenanceMode: boolean;
  allowTeacherPublishing: boolean;
  requireLessonApproval: boolean;
  signupEnabled: boolean;
  supportEmail: string;
  smsProviderOrder: SmsProvider[];
};

type SmsProvider = "bms" | "clifze" | "arkesel";

const defaults: SystemSettings = {
  maintenanceMode: false,
  allowTeacherPublishing: true,
  requireLessonApproval: true,
  signupEnabled: true,
  supportEmail: "support@skulkid.app",
  smsProviderOrder: ["bms", "clifze", "arkesel"]
};

export default function AdminSystemSettingsPage() {
  const [form, setForm] = useState<SystemSettings>(defaults);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/admin/settings");
        const result = await response.json() as { settings?: SystemSettings; error?: string };
        if (!response.ok) throw new Error(result.error || "Could not load settings.");
        if (active && result.settings) setForm({ ...defaults, ...result.settings });
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load settings.");
      }
    })();
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save settings.");
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  function moveProvider(index: number, direction: -1 | 1) {
    setForm((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.smsProviderOrder.length) return current;
      const smsProviderOrder = [...current.smsProviderOrder];
      [smsProviderOrder[index], smsProviderOrder[nextIndex]] = [smsProviderOrder[nextIndex], smsProviderOrder[index]];
      return { ...current, smsProviderOrder };
    });
    setSaved(false);
  }

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6">
      <header className="rounded-[2rem] border border-white bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Settings2 className="size-5" /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-emerald-700">System settings</p>
            <h1 className="mt-1 text-3xl font-black">Platform configuration</h1>
            <p className="mt-2 text-slate-600">Control operational defaults that affect teachers, learners and publishing.</p>
          </div>
        </div>
      </header>

      <form className="grid gap-4" onSubmit={submit}>
        <SkulKidCard className="grid gap-4 p-5 sm:p-6">
          <Toggle checked={form.maintenanceMode} label="Maintenance mode" onChange={(value) => setForm((current) => ({ ...current, maintenanceMode: value }))} text="Temporarily block learner and teacher access while keeping admin available." />
          <Toggle checked={form.signupEnabled} label="Allow new signups" onChange={(value) => setForm((current) => ({ ...current, signupEnabled: value }))} text="When off, new learner accounts cannot be created." />
          <Toggle checked={form.allowTeacherPublishing} label="Teachers can publish" onChange={(value) => setForm((current) => ({ ...current, allowTeacherPublishing: value }))} text="Allow teachers to publish lessons directly from their workspace." />
          <Toggle checked={form.requireLessonApproval} label="Require admin approval" onChange={(value) => setForm((current) => ({ ...current, requireLessonApproval: value }))} text="Send new or updated lessons through the moderation queue before learners see them." />
          <label className="grid gap-2 text-sm font-black text-slate-700">
            Support email
            <input
              className="min-h-11 rounded-xl border border-slate-300 px-4 text-base font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              onChange={(event) => setForm((current) => ({ ...current, supportEmail: event.target.value }))}
              type="email"
              value={form.supportEmail}
            />
          </label>
        </SkulKidCard>

        <SkulKidCard className="p-5 sm:p-6">
          <h2 className="text-xl font-black">OTP provider priority</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Put the preferred provider first. All configured providers are still contacted because provider acceptance does not guarantee handset delivery.
          </p>
          <ol className="mt-4 grid gap-3">
            {form.smsProviderOrder.map((provider, index) => (
              <li className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3" key={provider}>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-950 font-black text-white">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-black capitalize">{provider === "bms" ? "BMS Africa" : provider}</p>
                  <p className="text-xs font-bold text-slate-500">{index === 0 ? "Primary" : `Fallback ${index}`}</p>
                </div>
                <button aria-label={`Move ${provider} up`} className="grid size-10 place-items-center rounded-xl border border-slate-300 bg-white disabled:opacity-30" disabled={index === 0} onClick={() => moveProvider(index, -1)} type="button"><ArrowUp className="size-4" /></button>
                <button aria-label={`Move ${provider} down`} className="grid size-10 place-items-center rounded-xl border border-slate-300 bg-white disabled:opacity-30" disabled={index === form.smsProviderOrder.length - 1} onClick={() => moveProvider(index, 1)} type="button"><ArrowDown className="size-4" /></button>
              </li>
            ))}
          </ol>
        </SkulKidCard>

        {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">{error}</div> : null}
        {saved ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Settings saved.</div> : null}

        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-black text-white disabled:opacity-60" disabled={busy} type="submit">
          <Save className="size-5" />
          {busy ? "Saving…" : "Save system settings"}
        </button>
      </form>
    </main>
  );
}

function Toggle({
  label,
  text,
  checked,
  onChange
}: {
  label: string;
  text: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
      <span>
        <span className="block font-black text-slate-950">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{text}</span>
      </span>
      <input checked={checked} className="mt-1 size-5 accent-emerald-600" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}
