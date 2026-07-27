"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  Inbox,
  Loader2,
  Mail,
  MessageSquareText,
  Search,
  Send,
  Sparkles,
  UserRound,
  Users,
  X
} from "lucide-react";
import { TeacherGuideLink } from "@/components/teacher/teacher-guide-link";
import { cn } from "@/lib/utils";

type Audience = "all" | "class" | "selected" | "student";
type MessagingData = {
  classes: Array<{ id: string; name: string; students: Array<{ id: string; name: string }> }>;
  messages: Array<{
    id: string;
    classId: string;
    className: string;
    studentId: string;
    studentName: string;
    body: string;
    createdAt: string;
    readAt: string | null;
  }>;
};

const audienceOptions: Array<{
  value: Audience;
  label: string;
  help: string;
  icon: typeof Users;
}> = [
  { value: "class", label: "One class", help: "Everyone in a class", icon: Users },
  { value: "all", label: "All learners", help: "Every learner you teach", icon: BellRing },
  { value: "selected", label: "Choose learners", help: "A custom group", icon: UserRound },
  { value: "student", label: "One learner", help: "A private notice", icon: MessageSquareText }
];

export default function TeacherCommunicationsPage() {
  const [data, setData] = useState<MessagingData>({ classes: [], messages: [] });
  const [audience, setAudience] = useState<Audience>("class");
  const [classId, setClassId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [messageClass, setMessageClass] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const composerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const composeDeepLinkHandled = useRef(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/teacher/communications", { cache: "no-store" });
    const payload = await response.json() as MessagingData & { error?: string };
    if (!response.ok) throw new Error(payload.error || "Unable to load communications.");
    setData(payload);
    setClassId((current) => current || payload.classes[0]?.id || "");
    setLoading(false);
  }

  useEffect(() => {
    void load().catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Unable to load communications.");
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    if (composeDeepLinkHandled.current) return;
    composeDeepLinkHandled.current = true;
    if (new URLSearchParams(window.location.search).get("compose") !== "1") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("compose");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    window.setTimeout(() => {
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      titleRef.current?.focus({ preventScroll: true });
    }, 180);
  }, []);

  const allStudents = useMemo(() => {
    const map = new Map<string, { id: string; name: string; classes: string[] }>();
    for (const classroom of data.classes) {
      for (const student of classroom.students) {
        const existing = map.get(student.id);
        if (existing) existing.classes.push(classroom.name);
        else map.set(student.id, { ...student, classes: [classroom.name] });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [data.classes]);

  const filteredMessages = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.messages.filter((message) => {
      const matchesClass = messageClass === "all" || message.classId === messageClass;
      const matchesQuery = !needle || `${message.studentName} ${message.className} ${message.body}`.toLowerCase().includes(needle);
      return matchesClass && matchesQuery;
    });
  }, [data.messages, messageClass, query]);

  const recipientCount = useMemo(() => {
    if (audience === "all") return allStudents.length;
    if (audience === "class") return data.classes.find((item) => item.id === classId)?.students.length ?? 0;
    return selected.length;
  }, [allStudents.length, audience, classId, data.classes, selected.length]);

  const unreadCount = data.messages.filter((message) => !message.readAt).length;

  function changeAudience(next: Audience) {
    setAudience(next);
    setSelected([]);
  }

  function prepareReply(message: MessagingData["messages"][number]) {
    setAudience("student");
    setSelected([message.studentId]);
    setTitle(`Reply to ${message.studentName}`);
    setSuccess("");
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => titleRef.current?.focus(), 350);
  }

  async function sendNotification(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/teacher/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          classId: audience === "class" ? classId : undefined,
          studentIds: audience === "selected" || audience === "student" ? selected : undefined,
          title,
          body
        })
      });
      const payload = await response.json() as { error?: string; recipientCount?: number };
      if (!response.ok) throw new Error(payload.error || "Unable to send notification.");
      setSuccess(`Message sent to ${payload.recipientCount} learner${payload.recipientCount === 1 ? "" : "s"}.`);
      setTitle("");
      setBody("");
      setSelected([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send notification.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6">
      <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div aria-hidden="true" className="absolute -right-16 -top-20 size-64 rounded-full bg-violet-600/30 blur-3xl" />
        <div aria-hidden="true" className="absolute bottom-0 right-1/3 size-28 rounded-full bg-cyan-500/20 blur-2xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-300">
              <Sparkles className="size-4" /> Teacher communications
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Messages</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Keep learners informed and respond to questions from your classes.
            </p>
            <TeacherGuideLink
              className="mt-4 border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/20 hover:text-white"
              topic="messages"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[22rem]">
            <Stat value={data.classes.length} label="Classes" />
            <Stat value={allStudents.length} label="Learners" />
            <Stat value={unreadCount} label="Unread" accent={unreadCount > 0} />
          </div>
        </div>
      </header>

      <div aria-live="polite" className="grid gap-2">
        {error ? (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900">
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")} type="button"><X className="size-5" /></button>
          </div>
        ) : null}
        {success ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-900">
            <span className="flex items-center gap-2"><CheckCircle2 className="size-5" />{success}</span>
            <button aria-label="Dismiss confirmation" onClick={() => setSuccess("")} type="button"><X className="size-5" /></button>
          </div>
        ) : null}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
        <section className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-teal-700">Learner inbox</p>
                <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-slate-950">
                  <Inbox className="size-6" /> Recent messages
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                {filteredMessages.length} message{filteredMessages.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_12rem]">
              <label className="relative">
                <span className="sr-only">Search messages</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search learner or message"
                  value={query}
                />
              </label>
              <label>
                <span className="sr-only">Filter by class</span>
                <select
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  onChange={(event) => setMessageClass(event.target.value)}
                  value={messageClass}
                >
                  <option value="all">All classes</option>
                  {data.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="max-h-[46rem] overflow-y-auto p-3 sm:p-4">
            {loading ? (
              <div className="grid min-h-56 place-items-center text-center text-sm font-bold text-slate-500">
                <span><Loader2 className="mx-auto mb-3 size-7 animate-spin text-violet-600" />Loading messages…</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="grid min-h-56 place-items-center rounded-2xl bg-slate-50 p-6 text-center">
                <div>
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm"><Mail className="size-6" /></span>
                  <p className="mt-3 font-black text-slate-900">{data.messages.length ? "No messages match your search" : "No learner messages yet"}</p>
                  <p className="mt-1 text-sm text-slate-500">{data.messages.length ? "Try another name, keyword, or class." : "New messages from your learners will appear here."}</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredMessages.map((message) => (
                  <article
                    className={cn(
                      "group rounded-2xl border p-4 transition hover:border-violet-200 hover:shadow-sm sm:p-5",
                      message.readAt ? "border-slate-200 bg-white" : "border-violet-200 bg-violet-50/55"
                    )}
                    key={message.id}
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-sm font-black text-white">
                        {initials(message.studentName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <h3 className="truncate font-black text-slate-950">{message.studentName}</h3>
                            {!message.readAt ? <span className="size-2 shrink-0 rounded-full bg-violet-600" title="Unread" /> : null}
                          </div>
                          <time className="text-xs font-semibold text-slate-500">{formatMessageDate(message.createdAt)}</time>
                        </div>
                        <span className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">
                          {message.className}
                        </span>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.body}</p>
                        <button
                          className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-black text-violet-700 transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                          onClick={() => prepareReply(message)}
                          type="button"
                        >
                          Reply to learner <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="xl:sticky xl:top-8" ref={composerRef}>
          <form className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={sendNotification}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-violet-700">New message</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Send an update</h2>
                <p className="mt-1 text-sm text-slate-500">Choose who should receive this notification.</p>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Send className="size-5" /></span>
            </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-black text-slate-800">Send to</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {audienceOptions.map((option) => {
                  const Icon = option.icon;
                  const active = audience === option.value;
                  return (
                    <button
                      aria-pressed={active}
                      className={cn(
                        "min-h-[5.25rem] rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                        active ? "border-violet-600 bg-violet-50 text-violet-950 ring-1 ring-violet-600" : "border-slate-200 hover:border-violet-200 hover:bg-slate-50"
                      )}
                      key={option.value}
                      onClick={() => changeAudience(option.value)}
                      type="button"
                    >
                      <Icon className={cn("size-5", active ? "text-violet-700" : "text-slate-500")} />
                      <span className="mt-2 block text-sm font-black">{option.label}</span>
                      <span className="block text-[11px] font-semibold text-slate-500">{option.help}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {audience === "class" ? (
              <label className="mt-4 grid gap-1.5 text-sm font-black text-slate-800">
                Choose class
                <select
                  className="min-h-12 rounded-xl border border-slate-300 bg-slate-50 px-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  onChange={(event) => setClassId(event.target.value)}
                  required
                  value={classId}
                >
                  {data.classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.students.length} learners</option>)}
                </select>
              </label>
            ) : null}

            {audience === "selected" || audience === "student" ? (
              <fieldset className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <legend className="text-sm font-black text-slate-800">{audience === "student" ? "Choose one learner" : "Choose learners"}</legend>
                  <span className="text-xs font-bold text-violet-700">{selected.length} selected</span>
                </div>
                <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                  {allStudents.length === 0 ? <p className="p-3 text-sm text-slate-500">No learners are available yet.</p> : allStudents.map((student) => (
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg bg-white p-2.5 transition hover:bg-violet-50" key={student.id}>
                      <input
                        checked={selected.includes(student.id)}
                        className="size-4 accent-violet-700"
                        name="notification-students"
                        onChange={() => setSelected((current) => audience === "student" ? [student.id] : current.includes(student.id) ? current.filter((id) => id !== student.id) : [...current, student.id])}
                        type={audience === "student" ? "radio" : "checkbox"}
                      />
                      <span className="min-w-0">
                        <b className="block truncate text-sm">{student.name}</b>
                        <span className="block truncate text-xs text-slate-500">{student.classes.join(", ")}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <label className="mt-4 grid gap-1.5 text-sm font-black text-slate-800">
              Subject
              <input
                className="min-h-12 rounded-xl border border-slate-300 px-3 outline-none placeholder:font-normal focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                maxLength={120}
                minLength={2}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What is this message about?"
                ref={titleRef}
                required
                value={title}
              />
            </label>
            <label className="mt-4 grid gap-1.5 text-sm font-black text-slate-800">
              Message
              <textarea
                className="min-h-36 resize-y rounded-xl border border-slate-300 px-3 py-3 font-normal leading-6 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                maxLength={1000}
                minLength={2}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write a clear and encouraging message…"
                required
                value={body}
              />
              <span className="text-right text-xs font-semibold text-slate-400">{body.length}/1000</span>
            </label>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
              <span>{recipientCount} recipient{recipientCount === 1 ? "" : "s"}</span>
              <span>Sent as a notification</span>
            </div>
            <button
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy || loading || recipientCount === 0}
              type="submit"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {busy ? "Sending…" : `Send to ${recipientCount || ""} learner${recipientCount === 1 ? "" : "s"}`}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Stat({ value, label, accent = false }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border px-3 py-3 text-center", accent ? "border-violet-400/40 bg-violet-500/20" : "border-white/10 bg-white/5")}>
      <span className="block text-xl font-black">{value}</span>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">{label}</span>
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function formatMessageDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat(undefined, sameDay
    ? { hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", year: date.getFullYear() === now.getFullYear() ? undefined : "numeric" }
  ).format(date);
}
