"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, LogOut, Sparkles } from "lucide-react";

export function SignOutConfirmation({
  open,
  onClose,
  audience = "adult"
}: {
  open: boolean;
  onClose: () => void;
  audience?: "student" | "adult";
}) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const signingOutRef = useRef(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSigningOut(false);
    signingOutRef.current = false;
    cancelButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !signingOutRef.current) onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  async function confirmSignOut() {
    signingOutRef.current = true;
    setSigningOut(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error(audience === "student" ? "Hmm, sign out did not work. Please try again." : "Could not sign out. Try again.");
      window.location.assign(audience === "student" ? "/login/student" : "/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : audience === "student" ? "Hmm, sign out did not work. Please try again." : "Could not sign out.");
      signingOutRef.current = false;
      setSigningOut(false);
    }
  }

  if (!open) return null;

  return (
    <div
      aria-labelledby="sign-out-title"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !signingOut) onClose();
      }}
      role="dialog"
    >
      {audience === "student" ? (
        <section className="w-full max-w-md overflow-hidden rounded-[2rem] border border-violet-200 bg-white shadow-[0_24px_70px_rgba(49,46,129,.28)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-violet-700 to-fuchsia-700 px-5 pb-6 pt-5 text-center text-white sm:px-7">
            <div aria-hidden="true" className="absolute -left-6 -top-8 size-28 rounded-full bg-cyan-300/20 blur-2xl" />
            <div aria-hidden="true" className="absolute -bottom-10 -right-6 size-32 rounded-full bg-fuchsia-300/25 blur-2xl" />
            <span className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-white/15 text-3xl shadow-inner ring-1 ring-white/25">
              👋
            </span>
            <p className="relative mt-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-violet-100">
              <Sparkles aria-hidden="true" className="size-4 text-amber-300" />
              Taking a break?
            </p>
            <h2 className="relative mt-1 text-2xl font-black" id="sign-out-title">
              Finished learning for now?
            </h2>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="font-black">Your learning is safe!</p>
                <p className="mt-1 text-sm leading-6 text-emerald-900">
                  We saved your lessons, XP, stars and avatar. Sign in again whenever you are ready to keep learning.
                </p>
              </div>
            </div>
            {error ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              <button
                className="min-h-12 rounded-xl bg-violet-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:opacity-50"
                disabled={signingOut}
                onClick={onClose}
                ref={cancelButtonRef}
                type="button"
              >
                Stay and keep learning
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:opacity-60"
                disabled={signingOut}
                onClick={() => void confirmSignOut()}
                type="button"
              >
                {signingOut ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <LogOut aria-hidden="true" className="size-4" />}
                {signingOut ? "Signing you out…" : "Yes, sign me out"}
              </button>
            </div>
          </div>
        </section>
      ) : (
      <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,.18)] sm:p-6">
        <h2 className="text-lg font-bold text-slate-950" id="sign-out-title">
          Sign out?
        </h2>
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-950">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <p className="text-sm leading-6">
            Your data and progress are saved. Enjoy your break—you can sign back in anytime and resume where you left off.
          </p>
        </div>
        {error ? (
          <p className="mt-3 text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            className="min-h-11 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-50"
            disabled={signingOut}
            onClick={onClose}
            ref={cancelButtonRef}
            type="button"
          >
            Stay
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70"
            disabled={signingOut}
            onClick={() => void confirmSignOut()}
            type="button"
          >
            {signingOut ? <Loader2 className="size-4 animate-spin" /> : null}
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </section>
      )}
    </div>
  );
}
