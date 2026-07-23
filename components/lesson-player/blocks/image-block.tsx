import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import type { ImageBlock } from "@/types/lesson";

export type ImageBlockProps = {
  block: ImageBlock;
};

export function ImageBlockComponent({ block }: ImageBlockProps) {
  return (
    <LessonBlockShell block={block}>
      <figure className="space-y-4">
        <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-4">
          {/* Teacher-authored lessons may use images from any HTTPS host, so Next Image's fixed hostname allowlist is not suitable here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={block.altText} className="max-h-full max-w-full object-contain" loading="lazy" referrerPolicy="no-referrer" src={block.imageUrl} />
        </div>
        <figcaption className="text-sm leading-6 text-text-secondary">{block.caption}</figcaption>
      </figure>
    </LessonBlockShell>
  );
}
