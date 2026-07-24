"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

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
    setError(null);
    setSigningOut(false);
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
      if (!response.ok) throw new Error("Could not sign out. Try again.");
      window.location.assign("/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out.");
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
    </div>
  );
}
