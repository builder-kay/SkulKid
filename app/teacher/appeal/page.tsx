"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, MessageSquareWarning, Phone, ShieldCheck } from "lucide-react";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";

type AppealCase = { id: string; contentType: string; title: string; reviewNote: string | null; reviewedAt: string | null };

export default function TeacherAppealPage() {
  const [step, setStep] = useState<"phone" | "otp" | "appeal" | "done">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [cases, setCases] = useState<AppealCase[]>([]);
  const [caseId, setCaseId] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/teacher-appeal/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send the code.");
      setNotice(data.message);
      setStep("otp");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send the code."); }
    finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/teacher-appeal/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone, otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The code could not be verified.");
      setToken(data.token);
      setCases(data.cases ?? []);
      setCaseId(data.cases?.[0]?.id ?? "");
      setStep("appeal");
      setNotice("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The code could not be verified."); }
    finally { setBusy(false); }
  }

  async function submit() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/teacher-appeal/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", token, caseId: caseId || null, message })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The appeal could not be submitted.");
      setNotice(data.message);
      setStep("done");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The appeal could not be submitted."); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-blue-950 p-4 sm:p-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-violet-100" href="/"><ArrowLeft className="size-4" />SkulKid home</Link>
        <section className="mt-4 overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <header className="border-b border-slate-200 p-6 sm:p-8">
            <span className="inline-flex rounded-xl bg-white"><SkulKidLogo className="w-36" priority /></span>
            <div className="mt-6 flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-800"><MessageSquareWarning className="size-6" /></span><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Independent account access</p><h1 className="mt-1 text-3xl font-black">Teacher moderation appeal</h1><p className="mt-2 leading-7 text-slate-600">Verify the registered phone, explain the misunderstanding and an administrator will review the exact decision.</p></div></div>
          </header>
          <div className="grid gap-5 p-6 sm:p-8">
            {error ? <p className="rounded-xl bg-rose-50 p-4 font-bold text-rose-900" role="alert">{error}</p> : null}
            {notice ? <p className="rounded-xl bg-emerald-50 p-4 font-bold text-emerald-900" role="status">{notice}</p> : null}
            {step === "phone" ? <><Field label="Registered teacher phone"><div className="relative"><Phone className="absolute left-3 top-3.5 size-4 text-slate-400" /><input className={`${inputClass} pl-10`} inputMode="tel" onChange={(event) => setPhone(event.target.value)} placeholder="024 000 0000" value={phone} /></div></Field><Action busy={busy} disabled={phone.trim().length < 9} label="Send appeal code" onClick={start} /></> : null}
            {step === "otp" ? <><Field label="Six-digit SMS code"><input className={`${inputClass} text-center text-2xl tracking-[.35em]`} inputMode="numeric" maxLength={6} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} value={otp} /></Field><Action busy={busy} disabled={otp.length !== 6} label="Verify and continue" onClick={verify} /><button className="min-h-11 text-sm font-bold text-violet-700" onClick={() => setStep("phone")}>Use another number</button></> : null}
            {step === "appeal" ? <>{cases.length ? <Field label="Decision you are appealing"><select className={inputClass} onChange={(event) => setCaseId(event.target.value)} value={caseId}>{cases.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.contentType.replaceAll("_", " ")}</option>)}</select></Field> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">No individual rejected content was found. Your appeal will cover the account ban.</p>}<Field label="Explain why the decision should be reviewed"><textarea className={`${inputClass} min-h-40`} maxLength={2000} onChange={(event) => setMessage(event.target.value)} placeholder="Give clear context about the lesson or account…" value={message} /></Field><p className="text-xs text-slate-500">{message.length}/2000 · minimum 20 characters</p><Action busy={busy} disabled={message.trim().length < 20} label="Send appeal" onClick={submit} /></> : null}
            {step === "done" ? <div className="py-8 text-center"><CheckCircle2 className="mx-auto size-14 text-emerald-600" /><h2 className="mt-4 text-2xl font-black">Your appeal is in the queue</h2><p className="mt-2 leading-7 text-slate-600">An administrator will review it. Submitting an appeal does not automatically restore the account or content.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-violet-700 px-5 font-black text-white" href="/">Return home</Link></div> : null}
            <div className="flex gap-3 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-700" />The code only confirms access to the registered phone. It does not automatically change the administrator’s decision.</div>
          </div>
        </section>
      </div>
    </main>
  );
}

const inputClass = "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-black text-slate-800">{label}{children}</label>;
}
function Action({ busy, disabled, label, onClick }: { busy: boolean; disabled: boolean; label: string; onClick: () => void }) {
  return <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 font-black text-white disabled:opacity-50" disabled={busy || disabled} onClick={onClick}>{busy ? <Loader2 className="size-5 animate-spin" /> : null}{label}</button>;
}
