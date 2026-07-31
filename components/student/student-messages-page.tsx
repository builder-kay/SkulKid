"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageCircle, Search, ShieldCheck, UserRound, Users } from "lucide-react";
import { StudentClassChat } from "@/components/student/student-class-chat";
import { StudentShell } from "@/components/student/student-shell";
import type { AdviceSuggestionType, StudentClassSummary } from "@/lib/classes/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  body: string;
  attachments?: Array<{ name: string; kind: "image" | "audio" | "file"; url: string }>;
  createdAt: string;
  fromStudent: boolean;
  senderId: string;
  senderName: string;
  senderRole: "student" | "teacher" | "admin";
  kind: "discussion" | "announcement";
  editedAt: string | null;
  readAt?: string | null;
};

type MessageDetail = {
  classroom: { id: string; name: string; teacherName: string };
  messages: ChatMessage[];
  directMessages: ChatMessage[];
  notifications: Array<{ id: string; title: string; body: string; attachments?: Array<{ name: string; kind: "image" | "audio" | "file"; url: string }>; audience: string; createdAt: string }>;
  advice: Array<{ id: string; message: string; suggestionType: AdviceSuggestionType; createdAt: string; readAt: string | null; title?: string | null; feedbackCategory?: "celebration" | "practice" | "intervention" | null; recommendedActions?: Array<{ label: string; href?: string }>; followUpStatus?: "not_required" | "open" | "acknowledged" | "resolved"; dueAt?: string | null; resolutionNote?: string | null }>;
  chat: {
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
};

type Conversation = {
  id: string;
  classId: string;
  kind: "class_group" | "direct";
  name: string;
  subtitle: string;
  preview: string;
  activityAt: string | null;
  unread: number;
};

export function StudentMessagesPage({
  initialClassId,
  initialThread
}: {
  initialClassId: string;
  initialThread?: "group" | "dm";
}) {
  const router = useRouter();
  const [classes, setClasses] = useState<StudentClassSummary[]>([]);
  const [selectedId, setSelectedId] = useState(
    initialClassId ? `${initialThread === "dm" ? "dm" : "group"}:${initialClassId}` : ""
  );
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
        setPreviews((current) => {
          const seeded = { ...current };
          for (const item of next) {
            if (!seeded[`group:${item.id}`] && item.lastMessagePreview) seeded[`group:${item.id}`] = item.lastMessagePreview;
          }
          return seeded;
        });
        setSelectedId((current) => {
          if (!current) return "";
          const classId = current.includes(":") ? current.split(":")[1] : current;
          return next.some((item) => item.id === classId) ? current : "";
        });
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

  const selectedClassId = selectedId.includes(":") ? selectedId.split(":")[1]! : selectedId;
  const selectedKind = selectedId.startsWith("dm:") ? "direct" : "class_group";

  async function loadChat(conversationId: string, silent = false) {
    if (!conversationId) {
      setDetail(null);
      return;
    }
    const classId = conversationId.includes(":") ? conversationId.split(":")[1]! : conversationId;
    const kind = conversationId.startsWith("dm:") ? "direct" : "class_group";
    if (!silent) setLoadingChat(true);
    setError("");
    try {
      const response = await fetch(`/api/student/classes/${classId}`, { cache: "no-store" });
      const payload = await response.json() as MessageDetail & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to open this conversation.");
      if (selectedRef.current === conversationId) {
        setDetail(payload);
        setUnread((current) => ({ ...current, [conversationId]: 0 }));
        if (kind === "direct") {
          await fetch(`/api/student/classes/${classId}/messages`, { cache: "no-store" });
          const latest = (payload.directMessages ?? []).at(-1)?.body;
          if (latest) setPreviews((current) => ({ ...current, [conversationId]: latest }));
        } else {
          const latest = payload.messages.at(-1)?.body || payload.notifications.at(-1)?.body || payload.advice.at(-1)?.message;
          if (latest) setPreviews((current) => ({ ...current, [conversationId]: latest }));
        }
      }
    } catch (cause) {
      if (!silent) setError(cause instanceof Error ? cause.message : "Unable to open this conversation.");
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
          const message = payload.new as { classId?: string; senderId?: string; studentId?: string; scope?: string; body?: string };
          if (!message.classId || !message.scope) return;
          const conversationId = message.scope === "legacy_direct"
            ? `dm:${message.classId}`
            : message.scope === "class_room"
              ? `group:${message.classId}`
              : null;
          if (!conversationId) return;
          if (message.scope === "legacy_direct" && message.studentId && message.studentId !== user.id) return;
          if (message.body) setPreviews((current) => ({ ...current, [conversationId]: message.body! }));
          if (selectedRef.current === conversationId) {
            void loadChat(conversationId, true);
          } else if (message.senderId !== user.id) {
            setUnread((current) => ({ ...current, [conversationId]: (current[conversationId] ?? 0) + 1 }));
          }
        })
        .subscribe();
    });
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  function selectConversation(conversationId: string) {
    setSelectedId(conversationId);
    const classId = conversationId.split(":")[1]!;
    const thread = conversationId.startsWith("dm:") ? "dm" : "group";
    router.replace(`/messages?classId=${encodeURIComponent(classId)}&thread=${thread}`, { scroll: false });
  }

  function showConversationList() {
    setSelectedId("");
    setDetail(null);
    router.replace("/messages", { scroll: false });
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedClassId || !draft.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const scope = selectedKind === "direct" ? "legacy_direct" : "class_room";
      const response = await fetch(`/api/student/classes/${selectedClassId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft, scope })
      });
      const payload = await response.json() as { error?: string; message?: { id: string; body: string; createdAt: string } };
      if (!response.ok) throw new Error(payload.error || "Unable to send your message.");
      if (payload.message) {
        const nextMessage = {
          ...payload.message,
          fromStudent: true,
          senderId: "",
          senderName: "You",
          senderRole: "student" as const,
          kind: "discussion" as const,
          editedAt: null
        };
        setDetail((current) => {
          if (!current) return current;
          if (selectedKind === "direct") {
            return {
              ...current,
              directMessages: current.directMessages.some((item) => item.id === payload.message!.id)
                ? current.directMessages
                : [...current.directMessages, nextMessage]
            };
          }
          return {
            ...current,
            messages: current.messages.some((item) => item.id === payload.message!.id)
              ? current.messages
              : [...current.messages, nextMessage]
          };
        });
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

  const conversations = useMemo<Conversation[]>(() => {
    const needle = query.trim().toLowerCase();
    const items: Conversation[] = [];
    for (const item of classes) {
      const groupId = `group:${item.id}`;
      const dmId = `dm:${item.id}`;
      items.push({
        id: groupId,
        classId: item.id,
        kind: "class_group",
        name: item.name,
        subtitle: `Class group · ${item.teacherName}`,
        preview: previews[groupId] || item.lastMessagePreview || "Supervised class group chat",
        activityAt: item.lastActivityAt,
        unread: unread[groupId] ?? item.unreadAdviceCount
      });
      items.push({
        id: dmId,
        classId: item.id,
        kind: "direct",
        name: item.teacherName,
        subtitle: `Private · ${item.name}`,
        preview: previews[dmId] || "Private chat with your teacher",
        activityAt: item.lastActivityAt,
        unread: unread[dmId] ?? 0
      });
    }
    return items
      .filter((item) => `${item.name} ${item.subtitle}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "class_group" ? -1 : 1;
        return Date.parse(b.activityAt ?? "") - Date.parse(a.activityAt ?? "");
      });
  }, [classes, previews, query, unread]);

  function activityLabel(value: string | null | undefined) {
    if (!value) return "";
    const date = new Date(value);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
    }
    const yesterday = new Date(Date.now() - 86400000);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
  }

  const directChat = detail ? {
    ...detail.chat,
    // Private teacher chat stays available when the group room is paused or outside hours.
    locked: false,
    withinHours: true,
    canPost: detail.chat.consentReady && detail.chat.enabled !== false
  } : null;

  return (
    <StudentShell activeItem="messages">
      <main className="mx-auto w-full max-w-[90rem]">
        <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_22px_65px_rgba(15,23,42,.14)] sm:rounded-[2rem] lg:grid lg:h-[calc(100dvh-4rem)] lg:min-h-[38rem] lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className={cn("min-h-[calc(100dvh-9rem)] border-slate-200 bg-white lg:block lg:min-h-0 lg:border-r", selectedId ? "hidden" : "block")}>
            <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-blue-700 text-white"><MessageCircle className="size-5" /></span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-blue-700">Student messages</p>
                  <h1 className="text-xl font-black">Chats</h1>
                </div>
              </div>
              <label className="relative mt-4 block">
                <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" />
                <input aria-label="Search conversations" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" onChange={(event) => setQuery(event.target.value)} placeholder="Search classes or teachers" value={query} />
              </label>
            </div>
            <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto lg:max-h-[calc(100dvh-12rem)]">
              {loadingClasses ? <div className="grid min-h-48 place-items-center"><Loader2 className="size-7 animate-spin text-blue-700" /></div> : conversations.length ? conversations.map((item) => (
                <button className={cn("flex w-full items-center gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-blue-50", selectedId === item.id && "bg-blue-50")} key={item.id} onClick={() => selectConversation(item.id)} type="button">
                  <span className={cn("grid size-12 shrink-0 place-items-center rounded-full font-black text-white", item.kind === "class_group" ? "bg-gradient-to-br from-emerald-600 to-teal-700" : "bg-gradient-to-br from-blue-600 to-indigo-700")}>
                    {item.kind === "class_group" ? <Users className="size-5" /> : <UserRound className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <b className="truncate text-slate-950">{item.name}</b>
                      <span className="shrink-0 text-[10px] text-slate-400">{activityLabel(item.activityAt)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-bold text-slate-400">{item.subtitle}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{item.preview}</span>
                  </span>
                  {item.unread > 0 ? <span className="grid min-w-6 place-items-center rounded-full bg-blue-600 px-1.5 py-1 text-[10px] font-black text-white">{Math.min(99, item.unread)}</span> : null}
                </button>
              )) : <div className="grid min-h-64 place-items-center p-6 text-center"><div><Users className="mx-auto size-9 text-slate-300" /><h2 className="mt-3 font-black">No conversations yet</h2><p className="mt-1 text-sm text-slate-500">Join an active class to start class group and private teacher chats.</p></div></div>}
            </div>
          </aside>

          <div className={cn("min-w-0 bg-slate-100", selectedId ? "block" : "hidden lg:block")}>
            {selectedId ? (
              <div className="p-2 sm:p-3 lg:h-full lg:p-4">
                <button className="mb-2 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-sm font-black text-blue-700 shadow-sm lg:hidden" onClick={showConversationList} type="button"><ArrowLeft className="size-4" />All conversations</button>
                {error ? <p className="mb-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</p> : null}
                {loadingChat || !detail || !directChat ? <div className="grid min-h-[32rem] place-items-center rounded-2xl bg-white"><Loader2 className="size-8 animate-spin text-blue-700" /></div> : (
                  <StudentClassChat
                    advice={selectedKind === "class_group" ? detail.advice : []}
                    chat={selectedKind === "direct" ? directChat : detail.chat}
                    classId={selectedClassId}
                    className={selectedKind === "direct" ? detail.classroom.teacherName : detail.classroom.name}
                    messages={selectedKind === "direct" ? detail.directMessages : detail.messages}
                    notifications={[]}
                    onChange={setDraft}
                    onReadAdvice={(adviceId) => void markRead(adviceId)}
                    onReported={() => void loadChat(selectedId, true)}
                    onSubmit={send}
                    sending={sending}
                    teacherName={detail.classroom.teacherName}
                    value={draft}
                    variant={selectedKind === "direct" ? "direct" : "class_group"}
                  />
                )}
              </div>
            ) : (
              <div className="hidden h-full place-items-center p-8 text-center lg:grid">
                <div className="max-w-md">
                  <span className="mx-auto grid size-20 place-items-center rounded-full bg-blue-100 text-blue-700"><ShieldCheck className="size-9" /></span>
                  <h2 className="mt-5 text-2xl font-black">Choose a conversation</h2>
                  <p className="mt-2 leading-7 text-slate-600">Open a class group chat with classmates, or message your teacher privately.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </StudentShell>
  );
}
