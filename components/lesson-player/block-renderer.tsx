import { ExampleBlockComponent } from "@/components/lesson-player/blocks/example-block";
import { FillBlankBlockComponent } from "@/components/lesson-player/blocks/fill-blank-block";
import { ImageBlockComponent } from "@/components/lesson-player/blocks/image-block";
import { IntroductionBlockComponent } from "@/components/lesson-player/blocks/introduction-block";
import { MultipleChoiceBlockComponent } from "@/components/lesson-player/blocks/multiple-choice-block";
import { SummaryBlockComponent } from "@/components/lesson-player/blocks/summary-block";
import { TextBlockComponent } from "@/components/lesson-player/blocks/text-block";
import { TipBlockComponent } from "@/components/lesson-player/blocks/tip-block";
import { TrueFalseBlockComponent } from "@/components/lesson-player/blocks/true-false-block";
import { VideoParticipationBlock } from "@/components/lesson-player/blocks/video-participation-block";
import type { LessonBlock } from "@/types/lesson";

export type BlockRendererProps = {
  block: LessonBlock;
  previewMode?: boolean;
  onAnswer?: (blockId: string, correct: boolean, attempts: number) => void;
  completedVideoPromptIds?: string[];
  onVideoPromptComplete?: (blockId: string, xp: number) => void;
};

function assertNever(value: never): never {
  throw new Error(`Unsupported lesson block: ${JSON.stringify(value)}`);
}

export function BlockRenderer({ block, previewMode = false, onAnswer, completedVideoPromptIds = [], onVideoPromptComplete }: BlockRendererProps) {
  switch (block.type) {
    case "introduction":
      return <IntroductionBlockComponent block={block} />;
    case "text":
      return <TextBlockComponent block={block} />;
    case "image":
      return <ImageBlockComponent block={block} />;
    case "video":
      return <VideoParticipationBlock block={block} completed={completedVideoPromptIds.includes(block.id)} onComplete={onVideoPromptComplete} />;
    case "example":
      return <ExampleBlockComponent block={block} />;
    case "tip":
      return <TipBlockComponent block={block} />;
    case "multiple_choice":
      return <MultipleChoiceBlockComponent block={block} previewMode={previewMode} onAnswer={onAnswer} />;
    case "true_false":
      return <TrueFalseBlockComponent block={block} previewMode={previewMode} onAnswer={onAnswer} />;
    case "fill_blank":
      return <FillBlankBlockComponent block={block} previewMode={previewMode} onAnswer={onAnswer} />;
    case "summary":
      return <SummaryBlockComponent block={block} />;
    default:
      if (previewMode) {
        return (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
            Unknown block type in preview.
          </div>
        );
      }

      return assertNever(block);
  }
}
