"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageCircle, Search, ShieldCheck, Users } from "lucide-react";
import { StudentClassChat } from "@/components/student/student-class-chat";
import { StudentShell } from "@/components/student/student-shell";
import type { AdviceSuggestionType, StudentClassSummary } from "@/lib/classes/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type MessageDetail = {
  classroom: { id: string; name: string; teacherName: string };
  messages: Array<{ id: string; body: string; attachments?: Array<{ name: string; kind: "image" | "audio" | "file"; url: string }>; createdAt: string; fromStudent: boolean; senderId: string; senderName: string; senderRole: "student" | "teacher" | "admin"; kind: "discussion" | "announcement"; editedAt: string | null }>;
  notifications: Array<{ id: string; title: string; body: string; attachments?: Array<{ name: string; kind: "image" | "audio" | "file"; url: string }>; audience: string; createdAt: string }>;
  advice: Array<{ id: string; message: string; suggestionType: AdviceSuggestionType; createdAt: string; readAt: string | null; title?: string | null; feedbackCategory?: "celebration" | "practice" | "intervention" | null; recommendedActions?: Array<{ label: string; href?: string }>; followUpStatus?: "not_required" | "open" | "acknowledged" | "resolved"; dueAt?: string | null; resolutionNote?: string | null }>;
  chat: {
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
};

export function StudentMessagesPage({ initialClassId }: { initialClassId: string }) {
  const router = useRouter();
  const [classes, setClasses] = useState<StudentClassSummary[]>([]);
  const [selectedId, setSelectedId] = useState(initialClassId);
  const [detail, setDetail] = useState<MessageDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const selectedRef = useRef(selectedId);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    let active = true;
    void fetch("/api/student/classes", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { classes?: StudentClassSummary[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Unable to load class conversations.");
        if (!active) return;
        const next = payload.classes ?? [];
        setClasses(next);
        setSelectedId((current) => current && next.some((item) => item.id === current) ? current : "");
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load class conversations.");
      })
      .finally(() => {
        if (active) setLoadingClasses(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function loadChat(classId: string, silent = false) {
    if (!classId) {
      setDetail(null);
      return;
    }
    if (!silent) setLoadingChat(true);
    setError("");
    try {
      const response = await fetch(`/api/student/classes/${classId}`, { cache: "no-store" });
      const payload = await response.json() as MessageDetail & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to open this class conversation.");
      if (selectedRef.current === classId) {
        setDetail(payload);
        setUnread((current) => ({ ...current, [classId]: 0 }));
        const latest = payload.messages.at(-1)?.body || payload.notifications.at(-1)?.body || payload.advice.at(-1)?.message;
        if (latest) setPreviews((current) => ({ ...current, [classId]: latest }));
      }
    } catch (cause) {
      if (!silent) setError(cause instanceof Error ? cause.message : "Unable to open this class conversation.");
    } finally {
      if (!silent) setLoadingChat(false);
    }
  }

  useEffect(() => {
    setDetail(null);
    setDraft("");
    if (selectedId) void loadChat(selectedId);
  }, [selectedId]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;
      channel = supabase
        .channel(`student-messages-workspace:${user.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "ClassMessage" }, (payload) => {
          const message = payload.new as { classId?: string; senderId?: string; scope?: string; body?: string };
          if (message.scope !== "class_room" || !message.classId) return;
          if (message.body) setPreviews((current) => ({ ...current, [message.classId!]: message.body! }));
          if (selectedRef.current === message.classId) {
            void loadChat(message.classId, true);
          } else if (message.senderId !== user.id) {
            setUnread((current) => ({ ...current, [message.classId!]: (current[message.classId!] ?? 0) + 1 }));
          }
        })
        .subscribe();
    });
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  function selectClass(classId: string) {
    setSelectedId(classId);
    router.replace(`/messages?classId=${encodeURIComponent(classId)}`, { scroll: false });
  }

  function showConversationList() {
    setSelectedId("");
    setDetail(null);
    router.replace("/messages", { scroll: false });
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/student/classes/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft })
      });
      const payload = await response.json() as { error?: string; message?: { id: string; body: string; createdAt: string } };
      if (!response.ok) throw new Error(payload.error || "Unable to send your message.");
      if (payload.message) {
        setDetail((current) => current ? {
          ...current,
          messages: current.messages.some((item) => item.id === payload.message!.id)
            ? current.messages
            : [...current.messages, { ...payload.message!, fromStudent: true, senderId: "", senderName: "You", senderRole: "student", kind: "discussion", editedAt: null }]
        } : current);
        setPreviews((current) => ({ ...current, [selectedId]: payload.message!.body }));
      }
      setDraft("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send your message.");
    } finally {
      setSending(false);
    }
  }

  async function markRead(adviceId: string) {
    await fetch(`/api/student/advice/${adviceId}/read`, { method: "POST" });
    setDetail((current) => current ? {
      ...current,
      advice: current.advice.map((item) => item.id === adviceId ? { ...item, readAt: new Date().toISOString() } : item)
    } : current);
  }

  const visibleClasses = classes.filter((item) =>
    `${item.name} ${item.teacherName}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <StudentShell activeItem="messages">
      <main className="mx-auto w-full max-w-[90rem]">
        <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_22px_65px_rgba(15,23,42,.14)] sm:rounded-[2rem] lg:grid lg:h-[calc(100dvh-4rem)] lg:min-h-[38rem] lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className={cn("min-h-[calc(100dvh-9rem)] border-slate-200 bg-white lg:block lg:min-h-0 lg:border-r", selectedId ? "hidden" : "block")}>
            <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-blue-700 text-white"><MessageCircle className="size-5" /></span>
                <div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Student messages</p><h1 className="text-xl font-black">Class conversations</h1></div>
              </div>
              <label className="relative mt-4 block">
                <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" />
                <input aria-label="Search class conversations" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" onChange={(event) => setQuery(event.target.value)} placeholder="Search classes" value={query} />
              </label>
            </div>
            <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto lg:max-h-[calc(100dvh-12rem)]">
              {loadingClasses ? <div className="grid min-h-48 place-items-center"><Loader2 className="size-7 animate-spin text-blue-700" /></div> : visibleClasses.length ? visibleClasses.map((item, index) => (
                <button className={cn("flex w-full items-center gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-blue-50", selectedId === item.id && "bg-blue-50")} key={item.id} onClick={() => selectClass(item.id)} type="button">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 font-black text-white">{item.name.slice(0, 2).toUpperCase()}</span>
                  <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><b className="truncate text-slate-950">{item.name}</b><span className="shrink-0 text-[10px] text-slate-400">{index === 0 ? "Recent" : ""}</span></span><span className="mt-0.5 block truncate text-xs text-slate-500">{previews[item.id] || `Supervised by ${item.teacherName}`}</span></span>
                  {(unread[item.id] ?? item.unreadAdviceCount) > 0 ? <span className="grid min-w-6 place-items-center rounded-full bg-blue-600 px-1.5 py-1 text-[10px] font-black text-white">{Math.min(99, unread[item.id] ?? item.unreadAdviceCount)}</span> : null}
                </button>
              )) : <div className="grid min-h-64 place-items-center p-6 text-center"><div><Users className="mx-auto size-9 text-slate-300" /><h2 className="mt-3 font-black">No class conversations</h2><p className="mt-1 text-sm text-slate-500">Join an active class to start seeing supervised group chats.</p></div></div>}
            </div>
          </aside>

          <div className={cn("min-w-0 bg-slate-100", selectedId ? "block" : "hidden lg:block")}>
            {selectedId ? (
              <div className="p-2 sm:p-3 lg:h-full lg:p-4">
                <button className="mb-2 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-sm font-black text-blue-700 shadow-sm lg:hidden" onClick={showConversationList} type="button"><ArrowLeft className="size-4" />All conversations</button>
                {error ? <p className="mb-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</p> : null}
                {loadingChat || !detail ? <div className="grid min-h-[32rem] place-items-center rounded-2xl bg-white"><Loader2 className="size-8 animate-spin text-blue-700" /></div> : (
                  <StudentClassChat
                    advice={detail.advice}
                    chat={detail.chat}
                    classId={selectedId}
                    className={detail.classroom.name}
                    messages={detail.messages}
                    notifications={detail.notifications}
                    onChange={setDraft}
                    onReadAdvice={(adviceId) => void markRead(adviceId)}
                    onReported={() => void loadChat(selectedId, true)}
                    onSubmit={send}
                    sending={sending}
                    teacherName={detail.classroom.teacherName}
                    value={draft}
                  />
                )}
              </div>
            ) : (
              <div className="hidden h-full place-items-center p-8 text-center lg:grid">
                <div className="max-w-md"><span className="mx-auto grid size-20 place-items-center rounded-full bg-blue-100 text-blue-700"><ShieldCheck className="size-9" /></span><h2 className="mt-5 text-2xl font-black">Choose a class conversation</h2><p className="mt-2 leading-7 text-slate-600">Each class is a supervised group chat. Select one to read announcements, feedback and messages from active classmates.</p></div>
              </div>
            )}
          </div>
        </section>
      </main>
    </StudentShell>
  );
}
