"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, BookOpen, CheckCircle2, CircleAlert, Eye, EyeOff, Home, KeyRound, Loader2, LockKeyhole, Phone, RotateCcw, ShieldCheck, Sparkles, Star, Trophy, UserPlus, UserRound, UsersRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";

type Mode = "login" | "signup" | "reset";
type AuthAction = "login" | "password-reset" | "signup";

class AuthFlowError extends Error {
  constructor(message: string, readonly actions: AuthAction[] = []) {
    super(message);
  }
}

export function AuthPage({ mode, nextPath }: { mode: Mode; nextPath?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "verify">("details");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [suggestedActions, setSuggestedActions] = useState<AuthAction[]>([]);
  const [success, setSuccess] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState(9);
  const [grade, setGrade] = useState(3);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [guardianInfoOpen, setGuardianInfoOpen] = useState(false);

  const isSignup = mode === "signup";
  const isReset = mode === "reset";
  const title = mode === "login" ? "Welcome back" : isSignup ? "Create your learner account" : "Choose a new password";
  const description = mode === "login" ? "Continue learning, earning XP and building your avatar." : isSignup ? "Use a Ghana phone number to begin your learning adventure." : "We will verify your phone before changing your password.";

  async function post(url: string, body: unknown) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json() as { ok?: boolean; error?: string; message?: string; requiresSignIn?: boolean; role?: "student" | "admin"; actions?: AuthAction[] };
    if (!response.ok) throw new AuthFlowError(result.error || "Something went wrong.", result.actions);
    return result;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (((isSignup && step === "details") || (isReset && step === "verify")) && password !== confirmPassword) {
      setError("The passwords do not match. Please enter them again.");
      return;
    }
    setBusy(true); setError(""); setSuggestedActions([]); setSuccess("");
    try {
      if (mode === "login") {
        const result = await post("/api/auth/login", { phone, password });
        const roleHome = result.role === "admin" ? "/admin" : "/dashboard";
        const safeNext = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;
        const destination = result.role === "admin" ? safeNext ?? roleHome : safeNext?.startsWith("/admin") ? roleHome : safeNext ?? roleHome;
        router.replace(destination); router.refresh();
        return;
      }
      if (step === "details") {
        await post("/api/auth/otp/send", { phone, purpose: isSignup ? "signup" : "password-reset" });
        setStep("verify");
        return;
      }
      if (isSignup) {
        const result = await post("/api/auth/signup", { phone, password, otp, displayName, gender, age, grade });
        if (result.requiresSignIn) {
          setSuccess(result.message || "Your account is ready! Please sign in to start learning.");
          window.setTimeout(() => router.replace("/login?created=success"), 1800);
          return;
        }
        router.replace("/dashboard"); router.refresh();
      } else {
        await post("/api/auth/password-reset", { phone, password, otp });
        router.replace("/login?reset=success");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
      setSuggestedActions(cause instanceof AuthFlowError ? cause.actions : []);
    } finally {
      setBusy(false);
    }
  }

  return <main className="relative min-h-screen overflow-hidden bg-slate-50 p-2 sm:grid sm:place-items-center sm:px-5 sm:py-5">
    <div className="pointer-events-none absolute -left-32 -top-32 size-80 rounded-full bg-blue-200/60 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-40 -right-32 size-96 rounded-full bg-violet-200/60 blur-3xl" />
    <div className="relative mx-auto w-full max-w-4xl">
      <Link
        className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        href="/"
      >
        <Home aria-hidden="true" className="size-4" />
        Go to landing page
      </Link>
      <section className="relative grid w-full overflow-hidden rounded-[1.5rem] border border-white bg-white shadow-[0_24px_70px_rgba(30,41,59,.14)] sm:rounded-[2rem] lg:grid-cols-[.84fr_1.16fr]">
      <aside className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-violet-700 to-fuchsia-700 p-4 text-white sm:p-5 lg:flex lg:min-h-[36rem] lg:flex-col lg:justify-between lg:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative">
          <Link className="inline-flex rounded-xl bg-white px-2.5 py-1.5 shadow-lg sm:rounded-2xl sm:px-3 sm:py-2" href="/"><SkulKidLogo className="w-28 sm:w-32" priority /></Link>
          <div className="mt-5 hidden lg:block">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider ring-1 ring-white/20"><Sparkles className="size-4 text-amber-300" />Learn. Play. Grow.</span>
            <h2 className="mt-4 text-3xl font-black leading-tight">Every lesson is a new adventure.</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-blue-100">Build confidence, collect rewards and create an avatar that grows with your learning.</p>
          </div>
        </div>
        <div className="relative mt-7 hidden grid-cols-3 gap-2 lg:grid">
          <Benefit icon={BookOpen} label="Fun lessons" />
          <Benefit icon={Trophy} label="Earn XP" />
          <Benefit icon={Star} label="Win stars" />
        </div>
      </aside>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-blue-100 text-primary sm:size-12">{mode === "login" ? <KeyRound className="size-5" /> : isSignup ? <UserRound className="size-5" /> : <LockKeyhole className="size-5" />}</span>
            {mode !== "login" ? <div className="flex items-center gap-2" aria-label={`Step ${step === "details" ? 1 : 2} of 2`}><span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-black text-white">1</span><span className={`h-1 w-8 rounded-full ${step === "verify" ? "bg-primary" : "bg-slate-200"}`} /><span className={`grid size-7 place-items-center rounded-full text-xs font-black ${step === "verify" ? "bg-primary text-white" : "bg-slate-100 text-muted"}`}>2</span></div> : null}
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:mt-4 sm:text-3xl">{title}</h1>
          <p className="mt-1.5 text-sm leading-5 text-text-secondary sm:text-base sm:leading-6">{description}</p>

          {step === "verify" ? <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><span><b className="block">Verification code sent</b><span className="block text-emerald-800">Enter the code sent to {phone}.</span></span></div> : null}

          <form className="mt-4 grid gap-3" onSubmit={submit}>
            {isSignup && step === "details" ? <><Field label="Learner name"><input autoComplete="name" onChange={(event) => setDisplayName(event.target.value)} placeholder="What should we call you?" required value={displayName} /></Field><div className="grid grid-cols-3 gap-3"><Field label="Gender"><select onChange={(event) => setGender(event.target.value as "male" | "female")} value={gender}><option value="male">Boy</option><option value="female">Girl</option></select></Field><Field label="Age"><input max={18} min={5} onChange={(event) => setAge(Number(event.target.value))} required type="number" value={age} /></Field><Field label="Primary level"><select onChange={(event) => setGrade(Number(event.target.value))} value={grade}>{[1,2,3,4,5,6].map((item) => <option key={item} value={item}>Basic {item}</option>)}</select></Field></div></> : null}
            {step === "details" || mode === "login" ? <Field label="Ghana phone number"><div className="relative w-full"><span className="pointer-events-none absolute inset-y-0 left-0 z-10 grid w-12 place-items-center text-muted"><Phone className="size-5" /></span><input autoComplete="tel" className="!pl-12 !pr-16" inputMode="tel" onChange={(event) => setPhone(event.target.value)} placeholder="024 123 4567" required value={phone} /><span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-black text-emerald-700">+233</span></div><span className="text-xs font-medium text-muted">You can enter 024… or +23324… — we will format it securely.</span>{isSignup ? <button className="mt-0.5 inline-flex w-fit items-center gap-1.5 text-left text-sm font-black text-primary hover:text-primary-dark" onClick={() => setGuardianInfoOpen(true)} type="button"><UsersRound className="size-4" />Don&apos;t have a personal number?</button> : null}</Field> : null}
            {mode === "login" || (isSignup && step === "details") || (isReset && step === "verify") ? <Field label={isReset ? "New password" : "Password"}><div className="relative w-full"><span className="pointer-events-none absolute inset-y-0 left-0 z-10 grid w-12 place-items-center text-muted"><LockKeyhole className="size-5" /></span><input autoComplete={mode === "login" ? "current-password" : "new-password"} className="!pl-12 !pr-12" minLength={8} onChange={(event) => setPassword(event.target.value)} required type={showPassword ? "text" : "password"} value={password} /><button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-1 z-10 my-auto grid size-10 place-items-center rounded-lg text-muted hover:bg-slate-100" onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div>{mode !== "login" ? <span className="text-xs font-medium text-muted">Use at least 8 characters.</span> : null}</Field> : null}
            {(isSignup && step === "details") || (isReset && step === "verify") ? <Field label="Confirm password"><div className="relative w-full"><span className="pointer-events-none absolute inset-y-0 left-0 z-10 grid w-12 place-items-center text-muted"><LockKeyhole className="size-5" /></span><input autoComplete="new-password" className="!pl-12 !pr-12" minLength={8} onChange={(event) => { setConfirmPassword(event.target.value); if (error.startsWith("The passwords do not match")) setError(""); }} required type={showConfirmPassword ? "text" : "password"} value={confirmPassword} /><button aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"} className="absolute inset-y-0 right-1 z-10 my-auto grid size-10 place-items-center rounded-lg text-muted hover:bg-slate-100" onClick={() => setShowConfirmPassword((visible) => !visible)} type="button">{showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div>{confirmPassword && password === confirmPassword ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 className="size-3.5" />Passwords match</span> : null}</Field> : null}
            {step === "verify" ? <Field label="6-digit verification code"><input autoComplete="one-time-code" className="text-center text-2xl font-black tracking-[.45em]" inputMode="numeric" maxLength={6} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} pattern="\d{6}" placeholder="000000" required value={otp} /></Field> : null}
            {mode === "login" ? <div className="-mt-1 flex justify-end"><Link className="text-sm font-black text-primary hover:text-primary-dark" href="/forgot-password">Forgot password?</Link></div> : null}
            {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-amber-950" role="alert"><div className="flex items-start gap-2.5"><CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" /><div><p className="text-sm font-black">{suggestedActions.length ? "Let’s get you to the right place" : "Something needs attention"}</p><p className="mt-1 text-sm leading-5 text-amber-900">{error}</p></div></div>{suggestedActions.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{suggestedActions.includes("login") ? <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-black text-white" href="/login"><KeyRound className="size-4" />Sign in</Link> : null}{suggestedActions.includes("password-reset") ? <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-3 text-sm font-black text-amber-950" href="/forgot-password"><RotateCcw className="size-4" />Reset password</Link> : null}{suggestedActions.includes("signup") ? <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-black text-white sm:col-span-2" href="/signup"><UserPlus className="size-4" />Create an account</Link> : null}</div> : null}</div> : null}
            {success ? <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm" role="status"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><CheckCircle2 className="size-5" /></span><span><b className="block">Account created successfully!</b><span className="mt-1 block text-sm leading-5 text-emerald-800">{success}</span></span></div> : null}
            <button className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-black text-white shadow-[0_10px_25px_rgba(37,99,235,.24)] transition hover:-translate-y-0.5 hover:bg-primary-dark disabled:translate-y-0 disabled:opacity-60" disabled={busy || Boolean(success)} type="submit">{success ? <CheckCircle2 className="size-5" /> : busy ? <Loader2 className="size-5 animate-spin" /> : step === "verify" ? <ShieldCheck className="size-5" /> : <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />}{success ? "Taking you to sign in..." : busy ? "Please wait" : mode === "login" ? "Sign in and continue" : step === "details" ? "Send verification code" : isSignup ? "Verify and create account" : "Verify and reset password"}</button>
            {step === "verify" ? <button className="text-sm font-bold text-primary" onClick={() => { setStep("details"); setOtp(""); setError(""); setSuggestedActions([]); }} type="button">Change phone number</button> : null}
          </form>
          <div className="mt-4 border-t border-slate-200 pt-4 text-center text-sm text-text-secondary">{mode === "login" ? <>New to SkulKid? <Link className="font-black text-primary hover:text-primary-dark" href="/signup">Create a learner account</Link></> : <>Already have an account? <Link className="font-black text-primary hover:text-primary-dark" href="/login">Sign in</Link></>}</div>
        </div>
      </div>
    </section>
    </div>
    {guardianInfoOpen ? <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/55 p-3 backdrop-blur-sm sm:place-items-center sm:p-6" onMouseDown={(event) => { if (event.currentTarget === event.target) setGuardianInfoOpen(false); }}>
      <section aria-labelledby="guardian-phone-title" aria-modal="true" className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-2xl sm:p-7" role="dialog">
        <div className="flex items-start justify-between gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><UsersRound className="size-6" /></span><button aria-label="Close information" className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200" onClick={() => setGuardianInfoOpen(false)} type="button"><X className="size-5" /></button></div>
        <h2 className="mt-5 text-2xl font-black text-slate-950" id="guardian-phone-title">Ask a parent or guardian</h2>
        <p className="mt-2 leading-7 text-text-secondary">You do not need to own a phone to use SkulKid. Ask a trusted parent or guardian to help you register with their Ghana phone number.</p>
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="font-black text-blue-950">What will happen?</p><ol className="mt-3 grid gap-3 text-sm leading-6 text-blue-900"><li className="flex gap-3"><b className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-700 text-xs text-white">1</b>Enter your parent or guardian&apos;s phone number.</li><li className="flex gap-3"><b className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-700 text-xs text-white">2</b>They will receive a six-digit verification code.</li><li className="flex gap-3"><b className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-700 text-xs text-white">3</b>Ask them to enter or tell you the code so registration can finish.</li></ol></div>
        <p className="mt-4 text-sm leading-6 text-muted">Use a number your family can access later. It may be needed to sign in or reset your password.</p>
        <button className="mt-5 min-h-12 w-full rounded-xl bg-primary px-5 font-black text-white" onClick={() => setGuardianInfoOpen(false)} type="button">Okay, I&apos;ll ask an adult</button>
      </section>
    </div> : null}
  </main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-black text-slate-700 [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:bg-white [&_input]:px-4 [&_input]:text-base [&_input]:outline-none [&_input]:transition focus-within:[&_input]:border-primary focus-within:[&_input]:ring-4 focus-within:[&_input]:ring-blue-100 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3 [&_select]:text-base">{label}{children}</label>;
}

function Benefit({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return <div className="rounded-2xl bg-white/10 p-2.5 text-center ring-1 ring-white/15 backdrop-blur sm:p-3"><Icon className="mx-auto size-5 text-amber-300" /><span className="mt-1.5 block text-[11px] font-black sm:text-xs">{label}</span></div>;
}
