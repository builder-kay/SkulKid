"use client";

import { useEffect, useMemo, useRef } from "react";
import { CheckCheck, Loader2, MessageCircle, Send } from "lucide-react";
import type { AdviceSuggestionType } from "@/lib/classes/types";
import { cn } from "@/lib/utils";

type ChatItem = {
  id: string;
  body: string;
  title?: string;
  createdAt: string;
  direction: "incoming" | "outgoing";
  kind: "message" | "announcement" | "advice";
};

export function StudentClassChat({
  teacherName,
  className,
  messages,
  notifications,
  advice,
  value,
  sending,
  onChange,
  onReadAdvice,
  onSubmit
}: {
  teacherName: string;
  className: string;
  messages: Array<{ id: string; body: string; createdAt: string; fromStudent: boolean }>;
  notifications: Array<{ id: string; title: string; body: string; audience: string; createdAt: string }>;
  advice: Array<{ id: string; message: string; suggestionType: AdviceSuggestionType; createdAt: string; readAt: string | null }>;
  value: string;
  sending: boolean;
  onChange: (value: string) => void;
  onReadAdvice: (adviceId: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const markedAdviceRef = useRef(new Set<string>());
  const timeline = useMemo<ChatItem[]>(() => [
    ...messages.map((item) => ({
      id: `message-${item.id}`,
      body: item.body,
      createdAt: item.createdAt,
      direction: item.fromStudent ? "outgoing" as const : "incoming" as const,
      kind: "message" as const
    })),
    ...notifications.map((item) => ({
      id: `notification-${item.id}`,
      title: item.title,
      body: item.body,
      createdAt: item.createdAt,
      direction: "incoming" as const,
      kind: "announcement" as const
    })),
    ...advice.map((item) => ({
      id: `advice-${item.id}`,
      title: adviceLabel(item.suggestionType),
      body: item.message,
      createdAt: item.createdAt,
      direction: "incoming" as const,
      kind: "advice" as const
    }))
  ].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)), [advice, messages, notifications]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [timeline.length]);
  useEffect(() => {
    for (const item of advice) {
      if (!item.readAt && !markedAdviceRef.current.has(item.id)) {
        markedAdviceRef.current.add(item.id);
        onReadAdvice(item.id);
      }
    }
  }, [advice, onReadAdvice]);

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white shadow-xl">
      <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-slate-100 px-4 sm:px-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 font-black text-white">{initials(teacherName)}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-black text-slate-950">{teacherName}</h2>
          <p className="truncate text-xs font-semibold text-slate-500">{className} · Your teacher</p>
        </div>
        <span className="grid size-10 place-items-center rounded-full bg-white text-emerald-700 shadow-sm"><MessageCircle className="size-5" /></span>
      </header>

      <div className="h-[32rem] overflow-y-auto bg-[#efeae2] bg-[radial-gradient(circle_at_center,rgba(255,255,255,.55)_1px,transparent_1px)] bg-[length:18px_18px] px-3 py-5 sm:px-7">
        <div className="mx-auto grid max-w-4xl gap-1.5">
          {timeline.length ? timeline.map((item, index) => {
            const previous = timeline[index - 1];
            const showDate = !previous || new Date(previous.createdAt).toDateString() !== new Date(item.createdAt).toDateString();
            return <div key={item.id}>{showDate ? <DateDivider value={item.createdAt} /> : null}<Bubble item={item} /></div>;
          }) : (
            <div className="mx-auto mt-20 max-w-md rounded-xl bg-amber-50 p-4 text-center text-sm leading-6 text-amber-950 shadow-sm">
              This is the beginning of your conversation with {teacherName}. Ask a question whenever you need help.
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <form className="flex items-end gap-2 border-t border-slate-200 bg-slate-100 p-3" onSubmit={onSubmit}>
        <textarea
          aria-label={`Message ${teacherName}`}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border-0 bg-white px-4 py-3 text-sm leading-5 shadow-sm outline-none focus:ring-2 focus:ring-emerald-600"
          maxLength={1000}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Type a message"
          rows={1}
          value={value}
        />
        <button
          aria-label="Send message"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-700 text-white transition hover:bg-emerald-800 disabled:opacity-50"
          disabled={sending || !value.trim()}
          type="submit"
        >
          {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        </button>
      </form>
    </section>
  );
}

function Bubble({ item }: { item: ChatItem }) {
  const outgoing = item.direction === "outgoing";
  return (
    <div className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
      <article className={cn(
        "max-w-[87%] rounded-lg px-3 py-2 shadow-sm sm:max-w-[72%]",
        outgoing ? "rounded-tr-none bg-[#d9fdd3]" : "rounded-tl-none bg-white"
      )}>
        {item.title ? <p className={cn("mb-1 text-xs font-black", item.kind === "announcement" ? "text-violet-700" : "text-emerald-700")}>{item.title}</p> : null}
        <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-900">{item.body}</p>
        <div className="mt-1 flex items-center justify-end gap-1 pl-8">
          <time className="text-[10px] text-slate-500">{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(item.createdAt))}</time>
          {outgoing ? <CheckCheck className="size-4 text-sky-600" /> : null}
        </div>
      </article>
    </div>
  );
}

function DateDivider({ value }: { value: string }) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const label = date.toDateString() === today.toDateString()
    ? "Today"
    : date.toDateString() === yesterday.toDateString()
      ? "Yesterday"
      : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" }).format(date);
  return <div className="my-4 text-center"><span className="rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm">{label}</span></div>;
}

function adviceLabel(value: AdviceSuggestionType) {
  if (value === "class_adventure") return "Class activity";
  if (value === "platform_adventure") return "Learning suggestion";
  return "Teacher encouragement";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "T";
}
