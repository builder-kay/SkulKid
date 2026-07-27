import { AdminCommandCenter } from "@/components/admin/admin-command-center";

export default function PlatformAdminHomePage() {
  return (
    <main className="mx-auto grid w-full max-w-[96rem] gap-7">
      <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-[var(--shadow-card)] sm:p-8">
        <div className="absolute -right-16 -top-24 size-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">Platform command center</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">Good decisions start with a clear system view.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">Protect people, resolve urgent work, and keep SkulKid healthy from one accountable workspace.</p>
        </div>
      </header>
      <AdminCommandCenter />
    </main>
  );
}
