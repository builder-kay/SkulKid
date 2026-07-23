import { Target } from "lucide-react";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import { FormattedText } from "@/components/shared/formatted-text";
import type { IntroductionBlock } from "@/types/lesson";

export type IntroductionBlockProps = {
  block: IntroductionBlock;
};

export function IntroductionBlockComponent({ block }: IntroductionBlockProps) {
  return (
    <LessonBlockShell block={block} className="border-blue-100">
      <div className="space-y-5">
        <h2 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">{block.title}</h2>
        <FormattedText size="lesson" text={block.content} />
        <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-950 sm:p-5">
          <Target aria-hidden="true" className="mt-1 size-5 shrink-0 text-blue-700" />
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-black uppercase tracking-wider text-blue-700">Objective</p>
            <FormattedText className="text-blue-950 [&_strong]:text-blue-950" text={block.objective} />
          </div>
        </div>
      </div>
    </LessonBlockShell>
  );
}
