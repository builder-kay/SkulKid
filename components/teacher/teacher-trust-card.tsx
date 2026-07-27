"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, ShieldCheck, ShieldQuestion } from "lucide-react";

type Trust = {
  status: "probation" | "content_trusted" | "legacy_trusted" | "monitored" | "banned";
  cleanLessonCount: number;
  requiredCleanLessons: number;
  monitoringRemaining: number;
};

export function TeacherTrustCard() {
  const [trust, setTrust] = useState<Trust | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void fetch("/api/teacher/trust", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load content trust.");
        setTrust(result.trust);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load content trust."));
  }, []);

  const trusted = trust?.status === "content_trusted" || trust?.status === "legacy_trusted";
  return (
    <section className={`rounded-[1.75rem] border p-5 shadow-sm sm:p-6 ${trusted ? "border-emerald-200 bg-emerald-50" : "border-violet-200 bg-white"}`}>
      <div className="flex items-start gap-4">
        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${trusted ? "bg-emerald-600 text-white" : "bg-violet-100 text-violet-800"}`}>
          {trusted ? <ShieldCheck className="size-6" /> : <ShieldQuestion className="size-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Content safety status</p>
          {!trust && !error ? <Loader2 className="mt-3 size-5 animate-spin text-violet-700" /> : null}
          {error ? <p className="mt-2 text-sm font-bold text-rose-800">{error}</p> : null}
          {trust ? (
            <>
              <h2 className="mt-1 text-xl font-black">{trustLabel(trust.status)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {trust.status === "probation"
                  ? `${trust.cleanLessonCount} of ${trust.requiredCleanLessons} distinct lessons passed safety review.`
                  : trust.status === "monitored"
                    ? `${trust.monitoringRemaining} fully moderated submissions remain before normal sampling resumes.`
                    : "Normal posts use risk-based safety sampling. This is not a professional credential check."}
              </p>
              {trust.status === "probation" ? (
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-violet-100">
                  <div className="h-full rounded-full bg-violet-600" style={{ width: `${Math.min(100, trust.cleanLessonCount / trust.requiredCleanLessons * 100)}%` }} />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      <Link className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-black text-violet-800" href="/teacher/trust">
        Review safety checks and appeals <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}

function trustLabel(status: Trust["status"]) {
  if (status === "content_trusted") return "Content trusted";
  if (status === "legacy_trusted") return "Legacy trusted";
  if (status === "monitored") return "Extra safety checks";
  if (status === "banned") return "Publishing blocked";
  return "Building content trust";
}
