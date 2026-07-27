"use client";

import { useEffect, useState } from "react";
import { Download, Share2, Sparkles, SquarePlus, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));
}

export function PwaExperience() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [iosInstall, setIosInstall] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      const register = () => {
        void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
          // The platform remains fully usable if service-worker registration is unavailable.
        });
      };
      if (document.readyState === "complete") register();
      else window.addEventListener("load", register, { once: true });
    }

    if (isStandalone()) return;
    setDismissed(window.sessionStorage.getItem("skulkid:pwa-prompt-dismissed") === "yes");
    setIosInstall(
      /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );

    function capturePrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    }

    function installed() {
      setInstallPrompt(null);
      setDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  function dismiss() {
    window.sessionStorage.setItem("skulkid:pwa-prompt-dismissed", "yes");
    setDismissed(true);
  }

  async function install() {
    if (!installPrompt || installing) return;
    setInstalling(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
        setDismissed(true);
      }
    } finally {
      setInstalling(false);
    }
  }

  if ((!installPrompt && !iosInstall) || dismissed) return null;

  return (
    <aside
      aria-label="Install SkulKid"
      className="fixed bottom-[calc(6.75rem+env(safe-area-inset-bottom))] right-3 z-[80] w-[min(calc(100vw-1.5rem),22rem)] overflow-hidden rounded-[1.5rem] border border-blue-200 bg-white shadow-[0_24px_70px_rgba(30,64,175,.25)] lg:bottom-5 lg:right-5"
    >
      <div className="relative bg-gradient-to-r from-blue-700 via-violet-700 to-fuchsia-700 px-4 py-3 text-white">
        <Sparkles aria-hidden="true" className="absolute right-12 top-3 size-5 text-amber-300" />
        <button
          aria-label="Not now"
          className="absolute right-2 top-2 grid size-9 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={dismiss}
          type="button"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
        <p className="text-xs font-black uppercase tracking-wider text-blue-100">Use SkulKid like an app</p>
        <h2 className="mt-0.5 pr-10 text-lg font-black">Install SkulKid</h2>
      </div>
      <div className="p-4">
        <p className="text-sm leading-6 text-slate-600">
          {iosInstall && !installPrompt
            ? "Add SkulKid to this device for quick, full-screen access from your home screen."
            : "Add SkulKid to this device for quick, full-screen access from the home screen."}
        </p>
        {iosInstall && !installPrompt ? (
          <>
            <ol className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
              <li className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2">
                <Share2 aria-hidden="true" className="size-4 text-blue-700" />
                Tap the Share button.
              </li>
              <li className="flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2">
                <SquarePlus aria-hidden="true" className="size-4 text-violet-700" />
                Choose Add to Home Screen.
              </li>
            </ol>
            <button
              className="mt-3 min-h-11 w-full rounded-xl bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              onClick={dismiss}
              type="button"
            >
              Got it
            </button>
          </>
        ) : (
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60"
              disabled={installing}
              onClick={() => void install()}
              type="button"
            >
              <Download aria-hidden="true" className="size-4" />
              {installing ? "Opening..." : "Install app"}
            </button>
            <button
              className="min-h-11 rounded-xl px-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              onClick={dismiss}
              type="button"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
