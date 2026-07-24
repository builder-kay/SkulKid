"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";

export function JoinClassPage({ code }: { code: string }) {
  const [preview, setPreview] = useState<{ id: string; name: string; description: string; gradeLevel: number; teacherName: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`/api/student/classes/join?code=${encodeURIComponent(code)}`, { cache: "no-store" });
        const payload = await response.json() as { classroom?: typeof preview; error?: string };
        if (!response.ok) throw new Error(payload.error || "Invalid join link.");
        setPreview(payload.classroom ?? null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Invalid join link.");
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  async function join() {
    setJoining(true);
    setError("");
    try {
      const response = await fetch("/api/student/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const payload = await response.json() as { classroom?: { id: string }; error?: string };
      if (response.status === 401) {
        window.location.href = `/login/student?next=${encodeURIComponent(`/join/${code}`)}`;
        return;
      }
      if (!response.ok) throw new Error(payload.error || "Unable to join class.");
      window.location.href = `/classes/${payload.classroom?.id}`;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to join class.");
      setJoining(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 p-4 sm:grid sm:place-items-center">
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-blue-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 size-80 rounded-full bg-violet-200/50 blur-3xl" />
      <section className="relative mx-auto w-full max-w-lg rounded-[2rem] border border-white bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,.14)] sm:p-8">
        <Link className="inline-flex rounded-xl bg-slate-50 px-2.5 py-1.5" href="/"><SkulKidLogo className="w-28" priority /></Link>
        <h1 className="mt-5 text-3xl font-black text-slate-950">Join a class</h1>
        {loading ? (
          <div className="mt-8 grid place-items-center text-slate-500"><Loader2 className="size-7 animate-spin" /></div>
        ) : preview ? (
          <>
            <p className="mt-2 text-sm text-slate-600">Your teacher invited you to join this SkulKid class.</p>
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-blue-700">Class invite</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">{preview.name}</h2>
              <p className="mt-1 text-sm text-slate-600">Teacher {preview.teacherName} · Basic {preview.gradeLevel}</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{preview.description || "Join to unlock class quizzes, subjects and teacher advice."}</p>
            </div>
            <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-black text-white disabled:opacity-60" disabled={joining} onClick={() => void join()} type="button">
              {joining ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
              Join this class
            </button>
            <p className="mt-3 text-center text-sm text-slate-500">Students only. Teachers should open the teacher workspace instead.</p>
          </>
        ) : (
          <p className="mt-4 text-sm font-bold text-amber-800">{error || "This join link is not valid."}</p>
        )}
        {error && preview ? <p className="mt-3 text-sm font-bold text-amber-800">{error}</p> : null}
      </section>
    </main>
  );
}
