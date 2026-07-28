"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  CheckCircle2,
  CircleAlert,
  Home,
  Loader2,
  Phone,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";

type Step = "phone" | "identity" | "name" | "otp" | "success";
type ApiResult = {
  ok?: boolean;
  error?: string;
  code?: string;
  attemptId?: string;
  nextStep?: Exclude<Step, "phone" | "success">;
  message?: string;
  shortcode?: string;
};

export function ForgotUsernamePage() {
  const [step, setStep] = useState<Step>("phone");
  const [attemptId, setAttemptId] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState(9);
  const [grade, setGrade] = useState(3);
  const [learnerName, setLearnerName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpShortcode, setOtpShortcode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");

  async function post(url: string, body: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json() as ApiResult;
    if (!response.ok) {
      const cause = new Error(result.error || "Something went wrong.") as Error & { code?: string };
      cause.code = result.code;
      throw cause;
    }
    return result;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setErrorCode("");
    try {
      if (step === "otp") {
        await post("/api/auth/username-recovery/verify", { attemptId, otp });
        setStep("success");
        return;
      }
      const payload = step === "phone"
        ? { action: "phone", phone }
        : step === "identity"
          ? { action: "identity", attemptId, age, grade }
          : { action: "name", attemptId, learnerName };
      const result = await post("/api/auth/username-recovery/start", payload);
      if (result.attemptId) setAttemptId(result.attemptId);
      if (result.shortcode) setOtpShortcode(result.shortcode);
      if (result.nextStep) setStep(result.nextStep);
    } catch (cause) {
      const typed = cause as Error & { code?: string };
      setError(typed.message || "Something went wrong.");
      setErrorCode(typed.code || "");
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setStep("phone");
    setAttemptId("");
    setOtp("");
    setOtpShortcode("");
    setLearnerName("");
    setError("");
    setErrorCode("");
  }

  const details = step === "identity"
    ? "This number is shared by multiple learners. Enter the learner’s age and Primary level."
    : step === "name"
      ? "More than one learner has those details. Enter the learner’s name exactly as it was registered."
      : step === "otp"
        ? "Enter the six-digit verification code sent to the registered number."
        : "Enter the phone number used when the learner account was created.";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-3 py-5 sm:grid sm:place-items-center sm:px-5">
      <div className="pointer-events-none absolute -left-32 -top-32 size-80 rounded-full bg-blue-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 size-96 rounded-full bg-violet-200/60 blur-3xl" />
      <div className="relative w-full max-w-lg">
        <Link className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm" href="/">
          <Home className="size-4" /> Go to landing page
        </Link>
        <section className="overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-[0_24px_70px_rgba(30,41,59,.14)]">
          <header className="bg-gradient-to-br from-blue-700 via-violet-700 to-fuchsia-700 px-5 py-6 text-white sm:px-8">
            <Link className="inline-flex rounded-xl bg-white px-3 py-2 shadow-lg" href="/">
              <SkulKidLogo className="w-28" priority />
            </Link>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <AtSign className="size-5" />
              </span>
              <div>
                <h1 className="text-2xl font-black">Find your username</h1>
                <p className="mt-1 text-sm text-blue-100">We will send it securely by SMS.</p>
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            {step === "success" ? (
              <div className="text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-7" />
                </span>
                <h2 className="mt-4 text-xl font-black text-slate-950">Check your SMS</h2>
                <p className="mt-2 leading-6 text-slate-600">
                  Student username sent to the registered number. Please check your SMS.
                </p>
                <Link className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-black text-white" href="/login/student">
                  Sign in with your username <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
                  {step === "otp" ? <ShieldCheck className="size-4" /> : <UserRound className="size-4" />}
                  Identity verification
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{details}</p>
                {step === "otp" && otpShortcode ? (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950" role="note">
                    <b className="block">Still waiting for the SMS?</b>
                    <span className="mt-1 block">
                      Dial <span className="font-black tracking-wide">{otpShortcode}</span> from the registered phone to view your verification code.
                    </span>
                  </div>
                ) : null}

                <form className="mt-5 grid gap-4" onSubmit={submit}>
                  {step === "phone" ? (
                    <Field label="Registered Ghana phone number">
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                        <input autoComplete="tel" className="!pl-12" inputMode="tel" onChange={(event) => setPhone(event.target.value)} placeholder="024 123 4567" required value={phone} />
                      </div>
                    </Field>
                  ) : null}
                  {step === "identity" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Age">
                        <input max={18} min={5} onChange={(event) => setAge(Number(event.target.value))} required type="number" value={age} />
                      </Field>
                      <Field label="Primary level">
                        <select onChange={(event) => setGrade(Number(event.target.value))} value={grade}>
                          {[1, 2, 3, 4, 5, 6].map((item) => <option key={item} value={item}>Basic {item}</option>)}
                        </select>
                      </Field>
                    </div>
                  ) : null}
                  {step === "name" ? (
                    <Field label="Registered learner name">
                      <input autoComplete="name" maxLength={50} minLength={2} onChange={(event) => setLearnerName(event.target.value)} placeholder="Enter the full registered name" required value={learnerName} />
                      <span className="text-xs font-medium text-slate-500">Capital letters and extra spaces do not matter.</span>
                    </Field>
                  ) : null}
                  {step === "otp" ? (
                    <Field label="6-digit verification code">
                      <input autoComplete="one-time-code" className="text-center text-2xl font-black tracking-[.45em]" inputMode="numeric" maxLength={6} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} pattern="\d{6}" placeholder="000000" required value={otp} />
                    </Field>
                  ) : null}

                  {error ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-950" role="alert">
                      <div className="flex gap-2.5">
                        <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
                        <div>
                          <p className="font-bold">{error}</p>
                          {errorCode === "ACCOUNT_NOT_FOUND" ? (
                            <Link className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 font-black text-white" href="/signup/student">
                              Create learner account
                            </Link>
                          ) : null}
                          {errorCode === "SUPPORT_REQUIRED" ? (
                            <a className="mt-3 inline-flex font-black text-primary" href="mailto:support@skulkid.app">Contact support</a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-black text-white shadow-[0_10px_25px_rgba(37,99,235,.2)] disabled:opacity-60" disabled={busy} type="submit">
                    {busy ? <Loader2 className="size-5 animate-spin" /> : step === "otp" ? <ShieldCheck className="size-5" /> : <ArrowRight className="size-5" />}
                    {busy ? "Please wait" : step === "otp" ? "Verify and send username" : step === "phone" ? "Continue" : "Verify details"}
                  </button>
                  {step !== "phone" ? (
                    <button className="inline-flex items-center justify-center gap-2 text-sm font-bold text-primary" onClick={restart} type="button">
                      <ArrowLeft className="size-4" /> Start again
                    </button>
                  ) : null}
                </form>
                <p className="mt-5 border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
                  Remembered it? <Link className="font-black text-primary" href="/login/student">Sign in</Link>
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-black text-slate-700 [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:px-4 [&_input]:text-base [&_input]:outline-none focus-within:[&_input]:border-primary focus-within:[&_input]:ring-4 focus-within:[&_input]:ring-blue-100 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3 [&_select]:text-base">
      {label}{children}
    </label>
  );
}
