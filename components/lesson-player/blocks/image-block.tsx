import Image from "next/image";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import type { ImageBlock } from "@/types/lesson";

export type ImageBlockProps = {
  block: ImageBlock;
};

export function ImageBlockComponent({ block }: ImageBlockProps) {
  return (
    <LessonBlockShell block={block}>
      <figure className="space-y-4">
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-slate-100">
          <Image alt={block.altText} className="object-contain p-4" fill src={block.imageUrl} />
        </div>
        <figcaption className="text-sm leading-6 text-text-secondary">{block.caption}</figcaption>
      </figure>
    </LessonBlockShell>
  );
}
