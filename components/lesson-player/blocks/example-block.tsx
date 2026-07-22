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
        <h2 className="text-xl font-bold">{block.title}</h2>
        <p className="leading-8 text-text-secondary">{block.content}</p>
        <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-amber-950">
          <Lightbulb aria-hidden="true" className="mt-1 size-5 shrink-0" />
          <p className="leading-7">{block.explanation}</p>
        </div>
      </div>
    </LessonBlockShell>
  );
}
