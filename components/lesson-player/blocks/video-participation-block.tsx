"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, PlayCircle, Sparkles, Zap } from "lucide-react";
import { EmbeddedVideo } from "@/components/shared/embedded-video";
import { cn } from "@/lib/utils";
import type { VideoBlock } from "@/types/lesson";

const maximumAttempts = 2;

export function VideoParticipationBlock({ block, completed = false, onComplete }: { block: VideoBlock; completed?: boolean; onComplete?: (blockId: string, xp: number) => void }) {
  const [selected, setSelected] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "wrong" | "locked" | "correct">(completed ? "correct" : "idle");
  const prompt = block.participationPrompt?.trim();
  const options = block.participationOptions ?? [];
  const correctOptionId = block.participationCorrectOptionId;
  const reward = block.participationXp ?? 5;
  const configured = Boolean(prompt && options.length >= 2 && correctOptionId && options.some((option) => option.id === correctOptionId));

  useEffect(() => {
    if (completed) setFeedback("correct");
  }, [completed]);

  function submit() {
    if (!selected || feedback === "correct" || feedback === "locked" || !configured) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (selected === correctOptionId) {
      setFeedback("correct");
      onComplete?.(block.id, reward);
      return;
    }
    setFeedback(nextAttempts >= maximumAttempts ? "locked" : "wrong");
  }

  function retryAfterRewatch() {
    setSelected("");
    setAttempts(0);
    setFeedback("idle");
  }

  return <div className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm">
    <EmbeddedVideo url={block.videoUrl} title={block.title} caption={block.caption} />
    {prompt ? <section className="border-t border-violet-200 bg-gradient-to-br from-violet-50 to-amber-50 p-5 sm:p-6" aria-label="Video attention check">
      <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-700 text-white shadow-md"><Sparkles className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black uppercase tracking-[.16em] text-violet-700">Video checkpoint</p>{configured ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-amber-950"><Zap className="size-3.5 fill-current" />+{reward} XP</span> : null}</div><h3 className="mt-2 text-lg font-black text-slate-950">{prompt}</h3><p className="mt-1 text-xs font-semibold text-muted">Choose the answer shown or explained in the video.</p></div></div>

      {!configured ? <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950"><CircleAlert className="mt-0.5 size-5 shrink-0" /><div><p className="font-black">Checkpoint not configured</p><p className="mt-1 text-sm">No XP is awarded until the teacher adds answer choices and marks the correct answer.</p></div></div> : feedback === "correct" ? <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"><CheckCircle2 className="size-6 shrink-0 text-emerald-600" /><div><p className="font-black">Checkpoint cleared!</p><p className="text-sm">{block.participationExplanation ?? `Correct—you collected ${reward} XP.`}</p></div></div> : <>
        <div className="mt-4 grid gap-2">
          {options.map((option) => <button aria-pressed={selected === option.id} className={cn("flex min-h-12 items-center gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold transition", selected === option.id ? "border-violet-600 ring-2 ring-violet-200" : "border-violet-100 hover:border-violet-300", feedback === "locked" && "cursor-not-allowed opacity-60")} disabled={feedback === "locked"} key={option.id} onClick={() => { setSelected(option.id); if (feedback === "wrong") setFeedback("idle"); }} type="button"><span className={cn("grid size-7 shrink-0 place-items-center rounded-lg text-xs font-black", selected === option.id ? "bg-violet-700 text-white" : "bg-violet-50 text-violet-700")}>{option.label}</span>{option.text}</button>)}
        </div>
        {feedback === "wrong" ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800">That is not the answer from the video. You have one attempt left.</p> : null}
        {feedback === "locked" ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"><p className="font-black">Rewatch required</p><p className="mt-1 text-sm">Two answers were incorrect. Rewatch the relevant part, then restart the checkpoint.</p><button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-amber-300 px-4 text-sm font-black" onClick={retryAfterRewatch} type="button"><PlayCircle className="size-4" />I rewatched—try again</button></div> : <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold text-muted">{attempts}/{maximumAttempts} attempts used</p><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 font-black text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!selected} onClick={submit} type="button"><Zap className="size-4 fill-current" />Check answer</button></div>}
      </>}
    </section> : null}
  </div>;
}
