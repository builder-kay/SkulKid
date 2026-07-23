import { Lightbulb } from "lucide-react";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import type { ExampleBlock } from "@/types/lesson";

export type ExampleBlockProps = {
  block: ExampleBlock;
};

export function ExampleBlockComponent({ block }: ExampleBlockProps) {
  return (
    <LessonBlockShell block={block} className="border-amber-100">
      <div className="space-y-4">
        <h2 className="text-2xl font-black">{block.title}</h2>
        <div className="rounded-2xl border border-amber-100 bg-white/80 p-5 text-lg leading-8 text-text-secondary">{block.content}</div>
        <div className="flex gap-3 rounded-2xl bg-amber-100/70 p-5 text-amber-950">
          <Lightbulb aria-hidden="true" className="mt-1 size-5 shrink-0" />
          <p className="leading-7">{block.explanation}</p>
        </div>
      </div>
    </LessonBlockShell>
  );
}
