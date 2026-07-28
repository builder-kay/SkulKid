"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void fetch("/api/telemetry/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        digest: error.digest,
        path: window.location.pathname,
        message: error.message
      }),
      keepalive: true
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-slate-50 p-5">
        <main className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-3xl font-black text-slate-950">Something went wrong</h1>
          <p className="mt-3 text-slate-600">The issue was reported without including your private information.</p>
          <button className="mt-6 min-h-12 rounded-xl bg-violet-700 px-5 font-black text-white" onClick={reset} type="button">Try again</button>
        </main>
      </body>
    </html>
  );
}
