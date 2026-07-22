import { Target } from "lucide-react";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import type { IntroductionBlock } from "@/types/lesson";

export type IntroductionBlockProps = {
  block: IntroductionBlock;
};

export function IntroductionBlockComponent({ block }: IntroductionBlockProps) {
  return (
    <LessonBlockShell block={block} className="border-blue-100">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">{block.title}</h2>
        <p className="leading-7 text-text-secondary">{block.content}</p>
        <div className="flex gap-3 rounded-xl bg-blue-50 p-4 text-blue-950">
          <Target aria-hidden="true" className="mt-1 size-5 shrink-0" />
          <p className="leading-7">
            <span className="font-bold">Objective: </span>
            {block.objective}
          </p>
        </div>
      </div>
    </LessonBlockShell>
  );
}
