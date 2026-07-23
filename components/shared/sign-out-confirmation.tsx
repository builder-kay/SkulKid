"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, LogOut, ShieldCheck, X } from "lucide-react";

export function SignOutConfirmation({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    cancelButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !signingOut) onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open, signingOut]);

  async function confirmSignOut() {
    setSigningOut(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("We could not sign you out. Please try again.");
      window.location.assign("/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not sign you out.");
      setSigningOut(false);
    }
  }

  if (!open) return null;

  return (
    <div
      aria-labelledby="sign-out-title"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !signingOut) onClose();
      }}
      role="dialog"
    >
      <section className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_30px_100px_rgba(15,23,42,.4)]">
        <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-rose-50 px-5 pb-5 pt-6 text-center sm:px-7 sm:pb-6">
          <div className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 size-36 rounded-full bg-amber-200/50 blur-3xl" />
          <button
            aria-label="Close sign out confirmation"
            className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:rotate-90 hover:bg-white disabled:opacity-50"
            disabled={signingOut}
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
          <div className="relative mx-auto w-fit">
            <span className="grid size-20 place-items-center rounded-[1.6rem] bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_14px_35px_rgba(249,115,22,.3)] ring-8 ring-white">
              <AlertTriangle className="size-10" strokeWidth={2.5} />
            </span>
            <span className="absolute -bottom-1 -right-2 grid size-8 place-items-center rounded-full bg-rose-600 text-white ring-4 ring-white">
              <LogOut className="size-4" strokeWidth={3} />
            </span>
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-orange-700">Before you go</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl" id="sign-out-title">
            Sign out of SkulKid?
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-secondary">
            You’ll return to the login page and will need your phone number and password to come back.
          </p>
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-left">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-black text-emerald-950">
                Your progress is safe <CheckCircle2 className="size-4 text-emerald-600" />
              </p>
              <p className="mt-0.5 text-xs leading-5 text-emerald-800">Your XP, rewards, lessons and avatar are already saved.</p>
            </div>
          </div>
          {error ? <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-100 p-3 text-sm font-bold text-rose-800" role="alert">{error}</p> : null}
        </div>
        <div className="grid gap-3 border-t border-slate-100 bg-white p-4 sm:grid-cols-2 sm:p-5">
          <button
            className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md disabled:opacity-50"
            disabled={signingOut}
            onClick={onClose}
            ref={cancelButtonRef}
            type="button"
          >
            Keep learning
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 px-4 font-black text-white shadow-[0_10px_24px_rgba(225,29,72,.24)] transition hover:-translate-y-0.5 hover:from-rose-700 hover:to-red-700 hover:shadow-lg disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70"
            disabled={signingOut}
            onClick={() => void confirmSignOut()}
            type="button"
          >
            <LogOut className="size-5" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </section>
    </div>
  );
}
