"use client";

import { useEffect, useState } from "react";
import { Search, Shield, UserRound } from "lucide-react";
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
  const [busyId, setBusyId] = useState<string | null>(null);
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
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update role.");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = users.filter((user) => {
    const haystack = `${user.displayName} ${user.phone ?? ""} ${user.email ?? ""} ${user.role}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <main className="mx-auto grid w-full max-w-[90rem] gap-6">
      <header className="rounded-[2rem] border border-white bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-700">User management</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Learners, teachers and admins</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Search accounts and assign the right workspace role.</p>
        <label className="relative mt-5 block max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, phone or role"
            value={query}
          />
        </label>
      </header>

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">{error}</div> : null}

      <SkulKidCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
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
                  <td className="px-4 py-4 text-slate-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    <select
                      className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold"
                      disabled={busyId === user.id}
                      onChange={(event) => void updateRole(user.id, event.target.value as AdminUser["role"])}
                      value={user.role}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
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
