import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";

export function FormattedText({ text }: { text: string }) {
  const normalised = text
    .replace(/\s+(?=##{2,3}\s)/g, "\n")
    .replace(/\s+(?=\[tip\])/g, "\n")
    .replace(/\[\/tip\]\s*/g, "[/tip]\n")
    .replace(/\s+(?=\d+[.)]\s)/g, "\n");
  const lines = normalised.split(/\r?\n/);
  const content: ReactNode[] = [];
  let list: string[] = [];
  let listType: "bullet" | "number" | null = null;

  function flushList(key: string) {
    if (!listType || list.length === 0) return;
    const items = list.map((item, index) => <li key={`${item}-${index}`}>{inline(item)}</li>);
    content.push(listType === "bullet"
      ? <ul className="ml-6 list-disc space-y-1" key={key}>{items}</ul>
      : <ol className="ml-6 list-decimal space-y-1" key={key}>{items}</ol>);
    list = [];
    listType = null;
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const nextListType = /^[-*]\s/.test(trimmed) ? "bullet" : /^\d+[.)]\s/.test(trimmed) ? "number" : null;
    if (nextListType) {
      if (listType && listType !== nextListType) flushList(`list-${index}`);
      listType = nextListType;
      list.push(trimmed.replace(/^([-*]|\d+[.)])\s+/, ""));
      return;
    }
    flushList(`list-${index}`);

    if (!trimmed) content.push(<span className="block h-2" key={`space-${index}`} />);
    else if (trimmed.startsWith("### ")) content.push(<h4 className="pt-2 text-lg font-black text-text-primary" key={index}>{inline(trimmed.slice(4))}</h4>);
    else if (trimmed.startsWith("## ")) content.push(<h3 className="pt-2 text-xl font-black text-text-primary" key={index}>{inline(trimmed.slice(3))}</h3>);
    else if (trimmed.startsWith("> ")) content.push(<blockquote className="border-l-4 border-violet-300 bg-violet-50 px-4 py-3 italic text-violet-950" key={index}>{inline(trimmed.slice(2))}</blockquote>);
    else if (trimmed.startsWith("[tip]") && trimmed.endsWith("[/tip]")) content.push(<aside className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950" key={index}><Lightbulb className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div>{inline(trimmed.slice(5, -6))}</div></aside>);
    else content.push(<p key={`line-${index}`}>{inline(line)}</p>);
  });
  flushList("list-final");
  return <div className="space-y-2 leading-8 text-text-secondary">{content}</div>;
}

function inline(text: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[u\][\s\S]+?\[\/u\]|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  return text.split(pattern).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong className="font-bold text-text-primary" key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith("[u]") && part.endsWith("[/u]")) return <span className="underline decoration-2 underline-offset-2" key={index}>{part.slice(3, -4)}</span>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a className="font-bold text-primary underline underline-offset-2" href={link[2]} key={index} rel="noreferrer" target="_blank">{link[1]}</a>;
    return part;
  });
}
