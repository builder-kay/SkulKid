"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, Flag, Loader2, LockKeyhole, MessageCircle, Paperclip, Send, ShieldCheck, Users, X } from "lucide-react";
import { ChatMessageText } from "@/components/chat/chat-message-text";
import type { AdviceSuggestionType } from "@/lib/classes/types";
import { cn } from "@/lib/utils";

const reportReasons = [
  { id: "bullying", label: "Being unkind or bullying" },
  { id: "threat", label: "Threatening or scary" },
  { id: "sexual_content", label: "Inappropriate or private content" },
  { id: "personal_information", label: "Sharing phone numbers or personal details" },
  { id: "spam", label: "Spam or off-topic" },
  { id: "other", label: "Something else that feels unsafe" }
] as const;

type ReportReason = (typeof reportReasons)[number]["id"];

type ChatItem = {
  id: string;
  body: string;
  title?: string;
  createdAt: string;
  direction: "incoming" | "outgoing";
  kind: "message" | "announcement" | "advice";
  messageId?: string;
  senderName?: string;
  linkify?: boolean;
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
  guardianReady?: boolean;
  rulesAccepted?: boolean;
  consentReady: boolean;
  withinHours: boolean;
  canPost: boolean;
  rules: string[];
};

export function StudentClassChat({
  teacherName, classId, className, chat, messages, notifications, advice, value, sending,
  onChange, onReadAdvice, onReported, onSubmit, variant = "class_group"
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
  variant?: "class_group" | "direct";
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const markedAdviceRef = useRef(new Set<string>());
  const [reporting, setReporting] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("bullying");
  const [reportDetails, setReportDetails] = useState("");
  const [acceptingRules, setAcceptingRules] = useState(false);
  const timeline = useMemo<ChatItem[]>(() => [
    ...messages.map((item) => {
      const isTeacherAnnouncement = variant === "class_group"
        && (item.senderRole === "teacher" || item.senderRole === "admin" || item.kind === "announcement");
      return {
        id: `message-${item.id}`, body: item.body, createdAt: item.createdAt,
        direction: item.fromStudent ? "outgoing" as const : "incoming" as const,
        kind: isTeacherAnnouncement ? "announcement" as const : "message" as const,
        title: isTeacherAnnouncement ? "Announcement" : undefined,
        messageId: item.id, senderName: item.senderName,
        attachments: item.attachments,
        linkify: item.senderRole === "teacher" || item.senderRole === "admin",
        canReport: variant === "class_group" && !item.fromStudent && item.senderRole === "student"
      };
    }),
    ...(variant === "class_group" ? advice.map((item) => ({
      id: `advice-${item.id}`, title: item.title || adviceLabel(item.suggestionType), body: item.message, createdAt: item.createdAt,
      direction: "incoming" as const, kind: "advice" as const, adviceId: item.id,
      feedbackCategory: item.feedbackCategory, recommendedActions: item.recommendedActions,
      followUpStatus: item.followUpStatus, dueAt: item.dueAt, resolutionNote: item.resolutionNote,
      linkify: true
    })) : [])
  ].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)), [advice, messages, variant]);

  const latestItemId = timeline.at(-1)?.id ?? "";
  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    // Keep private and class-group chats pinned to the latest message inside the log pane.
    requestAnimationFrame(() => {
      log.scrollTop = log.scrollHeight;
    });
  }, [classId, variant, timeline.length, latestItemId]);
  useEffect(() => {
    for (const item of advice) {
      if (!item.readAt && !markedAdviceRef.current.has(item.id)) {
        markedAdviceRef.current.add(item.id);
        onReadAdvice(item.id);
      }
    }
  }, [advice, onReadAdvice]);

  function openReport(messageId: string) {
    setReportTarget(messageId);
    setReportReason("bullying");
    setReportDetails("");
    setNotice("");
  }

  async function submitReport() {
    if (!reportTarget) return;
    setReporting(reportTarget);
    try {
      const response = await fetch(`/api/student/classes/${classId}/messages/report`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: reportTarget,
          reason: reportReason,
          details: reportDetails.trim() || undefined,
          muteSender: true
        })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not report the message.");
      setReportTarget(null);
      setNotice("Thanks for telling a trusted adult. That learner is muted for you, and your teacher can review it.");
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

  async function acceptRules() {
    setAcceptingRules(true);
    setNotice("");
    try {
      const response = await fetch(`/api/student/classes/${classId}/chat/accept-rules`, { method: "POST" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save your acceptance.");
      setNotice("Thanks. You can message your class when discussion is open.");
      onReported();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not save your acceptance.");
    } finally {
      setAcceptingRules(false);
    }
  }

  const needsRulesAcceptance = Boolean(chat.guardianReady && !chat.rulesAccepted);
  const unavailableReason = !chat.enabled ? "Class discussion is not enabled."
    : chat.locked ? "Your teacher has paused this discussion."
      : !chat.guardianReady ? "Your teacher still needs to record guardian consent before you can post."
        : needsRulesAcceptance ? "Read the safe class chat rules, then tap Accept to join the discussion."
          : !chat.withinHours ? `Messaging opens from ${chat.postingStartsAt} to ${chat.postingEndsAt} (${chat.timezone}).`
            : "";

  return (
    <section className="flex h-[min(42rem,calc(100dvh-6rem))] min-h-[28rem] flex-col overflow-hidden rounded-[1.25rem] border border-blue-100 bg-white shadow-[0_20px_60px_-28px_rgba(30,64,175,0.45)] sm:h-[min(46rem,calc(100dvh-8rem))] sm:min-h-[34rem] sm:rounded-[1.75rem] lg:h-[46rem]">
      <header className={cn("flex min-h-16 shrink-0 items-center gap-3 border-b px-3 py-2.5 text-white sm:px-5", variant === "direct" ? "border-indigo-900/40 bg-gradient-to-r from-indigo-700 via-blue-700 to-blue-800" : "border-blue-800/40 bg-gradient-to-r from-blue-700 via-blue-700 to-indigo-700")}>
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/25 bg-white/15 shadow-inner"><Users className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-black">{className}</h2>
          <p className="truncate text-xs font-semibold text-blue-100">
            {variant === "direct" ? `Private chat with ${teacherName}` : `Class group · supervised by ${teacherName}`}
          </p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10" title={variant === "direct" ? "Private teacher chat" : "Teacher-supervised class chat"}><ShieldCheck className="size-5 text-blue-100" /></span>
      </header>
      {variant === "class_group" ? (
        <div className="shrink-0 border-b border-blue-100 bg-blue-50 px-3 py-2.5 sm:px-5">
          <details>
            <summary className="cursor-pointer select-none text-xs font-black text-blue-900"><ShieldCheck className="mr-1.5 inline size-4" />Safe class chat · tap to read the rules</summary>
            <ul className="mt-2 grid gap-1 pl-5 text-xs leading-5 text-blue-950">{chat.rules.map((rule) => <li className="list-disc" key={rule}>{rule}</li>)}</ul>
          </details>
        </div>
      ) : (
        <div className="shrink-0 border-b border-indigo-100 bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-950 sm:px-5">
          Only you and your teacher can see this private conversation.
        </div>
      )}
      <div aria-live="polite" className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-100 bg-[radial-gradient(circle_at_center,rgba(59,130,246,.10)_1px,transparent_1px)] bg-[length:18px_18px] px-2.5 py-4 sm:px-6 sm:py-5" ref={logRef} role="log">
        <div className="mx-auto grid max-w-4xl gap-2">
          {timeline.length ? timeline.map((item, index) => {
            const previous = timeline[index - 1];
            const showDate = !previous || new Date(previous.createdAt).toDateString() !== new Date(item.createdAt).toDateString();
            return <div key={item.id}>{showDate ? <DateDivider value={item.createdAt} /> : null}<Bubble item={item} onAcknowledge={acknowledge} onReport={openReport} reporting={reporting} /></div>;
          }) : <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-blue-100 bg-white/95 p-5 text-center text-sm leading-6 text-slate-700 shadow-sm"><span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-blue-100 text-blue-700"><MessageCircle className="size-5" /></span><b className="block text-slate-950">{variant === "direct" ? "Message your teacher" : "Your class conversation starts here"}</b>{variant === "direct" ? "This private chat is only between you and your teacher." : "Your teacher supervises this room, and only active classmates can participate."}</div>}
          <div ref={endRef} />
        </div>
      </div>
      {notice ? <p className="border-t border-slate-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900" role="status">{notice}</p> : null}
      {unavailableReason ? (
        <div className="border-t border-slate-200 bg-slate-100 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-700">{chat.locked ? <LockKeyhole className="size-4" /> : <ShieldCheck className="size-4" />}{unavailableReason}</p>
          {needsRulesAcceptance ? (
            <button className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-60" disabled={acceptingRules} onClick={() => void acceptRules()} type="button">
              {acceptingRules ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              I accept the class chat rules
            </button>
          ) : null}
        </div>
      ) : null}
      <form className="flex shrink-0 items-end gap-2 border-t border-blue-100 bg-white p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:p-3" onSubmit={onSubmit}>
        <textarea aria-label={variant === "direct" ? `Message ${teacherName}` : `Message ${className} discussion`} className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-5 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 disabled:bg-slate-200 sm:text-sm" disabled={!chat.canPost} maxLength={1000} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={chat.canPost ? (variant === "direct" ? "Message your teacher…" : "Message your class…") : "Posting is unavailable"} rows={1} value={value} />
        <button aria-label="Send message" className="grid size-12 shrink-0 place-items-center rounded-full bg-blue-700 text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800 active:scale-95 disabled:opacity-50" disabled={!chat.canPost || sending || !value.trim()} type="submit">{sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}</button>
      </form>
      {reportTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/55 p-3 backdrop-blur-sm sm:place-items-center" onMouseDown={(event) => { if (event.currentTarget === event.target) setReportTarget(null); }}>
          <section aria-labelledby="report-message-title" aria-modal="true" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[1.5rem] bg-white p-5 shadow-2xl sm:p-6" role="dialog">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-rose-700">Stay safe</p>
                <h2 className="mt-1 text-xl font-black text-slate-950" id="report-message-title">Tell a trusted adult</h2>
                <p className="mt-1 text-sm text-slate-600">Choose what felt wrong. We will mute this learner for you and notify your teacher.</p>
              </div>
              <button aria-label="Close report form" className="grid size-10 place-items-center rounded-xl bg-slate-100" onClick={() => setReportTarget(null)} type="button"><X className="size-5" /></button>
            </div>
            <div className="grid gap-2" role="radiogroup" aria-label="Why are you reporting this message?">
              {reportReasons.map((reason) => (
                <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm font-bold transition", reportReason === reason.id ? "border-rose-300 bg-rose-50 text-rose-950" : "border-slate-200 hover:bg-slate-50")} key={reason.id}>
                  <input checked={reportReason === reason.id} className="mt-1" name="report-reason" onChange={() => setReportReason(reason.id)} type="radio" value={reason.id} />
                  <span>{reason.label}</span>
                </label>
              ))}
            </div>
            <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
              Anything else to add? (optional)
              <textarea className="min-h-20 rounded-xl border border-slate-300 p-3 text-sm font-normal outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" maxLength={500} onChange={(event) => setReportDetails(event.target.value)} placeholder="You can leave this blank" value={reportDetails} />
            </label>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-black" onClick={() => setReportTarget(null)} type="button">Cancel</button>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-black text-white hover:bg-rose-800 disabled:opacity-60" disabled={Boolean(reporting)} onClick={() => void submitReport()} type="button">
                {reporting === reportTarget ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />}
                Report and mute
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function Bubble({ item, onAcknowledge, onReport, reporting }: { item: ChatItem; onAcknowledge: (id: string) => void; onReport: (id: string) => void; reporting: string | null }) {
  const outgoing = item.direction === "outgoing";
  return <div className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
    <article className={cn("max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[76%] lg:max-w-[68%]", outgoing ? "rounded-br-sm bg-blue-700 text-white" : "rounded-bl-sm border border-slate-200/80 bg-white")}>
      {item.senderName && !outgoing ? <p className="mb-0.5 text-xs font-black text-blue-700">{item.senderName}</p> : null}
      {item.title ? <p className={cn("mb-1 text-xs font-black", outgoing ? "text-blue-100" : item.kind === "announcement" ? "text-violet-700" : "text-blue-700")}>{item.title}</p> : null}
      <ChatMessageText
        body={item.body}
        className={cn("whitespace-pre-wrap break-words text-sm leading-5", outgoing ? "text-white" : "text-slate-900")}
        linkClassName={outgoing ? "text-sky-100" : "text-blue-700"}
        linkify={Boolean(item.linkify)}
      />
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
        {item.canReport && item.messageId ? <button aria-label="Report and mute this learner" className="ml-1 text-slate-400 hover:text-rose-700" disabled={reporting === item.messageId} onClick={() => onReport(item.messageId!)} type="button">{reporting === item.messageId ? <Loader2 className="size-3 animate-spin" /> : <Flag className="size-3" />}</button> : null}
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
