import { CheckCircle2 } from "lucide-react";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import type { SummaryBlock } from "@/types/lesson";

export type SummaryBlockProps = {
  block: SummaryBlock;
};

export function SummaryBlockComponent({ block }: SummaryBlockProps) {
  return (
    <LessonBlockShell block={block} className="border-green-100">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{block.heading}</h2>
        <ul className="grid gap-3">
          {block.points.map((point) => (
            <li className="flex gap-3 leading-7 text-text-secondary" key={point}>
              <CheckCircle2 aria-hidden="true" className="mt-1 size-5 shrink-0 text-success" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </LessonBlockShell>
  );
}
