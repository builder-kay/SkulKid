"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCheck, Clock3, Flag, Loader2, LockKeyhole, Paperclip, Send, ShieldCheck, Users } from "lucide-react";
import type { AdviceSuggestionType } from "@/lib/classes/types";
import { cn } from "@/lib/utils";

type ChatItem = {
  id: string;
  body: string;
  title?: string;
  createdAt: string;
  direction: "incoming" | "outgoing";
  kind: "message" | "announcement" | "advice";
  messageId?: string;
  senderName?: string;
  canReport?: boolean;
  adviceId?: string;
  feedbackCategory?: "celebration" | "practice" | "intervention" | null;
  recommendedActions?: Array<{ label: string; href?: string }>;
  followUpStatus?: "not_required" | "open" | "acknowledged" | "resolved";
  dueAt?: string | null;
  resolutionNote?: string | null;
  attachments?: Array<{ name: string; kind: "image" | "audio" | "file"; url: string }>;
};

type ChatState = {
  enabled: boolean;
  locked: boolean;
  postingStartsAt: string | null;
  postingEndsAt: string | null;
  timezone: string;
  guardianConsentRequired: boolean;
  consentReady: boolean;
  withinHours: boolean;
  canPost: boolean;
  rules: string[];
};

export function StudentClassChat({
  teacherName, classId, className, chat, messages, notifications, advice, value, sending,
  onChange, onReadAdvice, onReported, onSubmit
}: {
  teacherName: string;
  classId: string;
  className: string;
  chat: ChatState;
  messages: Array<{ id: string; body: string; attachments?: Array<{ name: string; kind: "image" | "audio" | "file"; url: string }>; createdAt: string; fromStudent: boolean; senderName: string; senderRole: "student" | "teacher" | "admin"; kind: "discussion" | "announcement"; editedAt: string | null }>;
  notifications: Array<{ id: string; title: string; body: string; attachments?: Array<{ name: string; kind: "image" | "audio" | "file"; url: string }>; audience: string; createdAt: string }>;
  advice: Array<{ id: string; message: string; suggestionType: AdviceSuggestionType; createdAt: string; readAt: string | null; title?: string | null; feedbackCategory?: "celebration" | "practice" | "intervention" | null; recommendedActions?: Array<{ label: string; href?: string }>; followUpStatus?: "not_required" | "open" | "acknowledged" | "resolved"; dueAt?: string | null; resolutionNote?: string | null }>;
  value: string;
  sending: boolean;
  onChange: (value: string) => void;
  onReadAdvice: (adviceId: string) => void;
  onReported: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const markedAdviceRef = useRef(new Set<string>());
  const [reporting, setReporting] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const timeline = useMemo<ChatItem[]>(() => [
    ...messages.map((item) => ({
      id: `message-${item.id}`, body: item.body, createdAt: item.createdAt,
      direction: item.fromStudent ? "outgoing" as const : "incoming" as const,
      kind: item.kind === "announcement" ? "announcement" as const : "message" as const,
      title: item.kind === "announcement" ? "Teacher announcement" : undefined,
      messageId: item.id, senderName: item.senderName,
      attachments: item.attachments,
      canReport: !item.fromStudent && item.senderRole === "student"
    })),
    ...notifications.map((item) => ({
      id: `notification-${item.id}`, title: item.title, body: item.body, createdAt: item.createdAt,
      direction: "incoming" as const, kind: "announcement" as const
      ,attachments: item.attachments
    })),
    ...advice.map((item) => ({
      id: `advice-${item.id}`, title: item.title || adviceLabel(item.suggestionType), body: item.message, createdAt: item.createdAt,
      direction: "incoming" as const, kind: "advice" as const, adviceId: item.id,
      feedbackCategory: item.feedbackCategory, recommendedActions: item.recommendedActions,
      followUpStatus: item.followUpStatus, dueAt: item.dueAt, resolutionNote: item.resolutionNote
    }))
  ].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)), [advice, messages, notifications]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [timeline.length]);
  useEffect(() => {
    for (const item of advice) {
      if (!item.readAt && !markedAdviceRef.current.has(item.id)) {
        markedAdviceRef.current.add(item.id);
        onReadAdvice(item.id);
      }
    }
  }, [advice, onReadAdvice]);

  async function report(messageId: string) {
    const reason = window.prompt("Reason: bullying, threat, sexual_content, personal_information, spam, or other", "bullying");
    if (!reason) return;
    if (!["bullying", "threat", "sexual_content", "personal_information", "spam", "other"].includes(reason)) {
      setNotice("Please enter one of the listed report reasons.");
      return;
    }
    setReporting(messageId);
    try {
      const response = await fetch(`/api/student/classes/${classId}/messages/report`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, reason, muteSender: true })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not report the message.");
      setNotice("Reported. The learner is now muted for you and the safety team can review it.");
      onReported();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not report the message.");
    } finally {
      setReporting(null);
    }
  }

  async function acknowledge(adviceId: string) {
    setReporting(`advice-${adviceId}`);
    try {
      const response = await fetch(`/api/student/advice/${adviceId}/acknowledge`, { method: "POST" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not acknowledge this feedback.");
      setNotice("Your teacher can now see that you acknowledged this next step.");
      onReported();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not acknowledge this feedback.");
    } finally {
      setReporting(null);
    }
  }

  const unavailableReason = !chat.enabled ? "Class discussion is not enabled."
    : chat.locked ? "Your teacher has paused this discussion."
      : !chat.consentReady ? "Guardian consent and acceptance of the class rules are required before posting."
        : !chat.withinHours ? `Messaging opens from ${chat.postingStartsAt} to ${chat.postingEndsAt} (${chat.timezone}).`
          : "";

  return (
    <section className="flex h-[min(42rem,calc(100dvh-6rem))] min-h-[28rem] flex-col overflow-hidden rounded-[1.25rem] border border-blue-100 bg-white shadow-[0_20px_60px_-28px_rgba(30,64,175,0.45)] sm:h-[min(46rem,calc(100dvh-8rem))] sm:min-h-[34rem] sm:rounded-[1.75rem] lg:h-[46rem]">
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-blue-800/40 bg-gradient-to-r from-blue-700 via-blue-700 to-indigo-700 px-3 py-2.5 text-white sm:px-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/25 bg-white/15 shadow-inner"><Users className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-black">{className}</h2>
          <p className="truncate text-xs font-semibold text-blue-100">Supervised by {teacherName} · active classmates only</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10" title="Teacher-supervised class chat"><ShieldCheck className="size-5 text-blue-100" /></span>
      </header>
      <div className="shrink-0 border-b border-blue-100 bg-blue-50 px-3 py-2.5 sm:px-5">
        <details>
          <summary className="cursor-pointer select-none text-xs font-black text-blue-900"><ShieldCheck className="mr-1.5 inline size-4" />Safe class chat · tap to read the rules</summary>
          <ul className="mt-2 grid gap-1 pl-5 text-xs leading-5 text-blue-950">{chat.rules.map((rule) => <li className="list-disc" key={rule}>{rule}</li>)}</ul>
        </details>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-100 bg-[radial-gradient(circle_at_center,rgba(59,130,246,.10)_1px,transparent_1px)] bg-[length:18px_18px] px-2.5 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto grid max-w-4xl gap-2">
          {timeline.length ? timeline.map((item, index) => {
            const previous = timeline[index - 1];
            const showDate = !previous || new Date(previous.createdAt).toDateString() !== new Date(item.createdAt).toDateString();
            return <div key={item.id}>{showDate ? <DateDivider value={item.createdAt} /> : null}<Bubble item={item} onAcknowledge={acknowledge} onReport={report} reporting={reporting} /></div>;
          }) : <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-blue-100 bg-white/95 p-5 text-center text-sm leading-6 text-slate-700 shadow-sm"><span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-blue-100 text-xl text-blue-700">💬</span><b className="block text-slate-950">Your class conversation starts here</b>Your teacher supervises this room, and only active classmates can participate.</div>}
          <div ref={endRef} />
        </div>
      </div>
      {notice ? <p className="border-t border-slate-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900">{notice}</p> : null}
      {unavailableReason ? <p className="flex items-center gap-2 border-t border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">{chat.locked ? <LockKeyhole className="size-4" /> : <Clock3 className="size-4" />}{unavailableReason}</p> : null}
      <form className="flex shrink-0 items-end gap-2 border-t border-blue-100 bg-white p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:p-3" onSubmit={onSubmit}>
        <textarea aria-label={`Message ${className} discussion`} className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-5 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 disabled:bg-slate-200 sm:text-sm" disabled={!chat.canPost} maxLength={1000} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={chat.canPost ? "Message your class…" : "Posting is unavailable"} rows={1} value={value} />
        <button aria-label="Send message" className="grid size-12 shrink-0 place-items-center rounded-full bg-blue-700 text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800 active:scale-95 disabled:opacity-50" disabled={!chat.canPost || sending || !value.trim()} type="submit">{sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}</button>
      </form>
    </section>
  );
}

function Bubble({ item, onAcknowledge, onReport, reporting }: { item: ChatItem; onAcknowledge: (id: string) => void; onReport: (id: string) => void; reporting: string | null }) {
  const outgoing = item.direction === "outgoing";
  return <div className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
    <article className={cn("max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[76%] lg:max-w-[68%]", outgoing ? "rounded-br-sm bg-blue-700 text-white" : "rounded-bl-sm border border-slate-200/80 bg-white")}>
      {item.senderName && !outgoing ? <p className="mb-0.5 text-xs font-black text-blue-700">{item.senderName}</p> : null}
      {item.title ? <p className={cn("mb-1 text-xs font-black", outgoing ? "text-blue-100" : item.kind === "announcement" ? "text-violet-700" : "text-blue-700")}>{item.title}</p> : null}
      <p className={cn("whitespace-pre-wrap break-words text-sm leading-5", outgoing ? "text-white" : "text-slate-900")}>{item.body}</p>
      {item.attachments?.length ? <div className="mt-2 grid gap-2">{item.attachments.map((attachment) => attachment.kind === "image" ? <a href={attachment.url} key={attachment.url} rel="noreferrer" target="_blank"><img alt={attachment.name} className="max-h-72 w-full rounded-xl object-cover" loading="lazy" src={attachment.url} /></a> : attachment.kind === "audio" ? <audio className="max-w-full" controls key={attachment.url} preload="metadata" src={attachment.url} /> : <a className={cn("inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black", outgoing ? "border-white/30 text-white" : "border-slate-200 text-blue-700")} download={attachment.name} href={attachment.url} key={attachment.url} rel="noreferrer" target="_blank"><Paperclip className="size-4" /><span className="max-w-48 truncate">{attachment.name}</span></a>)}</div> : null}
      {item.recommendedActions?.length ? <div className="mt-3 grid gap-1.5">{item.recommendedActions.map((action) => action.href ? <a className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-800 hover:bg-blue-100" href={action.href} key={action.label}>→ {action.label}</a> : <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-950" key={action.label}>→ {action.label}</p>)}</div> : null}
      {item.dueAt ? <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-amber-800"><Clock3 className="size-3" />Suggested by {new Date(item.dueAt).toLocaleDateString()}</p> : null}
      {item.kind === "advice" && item.followUpStatus ? <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase", item.followUpStatus === "resolved" ? "bg-emerald-100 text-emerald-800" : item.followUpStatus === "acknowledged" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-900")}>{item.followUpStatus.replace("_", " ")}</span>
        {item.followUpStatus === "open" && item.adviceId ? <button className="min-h-9 rounded-lg bg-blue-700 px-3 text-xs font-black text-white disabled:opacity-60" disabled={reporting === `advice-${item.adviceId}`} onClick={() => void onAcknowledge(item.adviceId!)} type="button">{reporting === `advice-${item.adviceId}` ? "Saving…" : "I understand this next step"}</button> : null}
      </div> : null}
      {item.resolutionNote ? <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs font-bold text-emerald-900">Teacher follow-up: {item.resolutionNote}</p> : null}
      <div className="mt-1 flex items-center justify-end gap-1 pl-8">
        <time className={cn("text-[10px]", outgoing ? "text-blue-100" : "text-slate-500")}>{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(item.createdAt))}</time>
        {outgoing ? <CheckCheck className="size-4 text-sky-200" /> : null}
        {item.canReport && item.messageId ? <button aria-label="Report and mute this learner" className="ml-1 text-slate-400 hover:text-rose-700" disabled={reporting === item.messageId} onClick={() => void onReport(item.messageId!)} type="button">{reporting === item.messageId ? <Loader2 className="size-3 animate-spin" /> : <Flag className="size-3" />}</button> : null}
      </div>
    </article>
  </div>;
}

function DateDivider({ value }: { value: string }) {
  const date = new Date(value); const today = new Date(); const yesterday = new Date(Date.now() - 86400000);
  const label = date.toDateString() === today.toDateString() ? "Today" : date.toDateString() === yesterday.toDateString() ? "Yesterday" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" }).format(date);
  return <div className="my-4 text-center"><span className="rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm">{label}</span></div>;
}

function adviceLabel(value: AdviceSuggestionType) {
  if (value === "class_adventure") return "Class activity";
  if (value === "platform_adventure") return "Learning suggestion";
  return "Teacher encouragement";
}
