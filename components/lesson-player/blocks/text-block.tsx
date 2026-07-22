import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import { FormattedText } from "@/components/shared/formatted-text";
import type { TextBlock } from "@/types/lesson";

export type TextBlockProps = {
  block: TextBlock;
};

export function TextBlockComponent({ block }: TextBlockProps) {
  return (
    <LessonBlockShell block={block}>
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-text-primary">{block.heading}</h2>
        <FormattedText text={block.content} />
      </div>
    </LessonBlockShell>
  );
}
