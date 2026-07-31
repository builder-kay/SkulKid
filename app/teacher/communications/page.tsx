"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BellRing,
  CheckCheck,
  Loader2,
  Megaphone,
  MessageCircle,
  MoreVertical,
  Search,
  Send,
  UserRound,
  Users,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  title: string | null;
  body: string;
  direction: "incoming" | "outgoing";
  createdAt: string;
  readAt: string | null;
};

type MessagingData = {
  classes: Array<{ id: string; name: string; teacherRole: "class_teacher" | "subject_teacher"; assignedSubjects: Array<{ id: string; name: string }>; students: Array<{ id: string; name: string }> }>;
  messages: Message[];
};

type Contact = {
  id: string;
  name: string;
  classes: Array<{ id: string; name: string }>;
  messages: Message[];
  latest: Message | null;
  unread: number;
};

export default function TeacherCommunicationsPage() {
  const [data, setData] = useState<MessagingData>({ classes: [], messages: [] });
  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  async function load(preferredStudentId?: string) {
    const response = await fetch("/api/teacher/communications", { cache: "no-store" });
    const payload = await response.json() as MessagingData & { error?: string };
    if (!response.ok) throw new Error(payload.error || "Unable to load messages.");
    setData(payload);
    const studentIds = payload.classes.flatMap((item) => item.students.map((student) => student.id));
    setActiveId((current) => preferredStudentId || current || studentIds[0] || "");
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

  const contacts = useMemo<Contact[]>(() => {
    const map = new Map<string, Contact>();
    for (const classroom of data.classes) {
      for (const student of classroom.students) {
        const contact = map.get(student.id) ?? {
          id: student.id,
          name: student.name,
          classes: [],
          messages: [],
          latest: null,
          unread: 0
        };
        if (!contact.classes.some((item) => item.id === classroom.id)) {
          contact.classes.push({ id: classroom.id, name: classroom.name });
        }
        map.set(student.id, contact);
      }
    }
    for (const message of data.messages) {
      const contact = map.get(message.studentId);
      if (!contact) continue;
      contact.messages.push(message);
      contact.latest = !contact.latest || Date.parse(message.createdAt) > Date.parse(contact.latest.createdAt)
        ? message
        : contact.latest;
      if (message.direction === "incoming" && !message.readAt) contact.unread += 1;
    }
    return [...map.values()].sort((a, b) => {
      if (a.latest && b.latest) return Date.parse(b.latest.createdAt) - Date.parse(a.latest.createdAt);
      if (a.latest) return -1;
      if (b.latest) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [data]);

  const visibleContacts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter((contact) =>
      `${contact.name} ${contact.classes.map((item) => item.name).join(" ")} ${contact.latest?.body ?? ""}`
        .toLowerCase()
        .includes(needle)
    );
  }, [contacts, query]);

  const active = contacts.find((contact) => contact.id === activeId) ?? null;
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [active?.messages.length, activeId]);

  async function sendPrivateMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!active || !draft.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/teacher/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: "student",
          studentIds: [active.id],
          title: "Message from your teacher",
          body: draft
        })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to send message.");
      setDraft("");
      await load(active.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send message.");
    } finally {
      setBusy(false);
    }
  }

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
              <div><h1 className="font-black text-slate-950">Messages</h1><p className="text-xs font-semibold text-slate-500">{contacts.length} learners</p></div>
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
                placeholder="Search or start a new chat"
                value={query}
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {loading ? <LoadingState /> : visibleContacts.length ? visibleContacts.map((contact) => (
              <button
                className={cn(
                  "grid w-full grid-cols-[3rem_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50",
                  activeId === contact.id && "bg-slate-100"
                )}
                key={contact.id}
                onClick={() => setActiveId(contact.id)}
                type="button"
              >
                <Avatar name={contact.name} />
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <b className="truncate text-sm text-slate-950">{contact.name}</b>
                    <time className={cn("shrink-0 text-[11px]", contact.unread ? "font-black text-blue-700" : "text-slate-500")}>
                      {contact.latest ? shortTime(contact.latest.createdAt) : ""}
                    </time>
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1 truncate text-xs text-slate-500">
                      {contact.latest?.direction === "outgoing" ? <CheckCheck className="size-4 shrink-0 text-sky-600" /> : null}
                      <span className="truncate">{contact.latest?.body ?? contact.classes.map((item) => item.name).join(", ")}</span>
                    </span>
                    {contact.unread ? <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-600 text-[10px] font-black text-white">{contact.unread}</span> : null}
                  </span>
                </span>
              </button>
            )) : <EmptyContacts hasQuery={Boolean(query)} />}
          </div>
        </aside>

        <section className={cn("min-h-0 min-w-0 bg-slate-100", !active && "hidden lg:grid lg:place-items-center")}>
          {active ? (
            <div className="grid h-full min-h-0 grid-rows-[4rem_minmax(0,1fr)_auto]">
              <header className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-3 sm:px-5">
                <button aria-label="Back to conversations" className="grid size-10 place-items-center rounded-full hover:bg-slate-200 lg:hidden" onClick={() => setActiveId("")} type="button"><ArrowLeft className="size-5" /></button>
                <Avatar name={active.name} small />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-black text-slate-950">{active.name}</h2>
                  <p className="truncate text-xs text-slate-500">{active.classes.map((item) => item.name).join(" · ")}</p>
                </div>
                <button aria-label="Conversation options" className="grid size-10 place-items-center rounded-full text-slate-600 hover:bg-slate-200" type="button"><MoreVertical className="size-5" /></button>
              </header>

              <div className="min-h-0 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_center,rgba(255,255,255,.55)_1px,transparent_1px)] bg-[length:18px_18px] px-3 py-5 sm:px-8">
                <div className="mx-auto grid max-w-4xl gap-1.5">
                  {active.messages.length ? active.messages.map((message, index) => {
                    const previous = active.messages[index - 1];
                    const showDate = !previous || new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                    return (
                      <div key={message.id}>
                        {showDate ? <DateDivider value={message.createdAt} /> : null}
                        <MessageBubble message={message} />
                      </div>
                    );
                  }) : (
                    <div className="mx-auto mt-16 max-w-md rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-950 shadow-sm">
                      Start a private conversation with {active.name}. Messages will appear here in chronological order.
                    </div>
                  )}
                  <div ref={threadEndRef} />
                </div>
              </div>

              <form className="flex items-end gap-2 border-t border-slate-200 bg-slate-100 p-3" onSubmit={sendPrivateMessage}>
                <textarea
                  aria-label={`Message ${active.name}`}
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border-0 bg-white px-4 py-3 text-sm leading-5 shadow-sm outline-none focus:ring-2 focus:ring-blue-600"
                  maxLength={1000}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Type a message"
                  rows={1}
                  value={draft}
                />
                <button
                  aria-label="Send message"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-700 text-white transition hover:bg-blue-800 disabled:opacity-50"
                  disabled={busy || !draft.trim()}
                  type="submit"
                >
                  {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                </button>
              </form>
            </div>
          ) : (
            <div className="max-w-md p-8 text-center">
              <span className="mx-auto grid size-20 place-items-center rounded-full bg-blue-100 text-blue-700"><MessageCircle className="size-10" /></span>
              <h2 className="mt-5 text-3xl font-black text-slate-900">SkulKid Messages</h2>
              <p className="mt-3 leading-7 text-slate-600">Select a learner to continue a private conversation, or use the announcement button to post in a supervised class chat.</p>
            </div>
          )}
        </section>
      </section>

      {broadcastOpen ? (
        <BroadcastDialog
          classes={data.classes}
          contacts={contacts}
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

function MessageBubble({ message }: { message: Message }) {
  const outgoing = message.direction === "outgoing";
  return (
    <div className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
      <article className={cn(
        "relative max-w-[85%] rounded-lg px-3 py-2 shadow-sm sm:max-w-[70%]",
        outgoing ? "rounded-tr-none bg-blue-700 text-white" : "rounded-tl-none bg-white"
      )}>
        {message.title && message.title !== "Message from your teacher" ? <p className={cn("mb-1 text-xs font-black", outgoing ? "text-blue-100" : "text-blue-800")}>{message.title}</p> : null}
        <p className={cn("whitespace-pre-wrap break-words text-sm leading-5", outgoing ? "text-white" : "text-slate-900")}>{message.body}</p>
        <div className="mt-1 flex items-center justify-end gap-1 pl-8">
          <time className={cn("text-[10px]", outgoing ? "text-blue-100" : "text-slate-500")}>{messageTime(message.createdAt)}</time>
          {outgoing ? <CheckCheck className="size-4 text-sky-200" /> : null}
        </div>
      </article>
    </div>
  );
}

function BroadcastDialog({ classes, contacts, onClose, onSent }: {
  classes: MessagingData["classes"];
  contacts: Contact[];
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
  const recipientCount = audience === "all"
    ? contacts.length
    : audience === "class"
      ? classes.find((item) => item.id === classId)?.students.length ?? 0
      : selected.length;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const isClassAnnouncement = audience === "class";
      const selectedClass = classes.find((item) => item.id === classId);
      const response = await fetch(isClassAnnouncement ? "/api/teacher/class-safety" : "/api/teacher/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isClassAnnouncement
          ? { classId, courseId: selectedClass?.teacherRole === "subject_teacher" ? courseId : null, body: `${title}\n\n${body}`.slice(0, 1000), kind: "announcement" }
          : {
              audience,
              studentIds: audience === "selected" ? selected : undefined,
              title,
              body
            })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || (isClassAnnouncement ? "Unable to post announcement." : "Unable to send broadcast."));
      await onSent();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send broadcast.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <form className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <header className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white">
          <div className="flex items-center gap-3"><Megaphone className="size-6" /><div><h2 className="text-xl font-black">New announcement</h2><p className="text-xs text-blue-100">Post to a class chat or notify selected learners</p></div></div>
          <button aria-label="Close broadcast" className="grid size-10 place-items-center rounded-full hover:bg-white/10" onClick={onClose} type="button"><X /></button>
        </header>
        <div className="grid gap-4 p-5">
          {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-900">{error}</p> : null}
          <div className="grid grid-cols-3 gap-2">
            {([
              ["class", "One class", Users],
              ["all", "All learners", BellRing],
              ["selected", "Choose people", UserRound]
            ] as const).map(([value, label, Icon]) => (
              <button className={cn("rounded-xl border p-3 text-sm font-black", audience === value ? "border-blue-700 bg-blue-50 text-blue-900" : "border-slate-200")} key={value} onClick={() => setAudience(value)} type="button"><Icon className="mx-auto mb-2 size-5" />{label}</button>
            ))}
          </div>
          {audience === "class" ? <div className="grid gap-2"><select className="min-h-12 rounded-xl border border-slate-300 px-3 font-bold" onChange={(event) => { setClassId(event.target.value); setCourseId(""); }} value={classId}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.students.length} learners</option>)}</select>{classes.find((item) => item.id === classId)?.teacherRole === "subject_teacher" ? <select className="min-h-12 rounded-xl border border-slate-300 px-3 font-bold" onChange={(event) => setCourseId(event.target.value)} required value={courseId}><option value="">Choose the announcement subject</option>{classes.find((item) => item.id === classId)?.assignedSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select> : null}<p className="rounded-xl bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-900">This announcement will appear inside the selected class group chat.</p></div> : null}
          {audience === "selected" ? <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-2">{contacts.map((contact) => <label className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-slate-50" key={contact.id}><input checked={selected.includes(contact.id)} onChange={() => setSelected((current) => current.includes(contact.id) ? current.filter((id) => id !== contact.id) : [...current, contact.id])} type="checkbox" /><span className="text-sm font-bold">{contact.name}</span></label>)}</div> : null}
          <input className="min-h-12 rounded-xl border border-slate-300 px-3" maxLength={120} minLength={2} onChange={(event) => setTitle(event.target.value)} placeholder="Announcement title" required value={title} />
          <textarea className="min-h-36 rounded-xl border border-slate-300 p-3" maxLength={1000} minLength={2} onChange={(event) => setBody(event.target.value)} placeholder="Write your message" required value={body} />
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 font-black text-white hover:bg-blue-800 disabled:opacity-50" disabled={busy || recipientCount === 0 || (audience === "class" && classes.find((item) => item.id === classId)?.teacherRole === "subject_teacher" && !courseId)} type="submit">{busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}Send to {recipientCount} learner{recipientCount === 1 ? "" : "s"}</button>
        </div>
      </form>
    </div>
  );
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
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
  return <div className="p-8 text-center text-sm text-slate-500"><MessageCircle className="mx-auto mb-3 size-8 text-slate-300" />{hasQuery ? "No conversation matches your search." : "Learners will appear here after joining your classes."}</div>;
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
