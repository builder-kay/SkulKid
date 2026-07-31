"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Megaphone,
  MessageCircle,
  Mic,
  Paperclip,
  Search,
  Send,
  Users,
  X
} from "lucide-react";
import { ChatMessageText } from "@/components/chat/chat-message-text";
import { cn } from "@/lib/utils";

type ThreadMessage = {
  id: string;
  classId: string;
  className: string;
  studentId: string | null;
  studentName: string | null;
  senderId: string;
  senderName: string;
  senderRole: "student" | "teacher" | "admin";
  title: string | null;
  body: string;
  attachments: Array<{ name: string; mime?: string; size?: number; kind: "image" | "audio" | "file"; url: string }>;
  direction: "incoming" | "outgoing";
  kind: "discussion" | "announcement";
  createdAt: string;
  readAt: string | null;
  scope: "class_room" | "legacy_direct";
};

type Thread = {
  id: string;
  kind: "class_group" | "direct";
  classId: string;
  className: string;
  name: string;
  studentId: string | null;
  studentCount: number | null;
  teacherRole: "class_teacher" | "subject_teacher";
  assignedSubjects: Array<{ id: string; name: string }>;
  messages: ThreadMessage[];
  latest: ThreadMessage | null;
  unread: number;
};

type MessagingData = {
  classes: Array<{
    id: string;
    name: string;
    teacherRole: "class_teacher" | "subject_teacher";
    assignedSubjects: Array<{ id: string; name: string }>;
    students: Array<{ id: string; name: string }>;
  }>;
  threads: Thread[];
};

export default function TeacherCommunicationsPage() {
  const [data, setData] = useState<MessagingData>({ classes: [], threads: [] });
  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [courseId, setCourseId] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  async function load(preferredThreadId?: string) {
    const response = await fetch("/api/teacher/communications", { cache: "no-store" });
    const payload = await response.json() as MessagingData & { error?: string };
    if (!response.ok) throw new Error(payload.error || "Unable to load messages.");
    setData(payload);
    setActiveId((current) => preferredThreadId || current || payload.threads[0]?.id || "");
  }

  useEffect(() => {
    void load()
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load messages."))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void load().catch(() => {
        // Keep the current conversation visible during a temporary refresh failure.
      });
    };
    const interval = window.setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const threads = useMemo(() => data.threads ?? [], [data.threads]);
  const visibleThreads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return threads;
    return threads.filter((thread) =>
      `${thread.name} ${thread.className} ${thread.latest?.body ?? ""}`.toLowerCase().includes(needle)
    );
  }, [query, threads]);

  const active = threads.find((thread) => thread.id === activeId) ?? null;
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [active?.messages.length, activeId]);
  useEffect(() => {
    if (active?.kind === "class_group" && active.teacherRole === "subject_teacher") {
      setCourseId(active.assignedSubjects[0]?.id ?? "");
    } else {
      setCourseId("");
    }
  }, [active?.assignedSubjects, active?.id, active?.kind, active?.teacherRole]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!active || (!draft.trim() && !attachments.length)) return;
    if (active.kind === "class_group" && active.teacherRole === "subject_teacher" && !courseId) {
      setError("Choose a subject before posting in this class group.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("payload", JSON.stringify(
        active.kind === "class_group"
          ? {
              mode: "class_group",
              classId: active.classId,
              courseId: active.teacherRole === "subject_teacher" ? courseId : null,
              body: draft.trim() || (attachments.some((file) => file.type.startsWith("audio/")) ? "Voice message" : "Attachment"),
              kind: "discussion"
            }
          : {
              mode: "direct",
              classId: active.classId,
              studentId: active.studentId,
              body: draft.trim() || (attachments.some((file) => file.type.startsWith("audio/")) ? "Voice message" : "Attachment")
            }
      ));
      attachments.forEach((file) => form.append("attachments", file));
      const response = await fetch("/api/teacher/communications", { method: "POST", body: form });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to send message.");
      setDraft("");
      setAttachments([]);
      await load(active.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send message.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) audioChunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const mime = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mime });
        setAttachments((current) => [...current.filter((file) => !file.type.startsWith("audio/")), new File([blob], `voice-${Date.now()}.webm`, { type: mime })].slice(0, 4));
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Microphone access is required to record a voice message.");
    }
  }

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const classThreads = visibleThreads.filter((thread) => thread.kind === "class_group");
  const directThreads = visibleThreads.filter((thread) => thread.kind === "direct");

  return (
    <main className="mx-auto w-full max-w-[96rem]">
      {error ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-900">
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")} type="button"><X className="size-4" /></button>
        </div>
      ) : null}

      <section className="grid h-[calc(100dvh-7rem)] min-h-[30rem] max-h-[52rem] overflow-hidden rounded-[1.75rem] border border-slate-300 bg-white shadow-xl lg:grid-cols-[23rem_minmax(0,1fr)]">
        <aside className={cn("min-h-0 min-w-0 flex-col border-r border-slate-200 bg-white", active ? "hidden lg:flex" : "flex")}>
          <div className="flex h-16 shrink-0 items-center justify-between bg-slate-100 px-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-blue-700 text-white"><MessageCircle className="size-5" /></span>
              <div>
                <h1 className="font-black text-slate-950">Messages</h1>
                <p className="text-xs font-semibold text-slate-500">{classThreads.length} classes · {directThreads.length} learners</p>
              </div>
            </div>
            <button
              aria-label="Create announcement"
              className="grid size-10 place-items-center rounded-full text-slate-600 hover:bg-slate-200"
              onClick={() => setBroadcastOpen(true)}
              title="New announcement"
              type="button"
            >
              <Megaphone className="size-5" />
            </button>
          </div>

          <div className="shrink-0 border-b border-slate-200 p-3">
            <label className="relative block">
              <span className="sr-only">Search conversations</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                className="min-h-10 w-full rounded-lg bg-slate-100 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search classes or learners"
                value={query}
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {loading ? <LoadingState /> : visibleThreads.length ? (
              <>
                {classThreads.length ? (
                  <div className="px-4 pb-1 pt-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Class group chats</div>
                ) : null}
                {classThreads.map((thread) => (
                  <ThreadRow activeId={activeId} key={thread.id} onSelect={setActiveId} thread={thread} />
                ))}
                {directThreads.length ? (
                  <div className="px-4 pb-1 pt-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Private learner chats</div>
                ) : null}
                {directThreads.map((thread) => (
                  <ThreadRow activeId={activeId} key={thread.id} onSelect={setActiveId} thread={thread} />
                ))}
              </>
            ) : <EmptyContacts hasQuery={Boolean(query)} />}
          </div>
        </aside>

        <section className={cn("min-h-0 min-w-0 bg-slate-100", !active && "hidden lg:grid lg:place-items-center")}>
          {active ? (
            <div className="grid h-full min-h-0 grid-rows-[4rem_minmax(0,1fr)_auto]">
              <header className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-3 sm:px-5">
                <button aria-label="Back to conversations" className="grid size-10 place-items-center rounded-full hover:bg-slate-200 lg:hidden" onClick={() => setActiveId("")} type="button"><ArrowLeft className="size-5" /></button>
                <Avatar name={active.name} small group={active.kind === "class_group"} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-black text-slate-950">{active.name}</h2>
                  <p className="truncate text-xs text-slate-500">
                    {active.kind === "class_group"
                      ? `Class group · ${active.studentCount ?? 0} learner${(active.studentCount ?? 0) === 1 ? "" : "s"}`
                      : `Private chat · ${active.className}`}
                  </p>
                </div>
              </header>

              <div className="min-h-0 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_center,rgba(255,255,255,.55)_1px,transparent_1px)] bg-[length:18px_18px] px-3 py-5 sm:px-8" role="log">
                <div className="mx-auto grid max-w-4xl gap-1.5">
                  {active.messages.length ? active.messages.map((message, index) => {
                    const previous = active.messages[index - 1];
                    const showDate = !previous || new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                    return (
                      <div key={message.id}>
                        {showDate ? <DateDivider value={message.createdAt} /> : null}
                        <MessageBubble message={message} showSender={active.kind === "class_group"} />
                      </div>
                    );
                  }) : (
                    <div className="mx-auto mt-16 max-w-md rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-950 shadow-sm">
                      {active.kind === "class_group"
                        ? "This is the supervised class group chat. Messages here are visible to learners in the class."
                        : `Start a private conversation with ${active.name}. Only you and this learner will see it.`}
                    </div>
                  )}
                  <div ref={threadEndRef} />
                </div>
              </div>

              <form className="border-t border-slate-200 bg-slate-100 p-3" onSubmit={sendMessage}>
                {active.kind === "class_group" && active.teacherRole === "subject_teacher" ? (
                  <label className="mb-2 block text-xs font-bold text-slate-600">
                    Posting as subject
                    <select className="mt-1 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold" onChange={(event) => setCourseId(event.target.value)} value={courseId}>
                      <option value="">Choose subject</option>
                      {active.assignedSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </select>
                  </label>
                ) : null}
                <div className="flex items-end gap-2">
                  <input className="hidden" multiple onChange={(event) => setAttachments((current) => [...current, ...Array.from(event.target.files ?? [])].slice(0, 4))} ref={attachmentInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,audio/webm,audio/ogg,audio/mpeg,audio/mp4,audio/wav,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" />
                  <button aria-label="Attach images or files" className="grid size-11 shrink-0 place-items-center rounded-full text-blue-700 hover:bg-blue-100" onClick={() => attachmentInputRef.current?.click()} type="button"><Paperclip className="size-5" /></button>
                  <button aria-label={recording ? "Stop voice recording" : "Record voice message"} className={cn("grid size-11 shrink-0 place-items-center rounded-full", recording ? "animate-pulse bg-rose-600 text-white" : "text-blue-700 hover:bg-blue-100")} onClick={() => void toggleRecording()} type="button"><Mic className="size-5" /></button>
                  <div className="min-w-0 flex-1">
                    {attachments.length ? <div className="mb-2 flex gap-2 overflow-x-auto">{attachments.map((file, index) => <span className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm" key={`${file.name}-${index}`}><span className="max-w-36 truncate">{file.type.startsWith("audio/") ? "Voice message" : file.name}</span><button aria-label={`Remove ${file.name}`} onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button"><X className="size-3.5" /></button></span>)}</div> : null}
                    <textarea
                      aria-label={`Message ${active.name}`}
                      className="max-h-32 min-h-11 w-full resize-none rounded-xl border-0 bg-white px-4 py-3 text-sm leading-5 shadow-sm outline-none focus:ring-2 focus:ring-blue-600"
                      maxLength={1000}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      placeholder={active.kind === "class_group" ? "Message the class group…" : "Type a private message"}
                      rows={1}
                      value={draft}
                    />
                  </div>
                  <button
                    aria-label="Send message"
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-700 text-white transition hover:bg-blue-800 disabled:opacity-50"
                    disabled={busy || recording || (!draft.trim() && !attachments.length)}
                    type="submit"
                  >
                    {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="max-w-md p-8 text-center">
              <span className="mx-auto grid size-20 place-items-center rounded-full bg-blue-100 text-blue-700"><MessageCircle className="size-10" /></span>
              <h2 className="mt-5 text-3xl font-black text-slate-900">SkulKid Messages</h2>
              <p className="mt-3 leading-7 text-slate-600">Open a class group chat to talk with the whole room, or choose a learner for a private conversation.</p>
            </div>
          )}
        </section>
      </section>

      {broadcastOpen ? (
        <BroadcastDialog
          classes={data.classes}
          onClose={() => setBroadcastOpen(false)}
          onSent={async () => {
            setBroadcastOpen(false);
            await load(activeId);
          }}
        />
      ) : null}
    </main>
  );
}

function ThreadRow({ activeId, onSelect, thread }: { activeId: string; onSelect: (id: string) => void; thread: Thread }) {
  return (
    <button
      className={cn(
        "grid w-full grid-cols-[3rem_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50",
        activeId === thread.id && "bg-slate-100"
      )}
      onClick={() => onSelect(thread.id)}
      type="button"
    >
      <Avatar group={thread.kind === "class_group"} name={thread.name} />
      <span className="min-w-0">
        <span className="flex items-center justify-between gap-2">
          <b className="truncate text-sm text-slate-950">{thread.name}</b>
          <time className={cn("shrink-0 text-[11px]", thread.unread ? "font-black text-blue-700" : "text-slate-500")}>
            {thread.latest ? shortTime(thread.latest.createdAt) : ""}
          </time>
        </span>
        <span className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-slate-500">
            {thread.latest?.body
              ?? (thread.kind === "class_group" ? `${thread.studentCount ?? 0} learners in this group` : thread.className)}
          </span>
          {thread.unread ? <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-600 text-[10px] font-black text-white">{thread.unread}</span> : null}
        </span>
      </span>
    </button>
  );
}

function MessageBubble({ message, showSender }: { message: ThreadMessage; showSender: boolean }) {
  const outgoing = message.direction === "outgoing";
  return (
    <div className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
      <article className={cn(
        "relative max-w-[85%] rounded-lg px-3 py-2 shadow-sm sm:max-w-[70%]",
        outgoing ? "rounded-tr-none bg-blue-700 text-white" : "rounded-tl-none bg-white"
      )}>
        {showSender && !outgoing ? <p className="mb-0.5 text-xs font-black text-blue-700">{message.senderName}</p> : null}
        {message.title ? <p className={cn("mb-1 text-xs font-black", outgoing ? "text-blue-100" : "text-violet-700")}>{message.title}</p> : null}
        <ChatMessageText
          body={message.body}
          className={cn("whitespace-pre-wrap break-words text-sm leading-5", outgoing ? "text-white" : "text-slate-900")}
          linkClassName={outgoing ? "text-sky-100" : "text-blue-700"}
          linkify={outgoing || message.senderRole === "teacher" || message.senderRole === "admin"}
        />
        <AttachmentList attachments={message.attachments ?? []} outgoing={outgoing} />
        <div className="mt-1 flex items-center justify-end gap-1 pl-8">
          <time className={cn("text-[10px]", outgoing ? "text-blue-100" : "text-slate-500")}>{messageTime(message.createdAt)}</time>
        </div>
      </article>
    </div>
  );
}

function AttachmentList({ attachments, outgoing }: { attachments: ThreadMessage["attachments"]; outgoing: boolean }) {
  if (!attachments.length) return null;
  return <div className="mt-2 grid gap-2">{attachments.map((attachment) => attachment.kind === "image"
    ? <a href={attachment.url} key={attachment.url} rel="noreferrer" target="_blank"><img alt={attachment.name} className="max-h-72 w-full rounded-lg object-cover" loading="lazy" src={attachment.url} /></a>
    : attachment.kind === "audio"
      ? <audio className="max-w-full" controls key={attachment.url} preload="metadata" src={attachment.url} />
      : <a className={cn("inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black", outgoing ? "border-white/30 text-white" : "border-slate-200 text-blue-700")} download={attachment.name} href={attachment.url} key={attachment.url} rel="noreferrer" target="_blank"><Paperclip className="size-4" /><span className="max-w-48 truncate">{attachment.name}</span></a>)}</div>;
}

function BroadcastDialog({ classes, onClose, onSent }: {
  classes: MessagingData["classes"];
  onClose: () => void;
  onSent: () => Promise<void>;
}) {
  const [audience, setAudience] = useState<"all" | "class" | "selected">("class");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [courseId, setCourseId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const learners = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const classroom of classes) {
      for (const student of classroom.students) map.set(student.id, student);
    }
    return [...map.values()];
  }, [classes]);
  const recipientCount = audience === "all"
    ? learners.length
    : audience === "class"
      ? classes.find((item) => item.id === classId)?.students.length ?? 0
      : selected.length;

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const isClassAnnouncement = audience === "class";
      const selectedClass = classes.find((item) => item.id === classId);
      const payloadData = isClassAnnouncement
        ? { mode: "class_group", classId, courseId: selectedClass?.teacherRole === "subject_teacher" ? courseId : null, body: `${title}\n\n${body}`.slice(0, 1000), kind: "announcement" }
        : {
            audience,
            classId: audience === "selected" ? classId || undefined : undefined,
            studentIds: audience === "selected" ? selected : undefined,
            title,
            body: body.trim() || (attachments.some((file) => file.type.startsWith("audio/")) ? "Voice message" : "Attachment")
          };
      const form = new FormData();
      form.set("payload", JSON.stringify(payloadData));
      attachments.forEach((file) => form.append("attachments", file));
      const response = await fetch(isClassAnnouncement ? "/api/teacher/communications" : "/api/teacher/communications", {
        method: "POST",
        body: form
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to send announcement.");
      await onSent();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send announcement.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRecording() {
    if (recording) { recorderRef.current?.stop(); setRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        setAttachments((current) => [...current.filter((file) => !file.type.startsWith("audio/")), new File([new Blob(chunksRef.current, { type: mime })], `voice-${Date.now()}.webm`, { type: mime })].slice(0, 4));
        streamRef.current?.getTracks().forEach((track) => track.stop());
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access is required to record a voice message.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/55 p-3 backdrop-blur-sm sm:place-items-center" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <form aria-labelledby="broadcast-title" aria-modal="true" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-2xl sm:p-6" onSubmit={submit} role="dialog">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-blue-700">Announcements</p>
            <h2 className="mt-1 text-2xl font-black" id="broadcast-title">Message learners</h2>
          </div>
          <button aria-label="Close" className="grid size-10 place-items-center rounded-xl bg-slate-100" onClick={onClose} type="button"><X className="size-5" /></button>
        </div>
        {error ? <p className="mb-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</p> : null}
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-2">
            {(["class", "selected", "all"] as const).map((value) => (
              <button className={cn("min-h-11 rounded-xl text-sm font-black", audience === value ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700")} key={value} onClick={() => setAudience(value)} type="button">
                {value === "class" ? "Class group" : value === "selected" ? "Selected" : "All"}
              </button>
            ))}
          </div>
          {audience === "class" ? (
            <div className="grid gap-2">
              <select className="min-h-12 rounded-xl border border-slate-300 px-3 font-bold" onChange={(event) => { setClassId(event.target.value); setCourseId(""); }} value={classId}>
                {classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.students.length} learners</option>)}
              </select>
              {classes.find((item) => item.id === classId)?.teacherRole === "subject_teacher" ? (
                <select className="min-h-12 rounded-xl border border-slate-300 px-3 font-bold" onChange={(event) => setCourseId(event.target.value)} required value={courseId}>
                  <option value="">Choose the announcement subject</option>
                  {classes.find((item) => item.id === classId)?.assignedSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              ) : null}
              <p className="rounded-xl bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-900">This announcement will appear inside the selected class group chat.</p>
            </div>
          ) : null}
          {audience === "selected" ? (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {learners.map((contact) => (
                <label className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-slate-50" key={contact.id}>
                  <input checked={selected.includes(contact.id)} onChange={() => setSelected((current) => current.includes(contact.id) ? current.filter((id) => id !== contact.id) : [...current, contact.id])} type="checkbox" />
                  <span className="text-sm font-bold">{contact.name}</span>
                </label>
              ))}
            </div>
          ) : null}
          <input className="min-h-12 rounded-xl border border-slate-300 px-3" maxLength={120} minLength={2} onChange={(event) => setTitle(event.target.value)} placeholder="Announcement title" required value={title} />
          <textarea className="min-h-36 rounded-xl border border-slate-300 p-3" maxLength={1000} minLength={attachments.length ? undefined : 2} onChange={(event) => setBody(event.target.value)} placeholder="Write your message" required={!attachments.length} value={body} />
          <input className="hidden" multiple onChange={(event) => setAttachments((current) => [...current, ...Array.from(event.target.files ?? [])].slice(0, 4))} ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,audio/webm,audio/ogg,audio/mpeg,audio/mp4,audio/wav,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" />
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-200 px-3 text-sm font-black text-blue-700" onClick={() => fileInputRef.current?.click()} type="button"><Paperclip className="size-4" />Add images or files</button>
            <button className={cn("inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-black", recording ? "animate-pulse bg-rose-600 text-white" : "border border-blue-200 text-blue-700")} onClick={() => void toggleRecording()} type="button"><Mic className="size-4" />{recording ? "Stop recording" : "Record audio"}</button>
          </div>
          {attachments.length ? <div className="flex flex-wrap gap-2">{attachments.map((file, index) => <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold" key={`${file.name}-${index}`}>{file.type.startsWith("audio/") ? "Voice message" : file.name}<button onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button"><X className="size-3.5" /></button></span>)}</div> : null}
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 font-black text-white hover:bg-blue-800 disabled:opacity-50" disabled={busy || recording || recipientCount === 0 || (!body.trim() && !attachments.length) || (audience === "class" && classes.find((item) => item.id === classId)?.teacherRole === "subject_teacher" && !courseId)} type="submit">
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
            Send to {recipientCount} learner{recipientCount === 1 ? "" : "s"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Avatar({ name, small = false, group = false }: { name: string; small?: boolean; group?: boolean }) {
  if (group) {
    return <span className={cn("grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 text-white", small ? "size-10" : "size-12")}><Users className={small ? "size-4" : "size-5"} /></span>;
  }
  return <span className={cn("grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 font-black text-white", small ? "size-10 text-xs" : "size-12 text-sm")}>{initials(name)}</span>;
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

function LoadingState() {
  return <div className="grid min-h-64 place-items-center text-sm font-bold text-slate-500"><span><Loader2 className="mx-auto mb-3 size-6 animate-spin text-blue-700" />Loading chats…</span></div>;
}

function EmptyContacts({ hasQuery }: { hasQuery: boolean }) {
  return <div className="p-8 text-center text-sm text-slate-500"><MessageCircle className="mx-auto mb-3 size-8 text-slate-300" />{hasQuery ? "No conversation matches your search." : "Classes and learners will appear here after they join."}</div>;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function messageTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function shortTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString()
    ? messageTime(value)
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}
