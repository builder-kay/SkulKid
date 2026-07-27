"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, MoreHorizontal, Plus, RefreshCw, Search, Shield, UserRound, Users, X } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

type Role = "student" | "teacher" | "admin";
type User = { id: string; phone: string | null; email: string | null; displayName: string; role: Role; status: "active" | "suspended"; createdAt: string; lastSignInAt: string | null; grade: number | null; school: string };
type Result = { users: User[]; counts: Record<"all" | Role | "suspended", number>; pagination: { page: number; perPage: number; total: number; pages: number }; error?: string };

export default function AdminUsersPage() {
  return <Suspense fallback={<div className="mx-auto h-96 w-full max-w-[96rem] animate-pulse rounded-[2rem] bg-slate-200" aria-label="Loading people" />}><AdminUsersContent /></Suspense>;
}

function AdminUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<Result | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(searchParams.get("create") === "1");

  const params = useMemo(() => ({
    q: searchParams.get("q") ?? "",
    role: searchParams.get("role") ?? "all",
    status: searchParams.get("status") ?? "all",
    sort: searchParams.get("sort") ?? "created_desc",
    page: searchParams.get("page") ?? "1"
  }), [searchParams]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/users?${new URLSearchParams(params)}`, { cache: "no-store" });
      const data = await response.json() as Result;
      if (!response.ok) throw new Error(data.error || "Could not load people.");
      setResult(data); setSelected([]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load people."); }
    finally { setLoading(false); }
  }, [params]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query === params.q) return;
      updateParams({ q: query, page: "1" });
    }, 350);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, params.q]);

  function updateParams(values: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(values).forEach(([key, value]) => value && value !== "all" ? next.set(key, value) : next.delete(key));
    router.replace(`/admin/users?${next.toString()}`, { scroll: false });
  }

  async function mutate(user: User, patch: Partial<User>, reason: string) {
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, ...patch, reason }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Account update failed.");
  }

  async function bulkStatus(status: "active" | "suspended") {
    const reason = window.prompt(`Reason for ${status === "active" ? "reactivating" : "suspending"} ${selected.length} accounts:`);
    if (!reason || reason.trim().length < 4) return;
    try {
      const targets = result?.users.filter((user) => selected.includes(user.id)) ?? [];
      await Promise.all(targets.map((user) => mutate(user, { status }, reason)));
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Bulk action failed."); }
  }

  function exportVisible() {
    if (!result) return;
    const rows = [["Name", "Role", "Status", "Contact", "Joined"], ...result.users.map((user) => [user.displayName, user.role, user.status, user.email || user.phone || "", user.createdAt])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "skulkid-people.csv"; anchor.click(); URL.revokeObjectURL(url);
  }

  const counts = result?.counts ?? { all: 0, student: 0, teacher: 0, admin: 0, suspended: 0 };
  return (
    <main className="mx-auto grid w-full max-w-[96rem] gap-6">
      <header className="rounded-[2rem] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Identity and access</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">People</h1><p className="mt-2 max-w-2xl text-slate-600">Find every student, teacher, and administrator. Manage access through guarded, audited actions.</p></div>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-black text-white hover:bg-emerald-700" onClick={() => setCreateOpen(true)}><Plus className="size-5" />Add person</button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[
          ["All people", counts.all], ["Students", counts.student], ["Teachers", counts.teacher], ["Admins", counts.admin], ["Suspended", counts.suspended]
        ].map(([label, value]) => <div className="rounded-2xl bg-slate-50 p-4" key={String(label)}><p className="text-2xl font-black">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div>)}</div>
      </header>

      {error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-900">{error}</div> : null}
      <SkulKidCard className="overflow-hidden">
        <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[minmax(15rem,1fr)_auto_auto_auto]">
          <label className="relative"><span className="sr-only">Search people</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input className="min-h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setQuery(event.target.value)} placeholder="Search name, contact or account ID" value={query} /></label>
          <Filter label="Role" value={params.role} onChange={(role) => updateParams({ role, page: "1" })} options={[["all","All roles"],["student","Students"],["teacher","Teachers"],["admin","Admins"]]} />
          <Filter label="Status" value={params.status} onChange={(status) => updateParams({ status, page: "1" })} options={[["all","All status"],["active","Active"],["suspended","Suspended"]]} />
          <Filter label="Sort" value={params.sort} onChange={(sort) => updateParams({ sort, page: "1" })} options={[["created_desc","Newest"],["name_asc","Name A–Z"],["last_sign_in_desc","Recent sign-in"]]} />
        </div>
        <div className="flex min-h-14 flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4">
          <span className="mr-auto text-sm font-bold text-slate-600">{selected.length ? `${selected.length} selected` : `${result?.pagination.total ?? 0} results`}</span>
          {selected.length ? <><button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold" onClick={() => void bulkStatus("active")}>Reactivate</button><button className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white" onClick={() => void bulkStatus("suspended")}>Suspend</button></> : null}
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold" onClick={exportVisible}><Download className="size-4" />Export page</button>
          <button aria-label="Refresh people" className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white" disabled={loading} onClick={() => void load()}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></button>
        </div>
        <div className="hidden overflow-x-auto md:block"><table className="min-w-full text-left text-sm"><thead className="bg-white text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4"><input aria-label="Select page" checked={Boolean(result?.users.length) && selected.length === result?.users.length} onChange={(event) => setSelected(event.target.checked ? result?.users.map((user) => user.id) ?? [] : [])} type="checkbox" /></th><th className="p-4">Person</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Last activity</th><th className="p-4"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td className="p-8 text-slate-500" colSpan={6}>Loading people…</td></tr> : result?.users.map((user) => <UserRow key={user.id} user={user} checked={selected.includes(user.id)} onCheck={(checked) => setSelected((current) => checked ? [...current, user.id] : current.filter((id) => id !== user.id))} onOpen={() => setDetailId(user.id)} />)}</tbody></table></div>
        <div className="grid gap-3 p-3 md:hidden">{result?.users.map((user) => <button className="rounded-2xl border border-slate-200 p-4 text-left" key={user.id} onClick={() => setDetailId(user.id)}><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><UserRound className="size-5" /></span><div><p className="font-black">{user.displayName}</p><p className="text-xs text-slate-500">{user.email || user.phone || "No contact"}</p></div><Status status={user.status} /></div><div className="mt-3 flex gap-2 text-xs font-bold capitalize text-slate-600"><span className="rounded-full bg-slate-100 px-2 py-1">{user.role}</span><span className="px-2 py-1">Joined {new Date(user.createdAt).toLocaleDateString()}</span></div></button>)}</div>
        <div className="flex items-center justify-between border-t border-slate-200 p-4"><p className="text-sm text-slate-500">Page {result?.pagination.page ?? 1} of {result?.pagination.pages ?? 1}</p><div className="flex gap-2"><button className="grid size-10 place-items-center rounded-xl border border-slate-300 disabled:opacity-40" disabled={(result?.pagination.page ?? 1) <= 1} onClick={() => updateParams({ page: String((result?.pagination.page ?? 1) - 1) })}><ChevronLeft className="size-4" /></button><button className="grid size-10 place-items-center rounded-xl border border-slate-300 disabled:opacity-40" disabled={(result?.pagination.page ?? 1) >= (result?.pagination.pages ?? 1)} onClick={() => updateParams({ page: String((result?.pagination.page ?? 1) + 1) })}><ChevronRight className="size-4" /></button></div></div>
      </SkulKidCard>
      {createOpen ? <CreatePerson onClose={() => setCreateOpen(false)} onDone={async () => { setCreateOpen(false); await load(); }} /> : null}
      {detailId ? <PersonDetail userId={detailId} onClose={() => setDetailId(null)} onChanged={load} /> : null}
    </main>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label><span className="sr-only">{label}</span><select className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold" onChange={(event) => onChange(event.target.value)} value={value}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }
function Status({ status }: { status: User["status"] }) { return <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-black capitalize ${status === "active" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{status}</span>; }
function UserRow({ user, checked, onCheck, onOpen }: { user: User; checked: boolean; onCheck: (value: boolean) => void; onOpen: () => void }) { return <tr className="hover:bg-slate-50"><td className="p-4"><input aria-label={`Select ${user.displayName}`} checked={checked} onChange={(event) => onCheck(event.target.checked)} type="checkbox" /></td><td className="p-4"><button className="flex items-center gap-3 text-left" onClick={onOpen}><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><UserRound className="size-5" /></span><span><b className="block text-slate-950">{user.displayName}</b><span className="text-xs text-slate-500">{user.email || user.phone || user.id}</span></span></button></td><td className="p-4"><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black capitalize"><Shield className="size-3" />{user.role}</span></td><td className="p-4"><Status status={user.status} /></td><td className="p-4 text-slate-600">{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "Never signed in"}</td><td className="p-4"><button aria-label={`Manage ${user.displayName}`} className="grid size-10 place-items-center rounded-xl hover:bg-slate-100" onClick={onOpen}><MoreHorizontal className="size-5" /></button></td></tr>; }

function CreatePerson({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ displayName: "", email: "", phone: "", role: "student" as Role, reason: "New account requested by platform administration" }); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); await onDone(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add person."); } finally { setBusy(false); } }
  return <Modal title="Add a person" onClose={onClose}><form className="grid gap-4" onSubmit={submit}><Field label="Display name" value={form.displayName} onChange={(displayName) => setForm({ ...form, displayName })} /><Field label="Email (invitation sent)" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} /><Field label="Phone (if no email)" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} /><label className="grid gap-2 text-sm font-bold">Role<select className="min-h-11 rounded-xl border border-slate-300 px-3" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Administrator</option></select></label><Field label="Administrative reason" value={form.reason} onChange={(reason) => setForm({ ...form, reason })} />{error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</p> : null}<button className="min-h-12 rounded-xl bg-emerald-600 font-black text-white disabled:opacity-50" disabled={busy}>{busy ? "Creating…" : "Create or invite"}</button></form></Modal>;
}

type TeacherTrustDetail = {
  status: "probation" | "content_trusted" | "legacy_trusted" | "monitored" | "banned";
  cleanLessonCount: number;
  trustedAt: string | null;
  monitoringRemaining: number;
};

function PersonDetail({ userId, onClose, onChanged }: { userId: string; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = useState<{
    user: User;
    memberships: unknown[];
    classes: Array<{ id: string; name: string; status: string }>;
    audit: Array<{ id: string; action: string; createdAt: string; reason: string }>;
    trust: TeacherTrustDetail | null;
  } | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    void fetch(`/api/admin/users/${userId}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setData(result);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load this account."));
  }, [userId]);
  useEffect(load, [load]);

  async function update(patch: object, actionName: string) {
    const reason = window.prompt(`Reason for ${actionName}:`);
    if (!reason || reason.trim().length < 4 || !data) return;
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...patch, reason })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      load();
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Update failed.");
    }
  }

  async function destructive(action: "anonymize" | "delete") {
    const reason = window.prompt(`Reason to ${action} this account:`);
    if (!reason) return;
    const confirmation = window.prompt('Type DELETE to confirm:');
    if (confirmation !== "DELETE") return;
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason, confirmation })
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error);
      return;
    }
    onClose();
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <aside aria-modal="true" role="dialog" aria-labelledby="person-title" className="ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Account details</p><h2 className="mt-1 text-2xl font-black" id="person-title">{data?.user.displayName ?? "Loading…"}</h2></div>
          <button aria-label="Close account details" className="grid size-10 place-items-center rounded-xl bg-slate-100" onClick={onClose}><X className="size-5" /></button>
        </div>
        {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 font-bold text-rose-800">{error}</p> : null}
        {data ? (
          <div className="mt-6 grid gap-5">
            <div className="grid grid-cols-2 gap-3">
              {[["Role", data.user.role], ["Status", data.user.status], ["Contact", data.user.email || data.user.phone || "—"], ["Last sign-in", data.user.lastSignInAt ? new Date(data.user.lastSignInAt).toLocaleString() : "Never"]].map(([label, value]) => <div className="rounded-xl bg-slate-50 p-3" key={label}><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 break-words font-black capitalize">{value}</p></div>)}
            </div>
            <section>
              <h3 className="font-black">Access controls</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <select className="min-h-10 rounded-xl border border-slate-300 px-3 font-bold" value={data.user.role} onChange={(event) => void update({ role: event.target.value }, "changing role")}><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select>
                <button className={`rounded-xl px-3 font-bold text-white ${data.user.status === "active" ? "bg-rose-600" : "bg-emerald-600"}`} onClick={() => void update({ status: data.user.status === "active" ? "suspended" : "active" }, data.user.status === "active" ? "suspension" : "reactivation")}>{data.user.status === "active" ? "Suspend" : "Reactivate"}</button>
              </div>
            </section>
            {data.user.role === "teacher" && data.trust ? (
              <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-violet-700">Private content trust</p>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black capitalize text-violet-950">{data.trust.status.replaceAll("_", " ")}</h3>
                    <p className="mt-1 text-sm text-violet-800">{Math.min(data.trust.cleanLessonCount, 10)} of 10 distinct clean lessons{data.trust.monitoringRemaining ? ` · ${data.trust.monitoringRemaining} full checks remaining` : ""}</p>
                  </div>
                  {data.trust.status === "banned" ? (
                    <p className="max-w-xs text-xs font-bold text-rose-700">Reactivate the account to return this teacher to monitored status.</p>
                  ) : data.trust.status === "content_trusted" || data.trust.status === "legacy_trusted" ? (
                    <button className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-black text-white" onClick={() => void update({ trustStatus: "monitored" }, "requiring full content checks")}>Require full checks</button>
                  ) : (
                    <button className="rounded-xl bg-violet-700 px-3 py-2 text-sm font-black text-white" onClick={() => void update({ trustStatus: "content_trusted" }, "restoring content trust")}>Restore content trust</button>
                  )}
                </div>
              </section>
            ) : null}
            <section><h3 className="font-black">Teaching and class context</h3><p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{data.classes.length ? `${data.classes.length} class${data.classes.length === 1 ? "" : "es"} owned: ${data.classes.map((item) => item.name).join(", ")}` : `${data.memberships.length} student class membership${data.memberships.length === 1 ? "" : "s"}`}</p></section>
            <section><h3 className="font-black">Recent administrative history</h3><div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">{data.audit.length ? data.audit.map((item) => <div className="p-3 text-sm" key={item.id}><b className="capitalize">{item.action.replaceAll(".", " ")}</b><p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()} · {item.reason}</p></div>) : <p className="p-3 text-sm text-slate-500">No recorded changes.</p>}</div></section>
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><h3 className="font-black text-rose-950">Privacy actions</h3><p className="mt-1 text-sm text-rose-800">These actions require a reason and typed confirmation.</p><div className="mt-3 flex gap-2"><button className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm font-bold text-rose-800" onClick={() => void destructive("anonymize")}>Anonymize</button><button className="rounded-xl bg-rose-700 px-3 py-2 text-sm font-bold text-white" onClick={() => void destructive("delete")}>Delete account</button></div></section>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3 backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && onClose()}><section aria-modal="true" role="dialog" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black">{title}</h2><button aria-label="Close" className="grid size-10 place-items-center rounded-xl bg-slate-100" onClick={onClose}><X className="size-5" /></button></div>{children}</section></div>; }
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="grid gap-2 text-sm font-bold">{label}<input className="min-h-11 rounded-xl border border-slate-300 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
