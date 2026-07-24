"use client";

import { useEffect, useState } from "react";
import { BookOpen, ShieldCheck, Users, FileWarning } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

type OverviewData = {
  students: number;
  teachers: number;
  admins: number;
  courses: number;
  publishedLessons: number;
  draftLessons: number;
  flaggedLessons: number;
};

const empty: OverviewData = {
  students: 0,
  teachers: 0,
  admins: 0,
  courses: 0,
  publishedLessons: 0,
  draftLessons: 0,
  flaggedLessons: 0
};

export function PlatformAdminOverview() {
  const [data, setData] = useState<OverviewData>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/admin/overview");
        const result = await response.json() as OverviewData & { error?: string };
        if (!response.ok) throw new Error(result.error || "Failed to load overview.");
        if (active) setData(result);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Failed to load overview.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Users} label="Learners" value={loading ? "…" : String(data.students)} detail={`${loading ? "…" : data.teachers} teachers · ${loading ? "…" : data.admins} admins`} />
      <Metric icon={BookOpen} label="Subjects" value={loading ? "…" : String(data.courses)} detail="Teacher-managed learning paths" />
      <Metric icon={ShieldCheck} label="Published lessons" value={loading ? "…" : String(data.publishedLessons)} detail={`${loading ? "…" : data.draftLessons} drafts in progress`} />
      <Metric icon={FileWarning} label="Needs moderation" value={loading ? "…" : String(data.flaggedLessons)} detail={error || "Drafts waiting for review"} tone={data.flaggedLessons > 0 ? "warn" : "ok"} />
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone = "ok"
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  tone?: "ok" | "warn";
}) {
  return (
    <SkulKidCard className={`p-5 ${tone === "warn" ? "border-amber-200 bg-amber-50" : ""}`}>
      <div className="flex items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-xl ${tone === "warn" ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}>
          <Icon className="size-5" />
        </span>
        <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </SkulKidCard>
  );
}
