"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Settings2, ShieldCheck } from "lucide-react";
import { UserDashboardSettings } from "@/components/admin/user-dashboard-settings";
import { TeacherClassChatSafety } from "@/components/teacher/teacher-class-chat-safety";
import { cn } from "@/lib/utils";

type SettingsSection = "learner-experience" | "class-chat-safety";

const sections = [
  {
    id: "learner-experience" as const,
    label: "Learner experience",
    description: "Dashboard, goals and learning defaults",
    icon: LayoutDashboard
  },
  {
    id: "class-chat-safety" as const,
    label: "Class chat safety",
    description: "Room controls, reports and consent",
    icon: ShieldCheck
  }
];

export function TeacherSettingsWorkspace() {
  const [section, setSection] = useState<SettingsSection>("learner-experience");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("section");
    if (requested === "class-chat-safety") setSection(requested);
  }, []);

  function selectSection(next: SettingsSection) {
    setSection(next);
    const url = new URL(window.location.href);
    if (next === "learner-experience") url.searchParams.delete("section");
    else url.searchParams.set("section", next);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="mx-auto grid w-full max-w-[100rem] gap-5">
      <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-800 p-6 text-white shadow-xl sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15"><Settings2 className="size-6" /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Teacher workspace</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Settings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/80 sm:text-base">Manage the learner experience and supervised class communication from one organised workspace.</p>
          </div>
        </div>
      </header>

      <a
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-violet-950"
        href="/feedback/teacher"
      >
        <span>
          <b className="block text-sm">Help improve SkulKid</b>
          <span className="text-xs font-bold text-violet-800/80">Share the teacher research questionnaire — confidential, no name required.</span>
        </span>
        <span className="text-sm font-black text-violet-800">Open Form B →</span>
      </a>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <nav aria-label="Teacher settings sections" className="min-w-0 lg:sticky lg:top-5 lg:self-start">
          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:grid lg:overflow-visible">
            {sections.map(({ id, label, description, icon: Icon }) => {
              const active = section === id;
              return (
                <button
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-w-[13rem] items-center gap-3 rounded-xl px-3 py-3 text-left transition lg:min-w-0",
                    active ? "bg-blue-700 text-white shadow-md" : "text-slate-700 hover:bg-slate-100"
                  )}
                  key={id}
                  onClick={() => selectSection(id)}
                  type="button"
                >
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", active ? "bg-white/15" : "bg-blue-50 text-blue-700")}><Icon className="size-5" /></span>
                  <span className="min-w-0">
                    <b className="block text-sm">{label}</b>
                    <span className={cn("mt-0.5 block text-[11px] leading-4", active ? "text-blue-100" : "text-slate-500")}>{description}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 hidden px-3 text-xs leading-5 text-slate-500 lg:block">Choose a category. Changes and operational controls remain separated so each task stays easy to understand.</p>
        </nav>

        <section aria-live="polite" className="min-w-0">
          {section === "learner-experience" ? <UserDashboardSettings /> : <TeacherClassChatSafety />}
        </section>
      </div>
    </main>
  );
}
