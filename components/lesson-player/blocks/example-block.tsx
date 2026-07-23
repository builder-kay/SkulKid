import { Lightbulb, Sparkles } from "lucide-react";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import { FormattedText } from "@/components/shared/formatted-text";
import type { ExampleBlock } from "@/types/lesson";

export type ExampleBlockProps = {
  block: ExampleBlock;
};

export function ExampleBlockComponent({ block }: ExampleBlockProps) {
  return (
    <LessonBlockShell block={block} className="border-amber-100">
      <div className="space-y-4">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{block.title}</h2>
        <div className="rounded-[1.4rem] border border-amber-100 bg-white/90 p-4 sm:p-5">
          <FormattedText size="lesson" text={block.content} />
          {block.finalAnswer ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-black text-amber-950">
              <Sparkles aria-hidden="true" className="size-4" />
              Answer: {block.finalAnswer}
            </p>
          ) : null}
        </div>
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-amber-950 sm:p-5">
          <Lightbulb aria-hidden="true" className="mt-1 size-5 shrink-0 text-amber-600" />
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-black uppercase tracking-wider text-amber-800">Why it works</p>
            <FormattedText className="text-amber-950 [&_strong]:text-amber-950" text={block.explanation} />
          </div>
        </div>
      </div>
    </LessonBlockShell>
  );
}
