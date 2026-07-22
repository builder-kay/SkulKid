import { Sparkles } from "lucide-react";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import type { TipBlock } from "@/types/lesson";

export type TipBlockProps = {
  block: TipBlock;
};

export function TipBlockComponent({ block }: TipBlockProps) {
  return (
    <LessonBlockShell block={block} className="border-violet-100">
      <div className="flex gap-3 rounded-xl bg-violet-50 p-4 text-violet-950">
        <Sparkles aria-hidden="true" className="mt-1 size-5 shrink-0" />
        <div>
          <h2 className="font-bold">{block.title}</h2>
          <p className="mt-2 leading-7">{block.content}</p>
        </div>
      </div>
    </LessonBlockShell>
  );
}
