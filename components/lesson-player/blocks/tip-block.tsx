import { Sparkles } from "lucide-react";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import { FormattedText } from "@/components/shared/formatted-text";
import type { TipBlock } from "@/types/lesson";

export type TipBlockProps = {
  block: TipBlock;
};

export function TipBlockComponent({ block }: TipBlockProps) {
  return (
    <LessonBlockShell block={block} className="border-violet-100">
      <div className="flex gap-3 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4 text-violet-950 sm:p-5">
        <Sparkles aria-hidden="true" className="mt-1 size-5 shrink-0 text-violet-600" />
        <div className="min-w-0 space-y-2">
          <h2 className="text-xl font-black tracking-tight">{block.title}</h2>
          <FormattedText className="text-violet-950 [&_strong]:text-violet-950" size="lesson" text={block.content} />
        </div>
      </div>
    </LessonBlockShell>
  );
}
