"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileWarning, Globe2, Users } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

type OverviewData = {
  students: number;
  teachers: number;
  admins: number;
  courses: number;
  publishedLessons: number;
  draftLessons: number;
  publishedPublicCourses: number;
  pendingPublicReviews: number;
};

const empty: OverviewData = {
  students: 0,
  teachers: 0,
  admins: 0,
  courses: 0,
  publishedLessons: 0,
  draftLessons: 0,
  publishedPublicCourses: 0,
  pendingPublicReviews: 0
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

  const waiting = loading ? "…" : String(data.pendingPublicReviews);
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Users} label="Learners" value={loading ? "…" : String(data.students)} detail={`${loading ? "…" : data.teachers} teachers · ${loading ? "…" : data.admins} admins`} />
      <Metric icon={BookOpen} label="Courses" value={loading ? "…" : String(data.courses)} detail={`${loading ? "…" : data.publishedLessons} lessons ready`} />
      <Metric icon={Globe2} label="Public Learning" value={loading ? "…" : String(data.publishedPublicCourses)} detail={`${loading ? "…" : data.draftLessons} lesson drafts in progress`} />
      <Metric icon={FileWarning} label="Needs review" value={waiting} detail={error || "Explicit Public Learning submissions"} tone={data.pendingPublicReviews > 0 ? "warn" : "ok"} />
    </section>
  );
}

function Metric({ icon: Icon, label, value, detail, tone = "ok" }: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  tone?: "ok" | "warn";
}) {
  return (
    <SkulKidCard className={`p-5 ${tone === "warn" ? "border-amber-200 bg-amber-50" : ""}`}>
      <div className="flex items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-xl ${tone === "warn" ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}><Icon className="size-5" /></span>
        <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </SkulKidCard>
  );
}
