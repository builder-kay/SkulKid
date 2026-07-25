"use client";

import { useEffect, useState } from "react";
import { Check, RefreshCw, Search, Shield, UserRound, Users, X } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

type AdminUser = {
  id: string;
  phone: string | null;
  email: string | null;
  displayName: string;
  role: "student" | "teacher" | "admin";
  createdAt: string;
  lastSignInAt: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AdminUser["role"]>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, AdminUser["role"]>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/users");
      const result = await response.json() as { users?: AdminUser[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load users.");
      setUsers(result.users ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function updateRole(userId: string, role: AdminUser["role"]) {
    setBusyId(userId);
    setError("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not update role.");
      setPendingRoles((current) => {
        const next = { ...current };
        delete next[userId];
        return next;
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update role.");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = users.filter((user) => {
    const haystack = `${user.displayName} ${user.phone ?? ""} ${user.email ?? ""} ${user.role}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase()) && (roleFilter === "all" || user.role === roleFilter);
  });
  const counts = {
    all: users.length,
    student: users.filter((user) => user.role === "student").length,
    teacher: users.filter((user) => user.role === "teacher").length,
    admin: users.filter((user) => user.role === "admin").length
  };

  return (
    <main className="mx-auto grid w-full max-w-[90rem] gap-6">
      <header className="rounded-[2rem] border border-white bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-700">User management</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Learners, teachers and admins</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Search accounts and assign the right workspace role.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <Summary label="All accounts" value={counts.all} icon={Users} />
          <Summary label="Learners" value={counts.student} icon={UserRound} />
          <Summary label="Teachers" value={counts.teacher} icon={Shield} />
          <Summary className="sm:col-span-3 xl:col-span-1" label="Admins" value={counts.admin} icon={Shield} />
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">{error}</div> : null}

      <SkulKidCard className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <label className="relative block flex-1">
              <span className="sr-only">Search users</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, phone, email or role" value={query} />
            </label>
            <select aria-label="Filter users by role" className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold" onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)} value={roleFilter}>
              <option value="all">All roles ({counts.all})</option>
              <option value="student">Learners ({counts.student})</option>
              <option value="teacher">Teachers ({counts.teacher})</option>
              <option value="admin">Admins ({counts.admin})</option>
            </select>
          </div>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50" disabled={loading} onClick={() => void load()} type="button">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td className="px-4 py-8 text-slate-500" colSpan={5}>Loading users…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-4 py-8 text-slate-500" colSpan={5}>No users found.</td></tr>
              ) : filtered.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><UserRound className="size-4" /></span>
                      <div>
                        <p className="font-bold text-slate-950">{user.displayName}</p>
                        <p className="text-xs text-slate-500">{user.id.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{user.phone || user.email || "—"}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black capitalize text-slate-700">
                      <Shield className="size-3.5" />{user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <p className="font-medium">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                    <p className="mt-1 text-xs text-slate-400">{user.lastSignInAt ? `Last sign-in ${new Date(user.lastSignInAt).toLocaleDateString()}` : "Never signed in"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <select className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold" disabled={busyId === user.id} onChange={(event) => setPendingRoles((current) => ({ ...current, [user.id]: event.target.value as AdminUser["role"] }))} value={pendingRoles[user.id] ?? user.role}>
                        <option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option>
                      </select>
                      {pendingRoles[user.id] && pendingRoles[user.id] !== user.role ? (
                        <>
                          <button aria-label={`Save role for ${user.displayName}`} className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white disabled:opacity-50" disabled={busyId === user.id} onClick={() => void updateRole(user.id, pendingRoles[user.id])} type="button"><Check className="size-4" /></button>
                          <button aria-label={`Cancel role change for ${user.displayName}`} className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600" onClick={() => setPendingRoles((current) => { const next = { ...current }; delete next[user.id]; return next; })} type="button"><X className="size-4" /></button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SkulKidCard>
    </main>
  );
}

function Summary({ label, value, icon: Icon, className = "" }: { label: string; value: number; icon: React.ElementType; className?: string }) {
  return <div className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 ${className}`}><span className="grid size-10 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><Icon className="size-5" /></span><div><p className="text-2xl font-black">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div></div>;
}
