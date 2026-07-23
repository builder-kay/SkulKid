import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import { FormattedText } from "@/components/shared/formatted-text";
import type { TextBlock } from "@/types/lesson";

export type TextBlockProps = {
  block: TextBlock;
};

export function TextBlockComponent({ block }: TextBlockProps) {
  return (
    <LessonBlockShell block={block}>
      <div className="space-y-4">
        <h2 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">{block.heading}</h2>
        <div className="rounded-[1.4rem] border border-violet-100/80 bg-white/70 p-4 sm:p-5">
          <FormattedText emphasisTerms={block.emphasisTerms} size="lesson" text={block.content} />
        </div>
      </div>
    </LessonBlockShell>
  );
}
