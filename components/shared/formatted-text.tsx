import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormattedTextProps = {
  text: string;
  /** Optional terms to highlight when no markdown markers are present. */
  emphasisTerms?: string[];
  className?: string;
  /** Larger, kid-friendly reading size for main teaching copy. */
  size?: "default" | "lesson";
};

/**
 * Lightweight lesson markup renderer.
 * Supports: ## / ### headings, **bold**, *italic*, [u]underline[/u],
 * - bullets, 1. lists, > quotes, [tip]...[/tip], [label](https://...).
 */
export function FormattedText({ text, emphasisTerms = [], className, size = "default" }: FormattedTextProps) {
  const prepared = prepareLessonText(text, emphasisTerms);
  const lines = prepared.split(/\r?\n/);
  const content: ReactNode[] = [];
  let list: string[] = [];
  let listType: "bullet" | "number" | null = null;

  function flushList(key: string) {
    if (!listType || list.length === 0) return;
    const items = [...list];
    if (listType === "bullet") {
      content.push(
        <ul className="my-1 ml-1 list-none space-y-2.5" key={key}>
          {items.map((item, index) => (
            <li className="flex gap-3 leading-8" key={`${key}-b-${index}`}>
              <span aria-hidden="true" className="mt-3 size-2 shrink-0 rounded-full bg-violet-500" />
              <span className="min-w-0 flex-1">{inline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      content.push(
        <ol className="my-1 ml-1 list-none space-y-2.5" key={key}>
          {items.map((item, index) => (
            <li className="flex gap-3 leading-8" key={`${key}-n-${index}`}>
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-black text-violet-800">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 pt-0.5">{inline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    list = [];
    listType = null;
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const nextListType = /^[-*•]\s/.test(trimmed) ? "bullet" : /^\d+[.)]\s/.test(trimmed) ? "number" : null;

    if (nextListType) {
      if (listType && listType !== nextListType) flushList(`list-${index}`);
      listType = nextListType;
      list.push(trimmed.replace(/^([-*•]|\d+[.)])\s+/, ""));
      return;
    }

    flushList(`list-${index}`);

    if (!trimmed) {
      content.push(<span aria-hidden="true" className="block h-3" key={`space-${index}`} />);
      return;
    }

    if (trimmed.startsWith("### ")) {
      content.push(
        <h4 className="pt-3 text-lg font-black tracking-tight text-text-primary sm:text-xl" key={index}>
          {inline(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      content.push(
        <h3 className="pt-4 text-xl font-black tracking-tight text-text-primary sm:text-2xl" key={index}>
          {inline(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("> ")) {
      content.push(
        <blockquote
          className="rounded-2xl border-l-4 border-violet-400 bg-violet-50 px-4 py-3 text-base italic leading-8 text-violet-950"
          key={index}
        >
          {inline(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    if (trimmed.startsWith("[tip]") && trimmed.endsWith("[/tip]")) {
      content.push(
        <aside
          className="flex gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-amber-950 shadow-sm"
          key={index}
        >
          <Lightbulb aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="min-w-0 leading-8">{inline(trimmed.slice(5, -6))}</div>
        </aside>
      );
      return;
    }

    content.push(
      <p className="leading-8 text-pretty" key={`line-${index}`}>
        {inline(trimmed)}
      </p>
    );
  });

  flushList("list-final");

  return (
    <div
      className={cn(
        "space-y-3 text-text-secondary [&_em]:italic [&_strong]:font-extrabold [&_strong]:text-slate-900",
        size === "lesson" && "text-base sm:text-lg sm:leading-9",
        className
      )}
    >
      {content}
    </div>
  );
}

function prepareLessonText(raw: string, emphasisTerms: string[]): string {
  let text = raw
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();

  // Convert common HTML pasted from Word/Docs into our markers
  text = text
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n\n")
    .replace(/<\s*p[^>]*>/gi, "")
    .replace(/<\s*\/?\s*(div|span)[^>]*>/gi, "")
    .replace(/<\s*(strong|b)\s*>/gi, "**")
    .replace(/<\/\s*(strong|b)\s*>/gi, "**")
    .replace(/<\s*(em|i)\s*>/gi, "*")
    .replace(/<\/\s*(em|i)\s*>/gi, "*")
    .replace(/<\s*u\s*>/gi, "[u]")
    .replace(/<\/\s*u\s*>/gi, "[/u]")
    .replace(/<[^>]+>/g, "");

  // Decode a few common entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');

  // Apply emphasis terms only when the body has no explicit bold markers yet
  if (emphasisTerms.length && !/\*\*[^*]+\*\*/.test(text)) {
    for (const term of emphasisTerms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      text = text.replace(new RegExp(`\\b(${escaped})\\b`, "gi"), "**$1**");
    }
  }

  // Break clumped structural markers onto their own lines
  text = text
    .replace(/\s+(?=##{1,3}\s)/g, "\n")
    .replace(/\s+(?=\[tip\])/gi, "\n")
    .replace(/\[\/tip\]\s*/gi, "[/tip]\n")
    .replace(/\s+(?=\d+[.)]\s+\S)/g, "\n")
    .replace(/\s+(?=[-•]\s+\S)/g, "\n")
    .replace(/([.!?:])\s+(?=\*\s+\S)/g, "$1\n")
    .replace(/\s+(?=>\s+\S)/g, "\n");

  // If still a single dense paragraph, split into readable sentence groups
  if (!text.includes("\n") && text.length > 140) {
    const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
    if (sentences && sentences.length >= 3) {
      const chunks: string[] = [];
      for (let i = 0; i < sentences.length; i += 2) {
        chunks.push(sentences.slice(i, i + 2).join(" ").trim());
      }
      text = chunks.join("\n\n");
    }
  }

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function inline(text: string): ReactNode[] {
  // Order matters: bold before italic; support ** **, __ __, * *, _ _
  const pattern =
    /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[u\][\s\S]+?\[\/u\]|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;

  return text.split(pattern).filter((part) => part.length > 0).map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return (
        <strong className="font-extrabold text-slate-900" key={index}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <em className="italic text-slate-800" key={index}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("[u]") && part.endsWith("[/u]")) {
      return (
        <span className="underline decoration-violet-400 decoration-2 underline-offset-4" key={index}>
          {part.slice(3, -4)}
        </span>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) {
      return (
        <a
          className="font-bold text-primary underline decoration-2 underline-offset-2 hover:text-primary-dark"
          href={link[2]}
          key={index}
          rel="noreferrer"
          target="_blank"
        >
          {link[1]}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
