"use client";

import { useEffect, useRef, useState } from "react";
import {
  Backpack,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  X
} from "lucide-react";

export function SignOutConfirmation({
  open,
  onClose,
  audience = "adult"
}: {
  open: boolean;
  onClose: () => void;
  audience?: "student" | "adult";
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const signingOutRef = useRef(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSigningOut(false);
    signingOutRef.current = false;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => cancelButtonRef.current?.focus(), 20);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !signingOutRef.current) {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])"
      )];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  async function confirmSignOut() {
    signingOutRef.current = true;
    setSigningOut(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error(audience === "student"
          ? "Oops! We could not sign you out. Please try one more time."
          : "Could not sign out. Try again.");
      }
      window.location.assign(audience === "student" ? "/login/student" : "/login");
    } catch (cause) {
      setError(cause instanceof Error
        ? cause.message
        : audience === "student"
          ? "Oops! We could not sign you out. Please try one more time."
          : "Could not sign out.");
      signingOutRef.current = false;
      setSigningOut(false);
    }
  }

  if (!open) return null;

  return (
    <div
      aria-labelledby="sign-out-title"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !signingOut) onClose();
      }}
      ref={dialogRef}
      role="dialog"
    >
      {audience === "student" ? (
        <StudentSignOutDialog
          cancelButtonRef={cancelButtonRef}
          error={error}
          onClose={onClose}
          onConfirm={() => void confirmSignOut()}
          signingOut={signingOut}
        />
      ) : (
        <AdultSignOutDialog
          cancelButtonRef={cancelButtonRef}
          error={error}
          onClose={onClose}
          onConfirm={() => void confirmSignOut()}
          signingOut={signingOut}
        />
      )}
    </div>
  );
}

function StudentSignOutDialog({
  cancelButtonRef,
  error,
  onClose,
  onConfirm,
  signingOut
}: {
  cancelButtonRef: React.RefObject<HTMLButtonElement | null>;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
  signingOut: boolean;
}) {
  return (
    <section className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-violet-200 bg-white shadow-[0_28px_80px_rgba(49,46,129,.32)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-violet-700 to-fuchsia-700 px-5 pb-7 pt-5 text-center text-white sm:px-8">
        <div aria-hidden="true" className="absolute -left-8 -top-12 size-40 rounded-full bg-cyan-300/25 blur-2xl" />
        <div aria-hidden="true" className="absolute -bottom-16 -right-6 size-44 rounded-full bg-fuchsia-300/30 blur-2xl" />
        <div aria-hidden="true" className="absolute left-8 top-8 text-amber-300">
          <Star className="size-5 rotate-12 fill-current" />
        </div>
        <div aria-hidden="true" className="absolute right-10 top-16 text-cyan-200">
          <Sparkles className="size-6 -rotate-12" />
        </div>

        <button
          aria-label="Close sign out message"
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
          disabled={signingOut}
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        <span className="relative mx-auto grid size-20 place-items-center rounded-[1.65rem] bg-white text-violet-700 shadow-[0_14px_30px_rgba(30,41,59,.25)] ring-4 ring-white/25">
          <Backpack aria-hidden="true" className="size-10" strokeWidth={2.4} />
          <span aria-hidden="true" className="absolute -bottom-2 -right-2 grid size-8 place-items-center rounded-full bg-amber-300 text-amber-950 ring-4 ring-violet-700">
            <Sparkles className="size-4" />
          </span>
        </span>
        <p className="relative mt-4 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
          Time for a break?
        </p>
        <h2 className="relative mt-1 text-2xl font-black sm:text-3xl" id="sign-out-title">
          Ready to leave SkulKid for now?
        </h2>
        <p className="relative mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-violet-100">
          That is okay! Everything you earned will be waiting for you.
        </p>
      </div>

      <div className="p-5 sm:p-7">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3 text-emerald-950">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-black">Your progress is safe</p>
              <p className="text-sm text-emerald-900">Signing out will not erase your work.</p>
            </div>
          </div>
          <ul className="mt-4 grid gap-2 text-sm font-bold text-emerald-950 sm:grid-cols-2">
            <li className="flex items-center gap-2 rounded-xl bg-white/75 px-3 py-2">
              <Star aria-hidden="true" className="size-4 shrink-0 fill-amber-400 text-amber-500" />
              Your XP and stars stay
            </li>
            <li className="flex items-center gap-2 rounded-xl bg-white/75 px-3 py-2">
              <Rocket aria-hidden="true" className="size-4 shrink-0 text-violet-600" />
              Your lessons stay saved
            </li>
          </ul>
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-3.5 text-sky-950">
          <KeyRound aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sky-700" />
          <p className="text-sm leading-6">
            To come back later, sign in again with your <strong>username and password</strong>.
          </p>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:opacity-50"
            disabled={signingOut}
            onClick={onClose}
            ref={cancelButtonRef}
            type="button"
          >
            <Rocket aria-hidden="true" className="size-4" />
            Keep learning
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:opacity-60"
            disabled={signingOut}
            onClick={onConfirm}
            type="button"
          >
            {signingOut ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <LogOut aria-hidden="true" className="size-4" />}
            {signingOut ? "Getting your break ready..." : "Sign me out"}
          </button>
        </div>
      </div>
    </section>
  );
}

function AdultSignOutDialog({
  cancelButtonRef,
  error,
  onClose,
  onConfirm,
  signingOut
}: {
  cancelButtonRef: React.RefObject<HTMLButtonElement | null>;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
  signingOut: boolean;
}) {
  return (
    <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,.18)] sm:p-6">
      <h2 className="text-lg font-bold text-slate-950" id="sign-out-title">Sign out?</h2>
      <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-950">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <p className="text-sm leading-6">
          Your data and progress are saved. Enjoy your break - you can sign back in anytime and resume where you left off.
        </p>
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-red-600" role="alert">{error}</p> : null}
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
          onClick={onConfirm}
          type="button"
        >
          {signingOut ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </section>
  );
}
