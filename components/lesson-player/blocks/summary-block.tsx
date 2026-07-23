import { CheckCircle2 } from "lucide-react";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import { FormattedText } from "@/components/shared/formatted-text";
import type { SummaryBlock } from "@/types/lesson";

export type SummaryBlockProps = {
  block: SummaryBlock;
};

export function SummaryBlockComponent({ block }: SummaryBlockProps) {
  return (
    <LessonBlockShell block={block} className="border-green-100">
      <div className="space-y-4">
        <h2 className="text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl">{block.heading}</h2>
        <ul className="grid gap-3">
          {block.points.map((point, index) => (
            <li
              className="flex gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm"
              key={`${index}-${point.slice(0, 24)}`}
            >
              <CheckCircle2 aria-hidden="true" className="mt-1 size-5 shrink-0 text-success" />
              <div className="min-w-0 flex-1">
                <FormattedText className="text-text-secondary [&_strong]:text-emerald-950" text={point} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </LessonBlockShell>
  );
}
