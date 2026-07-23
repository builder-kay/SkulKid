"use client";

import { useState } from "react";
import { CheckCircle2, Sparkles, Zap } from "lucide-react";
import { EmbeddedVideo } from "@/components/shared/embedded-video";
import type { VideoBlock } from "@/types/lesson";

export function VideoParticipationBlock({ block, completed = false, onComplete }: { block: VideoBlock; completed?: boolean; onComplete?: (blockId: string, xp: number) => void }) {
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(completed);
  const prompt = block.participationPrompt?.trim();
  const reward = block.participationXp ?? 5;
  const ready = response.trim().length >= 3;

  function submit() {
    if (!ready || submitted) return;
    setSubmitted(true);
    onComplete?.(block.id, reward);
  }

  return <div className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm">
    <EmbeddedVideo url={block.videoUrl} title={block.title} caption={block.caption} />
    {prompt ? <section className="border-t border-violet-200 bg-gradient-to-br from-violet-50 to-amber-50 p-5 sm:p-6" aria-label="Video participation check">
      <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-700 text-white shadow-md"><Sparkles className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black uppercase tracking-[.16em] text-violet-700">Quick check</p><span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-amber-950"><Zap className="size-3.5 fill-current" />+{reward} XP</span></div><h3 className="mt-2 text-lg font-black text-slate-950">{prompt}</h3></div></div>
      {submitted ? <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"><CheckCircle2 className="size-6 shrink-0 text-emerald-600" /><div><p className="font-black">Participation bonus earned!</p><p className="text-sm">Great watching—you collected {reward} XP.</p></div></div> : <div className="mt-4"><label className="text-sm font-bold text-slate-800" htmlFor={`video-prompt-${block.id}`}>Your response</label><textarea id={`video-prompt-${block.id}`} className="mt-2 min-h-24 w-full rounded-xl border border-violet-200 bg-white p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Write what you noticed or learned…" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">Your response stays on this page and is not saved.</p><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 font-black text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!ready} onClick={submit} type="button"><Zap className="size-4 fill-current" />Claim {reward} XP</button></div></div>}
    </section> : null}
  </div>;
}
