"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, AtSign, BookOpen, BookOpenCheck, CheckCircle2, CircleAlert, Eye, EyeOff, Home, KeyRound, Loader2, LockKeyhole, Phone, RotateCcw, ShieldCheck, Sparkles, Star, Trophy, UserPlus, UserRound, UsersRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SkulKidLogo } from "@/components/shared/skulkid-logo";
import { roleHome, type AppRole } from "@/lib/auth/roles";
import { normalizeGhanaPhone } from "@/lib/auth/phone";

type Mode = "login" | "signup" | "reset";
type Audience = "student" | "teacher";
type AuthAction = "login" | "password-reset" | "signup";
type PhoneOwner = "self" | "guardian";
type UsernameAvailability = "idle" | "checking" | "available" | "taken";

class AuthFlowError extends Error {
  constructor(message: string, readonly actions: AuthAction[] = [], readonly code = "") {
    super(message);
  }
}

export function AuthPage({ mode, nextPath, audience = "student" }: { mode: Mode; nextPath?: string; audience?: Audience }) {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "verify">("details");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [suggestedActions, setSuggestedActions] = useState<AuthAction[]>([]);
  const [success, setSuccess] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailability, setUsernameAvailability] = useState<UsernameAvailability>("idle");
  const [phoneOwner, setPhoneOwner] = useState<PhoneOwner>("self");
  const [phoneHint, setPhoneHint] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [school, setSchool] = useState("");
  const [subjectsTaught, setSubjectsTaught] = useState("Mathematics");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState(9);
  const [grade, setGrade] = useState(3);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [guardianInfoOpen, setGuardianInfoOpen] = useState(false);
  const [learnerSignupStep, setLearnerSignupStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const learnerHeadingRef = useRef<HTMLHeadingElement>(null);

  const isTeacher = audience === "teacher";
  const isSignup = mode === "signup";
  const isReset = mode === "reset";
  const isLearnerSteppedSignup = isSignup && !isTeacher;
  const isGuardianPhone = !isTeacher && phoneOwner === "guardian";
  const loginPath = isTeacher ? "/login/teacher" : "/login/student";
  const signupPath = isTeacher ? "/signup/teacher" : "/signup/student";
  const title = mode === "login"
    ? (isTeacher ? "Teacher sign in" : "Student sign in")
    : isSignup
      ? (isTeacher ? "Create your teacher account" : "Create your learner account")
      : "Choose a new password";
  const description = mode === "login"
    ? (isTeacher ? "Continue building subjects, lessons and learning paths." : "Sign in with your username and password.")
    : isSignup
      ? (isTeacher
        ? "Use a Ghana phone number to join the SkulKid teacher workspace."
        : isGuardianPhone
          ? "Use a parent or guardian phone for verification. You will sign in with your username."
          : "Choose a username and verify with your Ghana phone number.")
      : (isTeacher
        ? "We will verify your phone before changing your password."
        : "Enter your username. We will send a code to your linked phone.");
  const asideTitle = isTeacher ? "Teach with purpose." : "Every lesson is a new adventure.";
  const asideCopy = isTeacher
    ? "Create curriculum-aligned lessons, publish subjects and guide learners across Ghana."
    : "Build confidence, collect rewards and create an avatar that grows with your learning.";
  const learnerStepCopy = [
    { title: "Let’s meet you!", description: "Choose the name and username you’ll use on SkulKid." },
    { title: "Tell us about your learning", description: "This helps us show lessons that fit your level." },
    { title: "Choose a safe phone", description: "Use your phone or ask a parent or guardian to help." },
    { title: "Create your secret password", description: "Choose something you can remember but others cannot guess." },
    { title: "Ask for the code", description: "Enter the six-digit code sent to the registered phone." }
  ][learnerSignupStep - 1];

  useEffect(() => {
    if (!isLearnerSteppedSignup) return;
    window.history.replaceState({ ...window.history.state, skulkidSignupStep: 1 }, "");
    const onPopState = (event: PopStateEvent) => {
      const next = Number(event.state?.skulkidSignupStep);
      if (next >= 1 && next <= 5) {
        setLearnerSignupStep(next as 1 | 2 | 3 | 4 | 5);
        setError("");
        setSuggestedActions([]);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isLearnerSteppedSignup]);

  useEffect(() => {
    if (!isLearnerSteppedSignup) return;
    learnerHeadingRef.current?.focus();
  }, [isLearnerSteppedSignup, learnerSignupStep]);

  function advanceLearnerSignup(next: 2 | 3 | 4 | 5) {
    window.history.pushState({ ...window.history.state, skulkidSignupStep: next }, "");
    setLearnerSignupStep(next);
    setError("");
    setSuggestedActions([]);
  }

  function previousLearnerSignupStep() {
    if (learnerSignupStep > 1) window.history.back();
  }

  async function post(url: string, body: unknown) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json() as {
      ok?: boolean;
      error?: string;
      message?: string;
      requiresSignIn?: boolean;
      role?: AppRole;
      actions?: AuthAction[];
      phoneHint?: string;
      username?: string;
      available?: boolean;
      code?: string;
    };
    if (!response.ok) throw new AuthFlowError(result.error || "Something went wrong.", result.actions, result.code);
    return result;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (isLearnerSteppedSignup) {
      setBusy(true); setError(""); setSuggestedActions([]); setSuccess("");
      try {
        if (learnerSignupStep === 1) {
          setUsernameAvailability("checking");
          const result = await post("/api/auth/username/availability", { username });
          if (!result.available) {
            setUsernameAvailability("taken");
            throw new Error("That username is already taken. Please choose a different username.");
          }
          setUsernameAvailability("available");
          advanceLearnerSignup(2);
          return;
        }
        if (learnerSignupStep === 2) {
          advanceLearnerSignup(3);
          return;
        }
        if (learnerSignupStep === 3) {
          normalizeGhanaPhone(phone);
          advanceLearnerSignup(4);
          return;
        }
        if (learnerSignupStep === 4) {
          if (password !== confirmPassword) throw new Error("The passwords do not match. Please enter them again.");
          const availability = await post("/api/auth/username/availability", { username });
          if (!availability.available) {
            throw new AuthFlowError(
              "That username is already taken. Please choose a different username.",
              [],
              "USERNAME_TAKEN"
            );
          }
          await post("/api/auth/otp/send", { purpose: "signup", role: "student", phone, phoneOwner });
          advanceLearnerSignup(5);
          return;
        }
        const result = await post("/api/auth/signup", {
          role: "student", phone, phoneOwner, username, password, otp, displayName, gender, age, grade
        });
        if (result.requiresSignIn) {
          setSuccess(result.message || "Your account is ready! Please sign in with your username.");
          window.setTimeout(() => router.replace(`${loginPath}?created=success`), 1800);
          return;
        }
        setSuccess("Amazing work! Your learner account is ready.");
        window.setTimeout(() => {
          router.replace(roleHome(result.role ?? "student"));
          router.refresh();
        }, 1400);
        return;
      } catch (cause) {
        if (cause instanceof AuthFlowError && learnerSignupStep === 4 && cause.code === "ACCOUNT_EXISTS") {
          window.history.replaceState({ ...window.history.state, skulkidSignupStep: 3 }, "");
          setLearnerSignupStep(3);
        }
        if (cause instanceof AuthFlowError && cause.code === "USERNAME_TAKEN") {
          window.history.replaceState({ ...window.history.state, skulkidSignupStep: 1 }, "");
          setLearnerSignupStep(1);
          setUsernameAvailability("taken");
        } else if (learnerSignupStep === 1) {
          setUsernameAvailability("idle");
        }
        setError(cause instanceof Error ? cause.message : "Something went wrong.");
        setSuggestedActions(cause instanceof AuthFlowError ? cause.actions : []);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (((isSignup && step === "details") || (isReset && step === "details")) && password !== confirmPassword) {
      setError("The passwords do not match. Please enter them again.");
      return;
    }
    setBusy(true); setError(""); setSuggestedActions([]); setSuccess("");
    try {
      if (mode === "login") {
        const result = await post("/api/auth/login", isTeacher
          ? { role: "teacher", phone, password }
          : { role: "student", username, password });
        const home = roleHome(result.role ?? "student");
        const safeNext = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;
        const blockedStaffPath =
          result.role === "student" && (safeNext?.startsWith("/admin") || safeNext?.startsWith("/teacher"));
        const destination = blockedStaffPath ? home : safeNext ?? home;
        router.replace(destination); router.refresh();
        return;
      }

      if (step === "details") {
        if (isReset && !isTeacher) {
          const result = await post("/api/auth/otp/send", {
            purpose: "password-reset",
            role: "student",
            username
          });
          setPhoneHint(result.phoneHint || "");
          setStep("verify");
          return;
        }
        if (isReset && isTeacher) {
          await post("/api/auth/otp/send", { purpose: "password-reset", role: "teacher", phone });
          setStep("verify");
          return;
        }
        await post("/api/auth/otp/send", isTeacher
          ? { purpose: "signup", role: "teacher", phone }
          : { purpose: "signup", role: "student", phone, phoneOwner });
        setStep("verify");
        return;
      }

      if (isSignup) {
        const payload = isTeacher
          ? { role: "teacher", phone, password, otp, displayName, school, subjectsTaught }
          : { role: "student", phone, phoneOwner, username, password, otp, displayName, gender, age, grade };
        const result = await post("/api/auth/signup", payload);
        if (result.requiresSignIn) {
          setSuccess(result.message || (isTeacher ? "Your teacher account is ready! Please sign in." : "Your account is ready! Please sign in with your username."));
          window.setTimeout(() => router.replace(`${loginPath}?created=success`), 1800);
          return;
        }
        router.replace(roleHome(result.role ?? (isTeacher ? "teacher" : "student"))); router.refresh();
        return;
      }

      await post("/api/auth/password-reset", isTeacher
        ? { role: "teacher", phone, password, otp }
        : { role: "student", username, password, otp });
      router.replace(`${loginPath}?reset=success`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
      setSuggestedActions(cause instanceof AuthFlowError ? cause.actions : []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 p-2 sm:grid sm:place-items-center sm:px-5 sm:py-5">
      <div className="pointer-events-none absolute -left-32 -top-32 size-80 rounded-full bg-blue-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 size-96 rounded-full bg-violet-200/60 blur-3xl" />
      <div className="relative mx-auto w-full max-w-4xl">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            href="/"
          >
            <Home aria-hidden="true" className="size-4" />
            Go to landing page
          </Link>
          {mode !== "reset" ? (
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              href={mode === "login" ? "/login" : "/signup"}
            >
              Change role
            </Link>
          ) : null}
        </div>
        <section className="relative grid w-full overflow-hidden rounded-[1.5rem] border border-white bg-white shadow-[0_24px_70px_rgba(30,41,59,.14)] sm:rounded-[2rem] lg:grid-cols-[.84fr_1.16fr]">
          <aside className={`relative overflow-hidden p-4 text-white sm:p-5 lg:flex lg:min-h-[36rem] lg:flex-col lg:justify-between lg:p-8 ${isTeacher ? "bg-gradient-to-br from-violet-800 via-violet-700 to-indigo-700" : "bg-gradient-to-br from-blue-700 via-violet-700 to-fuchsia-700"}`}>
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-cyan-300/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
            <div className="relative">
              <Link className="inline-flex rounded-xl bg-white px-2.5 py-1.5 shadow-lg sm:rounded-2xl sm:px-3 sm:py-2" href="/"><SkulKidLogo className="w-28 sm:w-32" priority /></Link>
              <div className="mt-5 hidden lg:block">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider ring-1 ring-white/20">
                  {isTeacher ? <BookOpenCheck className="size-4 text-amber-300" /> : <Sparkles className="size-4 text-amber-300" />}
                  {isTeacher ? "Teacher workspace" : "Learn. Play. Grow."}
                </span>
                <h2 className="mt-4 text-3xl font-black leading-tight">{asideTitle}</h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-blue-100">{asideCopy}</p>
              </div>
            </div>
            <div className="relative mt-7 hidden grid-cols-3 gap-2 lg:grid">
              {isTeacher ? (
                <>
                  <Benefit icon={BookOpenCheck} label="Build subjects" />
                  <Benefit icon={BookOpen} label="Write lessons" />
                  <Benefit icon={Sparkles} label="Use AI tools" />
                </>
              ) : (
                <>
                  <Benefit icon={BookOpen} label="Fun lessons" />
                  <Benefit icon={Trophy} label="Earn XP" />
                  <Benefit icon={Star} label="Win stars" />
                </>
              )}
            </div>
          </aside>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-md">
              <div className="flex items-center justify-between gap-3">
                <span className={`grid size-11 place-items-center rounded-2xl sm:size-12 ${isTeacher ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-primary"}`}>{mode === "login" ? <KeyRound className="size-5" /> : isSignup ? <UserRound className="size-5" /> : <LockKeyhole className="size-5" />}</span>
                {isLearnerSteppedSignup ? (
                  <div aria-label={`Step ${learnerSignupStep} of 5`} className="text-right">
                    <p className="text-xs font-black uppercase tracking-wider text-primary">Step {learnerSignupStep} of 5</p>
                    <div className="mt-2 flex gap-1.5" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((item) => <span className={`h-1.5 w-7 rounded-full transition-colors motion-reduce:transition-none ${item <= learnerSignupStep ? "bg-primary" : "bg-slate-200"}`} key={item} />)}
                    </div>
                  </div>
                ) : mode !== "login" ? <div className="flex items-center gap-2" aria-label={`Step ${step === "details" ? 1 : 2} of 2`}><span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-black text-white">1</span><span className={`h-1 w-8 rounded-full ${step === "verify" ? "bg-primary" : "bg-slate-200"}`} /><span className={`grid size-7 place-items-center rounded-full text-xs font-black ${step === "verify" ? "bg-primary text-white" : "bg-slate-100 text-muted"}`}>2</span></div> : null}
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 outline-none sm:mt-4 sm:text-3xl" ref={isLearnerSteppedSignup ? learnerHeadingRef : undefined} tabIndex={isLearnerSteppedSignup ? -1 : undefined}>{isLearnerSteppedSignup ? learnerStepCopy.title : title}</h1>
              <p className="mt-1.5 text-sm leading-5 text-text-secondary sm:text-base sm:leading-6">{isLearnerSteppedSignup ? learnerStepCopy.description : description}</p>

              {(step === "verify" || (isLearnerSteppedSignup && learnerSignupStep === 5)) ? (
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                  <span>
                    <b className="block">Verification code sent</b>
                    <span className="block text-emerald-800">
                      {isReset && !isTeacher && phoneHint
                        ? `Enter the code sent to ${phoneHint}.`
                        : isTeacher || phone
                          ? `Enter the code sent to ${phone}.`
                          : "Enter the code sent to your linked phone."}
                    </span>
                  </span>
                </div>
              ) : null}

              <form className="mt-4 grid gap-3" onSubmit={submit}>
                {isLearnerSteppedSignup && learnerSignupStep === 1 ? (
                  <>
                    <Field label="What should we call you?">
                      <input autoComplete="name" maxLength={50} minLength={2} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" required value={displayName} />
                    </Field>
                    <Field label="Choose your username">
                      <div className="relative w-full">
                        <span className="pointer-events-none absolute inset-y-0 left-0 z-10 grid w-12 place-items-center text-muted"><AtSign className="size-5" /></span>
                        <input
                          aria-describedby="learner-username-help learner-username-status"
                          aria-invalid={usernameAvailability === "taken"}
                          autoComplete="username"
                          className="!pl-12"
                          maxLength={20}
                          minLength={3}
                          onChange={(event) => {
                            setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                            setUsernameAvailability("idle");
                            if (error.toLowerCase().includes("username")) setError("");
                          }}
                          pattern="[a-z0-9_]{3,20}"
                          placeholder="e.g. ama_b4"
                          required
                          value={username}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted" id="learner-username-help">Use 3–20 letters, numbers or underscores. You’ll use this name to sign in.</span>
                      <span aria-live="polite" className={`inline-flex min-h-4 items-center gap-1.5 text-xs font-bold ${usernameAvailability === "available" ? "text-emerald-700" : usernameAvailability === "taken" ? "text-amber-700" : "text-muted"}`} id="learner-username-status">
                        {usernameAvailability === "checking" ? <><Loader2 className="size-3.5 animate-spin" />Checking username…</> : null}
                        {usernameAvailability === "available" ? <><CheckCircle2 className="size-3.5" />This username is available.</> : null}
                        {usernameAvailability === "taken" ? <><CircleAlert className="size-3.5" />This username is taken. Choose a different one.</> : null}
                      </span>
                    </Field>
                  </>
                ) : null}

                {isLearnerSteppedSignup && learnerSignupStep === 2 ? (
                  <>
                    <Field label="Are you a boy or girl?">
                      <div className="grid grid-cols-2 gap-3">
                        {(["male", "female"] as const).map((value) => (
                          <button className={`min-h-12 rounded-xl border-2 px-4 font-black transition motion-reduce:transition-none ${gender === value ? "border-primary bg-blue-50 text-primary" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"}`} key={value} onClick={() => setGender(value)} type="button">
                            {value === "male" ? "Boy" : "Girl"}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Your age"><input max={18} min={5} onChange={(event) => setAge(Number(event.target.value))} required type="number" value={age} /></Field>
                      <Field label="Primary level"><select onChange={(event) => setGrade(Number(event.target.value))} value={grade}>{[1, 2, 3, 4, 5, 6].map((item) => <option key={item} value={item}>Basic {item}</option>)}</select></Field>
                    </div>
                  </>
                ) : null}

                {isLearnerSteppedSignup && learnerSignupStep === 3 ? (
                  <>
                    <Field label="Whose phone will you use?">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button className={`min-h-14 rounded-xl border-2 p-3 text-left ${phoneOwner === "self" ? "border-primary bg-blue-50 text-primary" : "border-slate-200"}`} onClick={() => setPhoneOwner("self")} type="button"><b className="block">My own phone</b><span className="text-xs font-medium">The number belongs to me</span></button>
                        <button className={`min-h-14 rounded-xl border-2 p-3 text-left ${phoneOwner === "guardian" ? "border-primary bg-blue-50 text-primary" : "border-slate-200"}`} onClick={() => setPhoneOwner("guardian")} type="button"><b className="block">Parent or guardian</b><span className="text-xs font-medium">Ask an adult to help</span></button>
                      </div>
                    </Field>
                    <Field label={isGuardianPhone ? "Parent or guardian phone" : "Your Ghana phone number"}>
                      <div className="relative w-full">
                        <span className="pointer-events-none absolute inset-y-0 left-0 z-10 grid w-12 place-items-center text-muted"><Phone className="size-5" /></span>
                        <input autoComplete="tel" className="!pl-12 !pr-16" inputMode="tel" onChange={(event) => setPhone(event.target.value)} placeholder="024 123 4567" required value={phone} />
                        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-black text-emerald-700">+233</span>
                      </div>
                      <span className="text-xs font-medium text-muted">{isGuardianPhone ? "Brothers, sisters and twins can share this number. Each child keeps a different username." : "You can enter 024… or +23324…."}</span>
                    </Field>
                  </>
                ) : null}

                {isLearnerSteppedSignup && learnerSignupStep === 4 ? (
                  <>
                    <Field label="Create a password">
                      <div className="relative w-full">
                        <span className="pointer-events-none absolute inset-y-0 left-0 z-10 grid w-12 place-items-center text-muted"><LockKeyhole className="size-5" /></span>
                        <input autoComplete="new-password" className="!pl-12 !pr-12" minLength={8} onChange={(event) => setPassword(event.target.value)} required type={showPassword ? "text" : "password"} value={password} />
                        <button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-1 z-10 my-auto grid size-10 place-items-center rounded-lg text-muted hover:bg-slate-100" onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
                      </div>
                      <span className="text-xs font-medium text-muted">Use at least 8 characters. Keep it secret.</span>
                    </Field>
                    <Field label="Type it one more time">
                      <div className="relative w-full">
                        <span className="pointer-events-none absolute inset-y-0 left-0 z-10 grid w-12 place-items-center text-muted"><LockKeyhole className="size-5" /></span>
                        <input autoComplete="new-password" className="!pl-12 !pr-12" minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} required type={showConfirmPassword ? "text" : "password"} value={confirmPassword} />
                        <button aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"} className="absolute inset-y-0 right-1 z-10 my-auto grid size-10 place-items-center rounded-lg text-muted hover:bg-slate-100" onClick={() => setShowConfirmPassword((visible) => !visible)} type="button">{showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
                      </div>
                      {confirmPassword && password === confirmPassword ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 className="size-3.5" />Great—your passwords match!</span> : null}
                    </Field>
                  </>
                ) : null}

                {isLearnerSteppedSignup && learnerSignupStep === 5 ? (
                  <Field label="6-digit verification code"><input autoComplete="one-time-code" className="text-center text-2xl font-black tracking-[.45em]" inputMode="numeric" maxLength={6} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} pattern="\d{6}" placeholder="000000" required value={otp} /></Field>
                ) : null}

                {isSignup && step === "details" && !isTeacher && !isLearnerSteppedSignup ? (
                  <>
                    <Field label="Learner name"><input autoComplete="name" onChange={(event) => setDisplayName(event.target.value)} placeholder="What should we call you?" required value={displayName} /></Field>
                    <Field label="Username">
                      <div className="relative w-full">
                        <span className="pointer-events-none absolute inset-y-0 left-0 z-10 grid w-12 place-items-center text-muted"><AtSign className="size-5" /></span>
                        <input autoComplete="username" className="!pl-12" maxLength={20} minLength={3} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} pattern="[a-z0-9_]{3,20}" placeholder="e.g. ama_b4" required value={username} />
                      </div>
                      <span className="text-xs font-medium text-muted">3–20 characters. Letters, numbers and underscores. You will use this to sign in.</span>
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Gender"><select onChange={(event) => setGender(event.target.value as "male" | "female")} value={gender}><option value="male">Boy</option><option value="female">Girl</option></select></Field>
                      <Field label="Age"><input max={18} min={5} onChange={(event) => setAge(Number(event.target.value))} required type="number" value={age} /></Field>
                      <Field label="Primary level"><select onChange={(event) => setGrade(Number(event.target.value))} value={grade}>{[1, 2, 3, 4, 5, 6].map((item) => <option key={item} value={item}>Basic {item}</option>)}</select></Field>
                    </div>
                  </>
                ) : null}
                {isSignup && step === "details" && isTeacher ? (
                  <>
                    <Field label="Teacher name"><input autoComplete="name" onChange={(event) => setDisplayName(event.target.value)} placeholder="Your full name" required value={displayName} /></Field>
                    <Field label="School"><input autoComplete="organization" onChange={(event) => setSchool(event.target.value)} placeholder="School or learning centre" required value={school} /></Field>
                    <Field label="Main subject"><select onChange={(event) => setSubjectsTaught(event.target.value)} value={subjectsTaught}><option>Mathematics</option><option>English</option><option>Science</option><option>Multiple subjects</option></select></Field>
                  </>
                ) : null}

                {!isTeacher && (mode === "login" || (isReset && step === "details")) ? (
                  <Field label="Username">
                    <div className="relative w-full">
                      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 grid w-12 place-items-center text-muted"><AtSign className="size-5" /></span>
                      <input autoComplete="username" className="!pl-12" maxLength={20} minLength={3} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} pattern="[a-z0-9_]{3,20}" placeholder="your_username" required value={username} />
                    </div>
                  </Field>
                ) : null}

                {(isTeacher && (mode === "login" || step === "details")) || (isSignup && step === "details" && !isLearnerSteppedSignup) ? (
                  <Field label={isTeacher ? "Ghana phone number" : isGuardianPhone ? "Parent or guardian phone" : "Your Ghana phone number"}>
                    <div className="relative w-full">
                      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 grid w-12 place-items-center text-muted"><Phone className="size-5" /></span>
                      <input autoComplete="tel" className="!pl-12 !pr-16" inputMode="tel" onChange={(event) => setPhone(event.target.value)} placeholder="024 123 4567" required value={phone} />
                      <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-black text-emerald-700">+233</span>
                    </div>
                    {isSignup && !isTeacher ? (
                      isGuardianPhone ? (
                        <span className="text-xs font-medium text-muted">
                          Siblings can share this number. Each child still needs their own username to sign in.{" "}
                          <button className="font-black text-primary hover:text-primary-dark" onClick={() => setPhoneOwner("self")} type="button">I have my own number</button>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-muted">
                          You can enter 024… or +23324….{" "}
                          <button className="inline-flex items-center gap-1 font-black text-primary hover:text-primary-dark" onClick={() => { setPhoneOwner("guardian"); setGuardianInfoOpen(true); }} type="button">
                            <UsersRound className="size-3.5" />Don&apos;t have a personal number?
                          </button>
                        </span>
                      )
                    ) : (
                      <span className="text-xs font-medium text-muted">You can enter 024… or +23324… — we will format it securely.</span>
                    )}
                  </Field>
                ) : null}

                {mode === "login" || (isSignup && step === "details" && !isLearnerSteppedSignup) || (isReset && step === "details") ? (
                  <Field label={isReset ? "New password" : "Password"}>
                    <div className="relative w-full">
                      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 grid w-12 place-items-center text-muted"><LockKeyhole className="size-5" /></span>
                      <input autoComplete={mode === "login" ? "current-password" : "new-password"} className="!pl-12 !pr-12" minLength={8} onChange={(event) => setPassword(event.target.value)} required type={showPassword ? "text" : "password"} value={password} />
                      <button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-1 z-10 my-auto grid size-10 place-items-center rounded-lg text-muted hover:bg-slate-100" onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
                    </div>
                    {mode !== "login" ? <span className="text-xs font-medium text-muted">Use at least 8 characters.</span> : null}
                  </Field>
                ) : null}
                {(isSignup && step === "details" && !isLearnerSteppedSignup) || (isReset && step === "details") ? (
                  <Field label="Confirm password">
                    <div className="relative w-full">
                      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 grid w-12 place-items-center text-muted"><LockKeyhole className="size-5" /></span>
                      <input autoComplete="new-password" className="!pl-12 !pr-12" minLength={8} onChange={(event) => { setConfirmPassword(event.target.value); if (error.startsWith("The passwords do not match")) setError(""); }} required type={showConfirmPassword ? "text" : "password"} value={confirmPassword} />
                      <button aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"} className="absolute inset-y-0 right-1 z-10 my-auto grid size-10 place-items-center rounded-lg text-muted hover:bg-slate-100" onClick={() => setShowConfirmPassword((visible) => !visible)} type="button">{showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
                    </div>
                    {confirmPassword && password === confirmPassword ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 className="size-3.5" />Passwords match</span> : null}
                  </Field>
                ) : null}
                {step === "verify" && !isLearnerSteppedSignup ? <Field label="6-digit verification code"><input autoComplete="one-time-code" className="text-center text-2xl font-black tracking-[.45em]" inputMode="numeric" maxLength={6} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} pattern="\d{6}" placeholder="000000" required value={otp} /></Field> : null}
                {mode === "login" ? (
                  <div className="-mt-1 flex flex-wrap justify-end gap-x-4 gap-y-2">
                    {!isTeacher ? <Link className="text-sm font-black text-primary hover:text-primary-dark" href="/forgot-username">Forgot username?</Link> : null}
                    <Link className="text-sm font-black text-primary hover:text-primary-dark" href={isTeacher ? "/forgot-password/teacher" : "/forgot-password"}>Forgot password?</Link>
                  </div>
                ) : null}
                {error ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-amber-950" role="alert">
                    <div className="flex items-start gap-2.5">
                      <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
                      <div>
                        <p className="text-sm font-black">{suggestedActions.length ? "Let’s get you to the right place" : "Something needs attention"}</p>
                        <p className="mt-1 text-sm leading-5 text-amber-900">{error}</p>
                      </div>
                    </div>
                    {suggestedActions.length ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {suggestedActions.includes("login") ? <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-black text-white" href={loginPath}><KeyRound className="size-4" />Sign in</Link> : null}
                        {suggestedActions.includes("password-reset") ? <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-3 text-sm font-black text-amber-950" href={isTeacher ? "/forgot-password/teacher" : "/forgot-password"}><RotateCcw className="size-4" />Reset password</Link> : null}
                        {suggestedActions.includes("signup") ? <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-black text-white sm:col-span-2" href={signupPath}><UserPlus className="size-4" />Create an account</Link> : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {success ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm" role="status">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><CheckCircle2 className="size-5" /></span>
                    <span>
                      <b className="block">Account created successfully!</b>
                      <span className="mt-1 block text-sm leading-5 text-emerald-800">{success}</span>
                    </span>
                  </div>
                ) : null}
                <button className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-black text-white shadow-[0_10px_25px_rgba(37,99,235,.24)] transition hover:-translate-y-0.5 hover:bg-primary-dark disabled:translate-y-0 disabled:opacity-60" disabled={busy || Boolean(success)} type="submit">
                  {success ? <CheckCircle2 className="size-5" /> : busy ? <Loader2 className="size-5 animate-spin" /> : step === "verify" || (isLearnerSteppedSignup && learnerSignupStep === 5) ? <ShieldCheck className="size-5" /> : <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />}
                  {success
                    ? "Taking you to sign in..."
                    : busy
                      ? learnerSignupStep === 1 && isLearnerSteppedSignup ? "Checking username..." : "Please wait"
                      : isLearnerSteppedSignup
                        ? learnerSignupStep === 4
                          ? "Send my code"
                          : learnerSignupStep === 5
                            ? "Verify and create my account"
                            : "Continue"
                        : mode === "login"
                          ? "Sign in and continue"
                          : step === "details"
                            ? "Send verification code"
                            : isSignup ? "Verify and create account" : "Verify and reset password"}
                </button>
                {isLearnerSteppedSignup && learnerSignupStep > 1 ? (
                  <button className="text-sm font-bold text-primary" onClick={previousLearnerSignupStep} type="button">← Back</button>
                ) : step === "verify" ? <button className="text-sm font-bold text-primary" onClick={() => { setStep("details"); setOtp(""); setError(""); setSuggestedActions([]); setPhoneHint(""); }} type="button">{isReset && !isTeacher ? "Change username" : "Go back"}</button> : null}
              </form>
              <div className="mt-4 border-t border-slate-200 pt-4 text-center text-sm text-text-secondary">
                {mode === "login" ? (
                  <>New to SkulKid? <Link className="font-black text-primary hover:text-primary-dark" href={signupPath}>{isTeacher ? "Create a teacher account" : "Create a learner account"}</Link></>
                ) : mode === "reset" ? (
                  <>Remembered it? <Link className="font-black text-primary hover:text-primary-dark" href={loginPath}>Sign in</Link></>
                ) : (
                  <>Already have an account? <Link className="font-black text-primary hover:text-primary-dark" href={loginPath}>Sign in</Link></>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
      {guardianInfoOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-slate-950/40 p-3 sm:place-items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setGuardianInfoOpen(false);
          }}
        >
          <section
            aria-labelledby="guardian-phone-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,.18)]"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-950" id="guardian-phone-title">
                  Use a guardian phone
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  The phone is only for verification. You sign in with your username.
                </p>
              </div>
              <button
                aria-label="Close information"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setGuardianInfoOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <ol className="space-y-4">
                {[
                  "Enter a parent or guardian Ghana phone number.",
                  "They receive a 6-digit code to approve signup.",
                  "Brothers and sisters can share the same number — each child needs their own username."
                ].map((stepText, index) => (
                  <li className="flex gap-3" key={stepText}>
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-700">{stepText}</p>
                  </li>
                ))}
              </ol>
              <p className="text-xs leading-5 text-slate-500">
                Choose a number your family can still access later for password reset.
              </p>
            </div>

            <footer className="border-t border-slate-100 px-5 py-4 sm:px-6">
              <button
                className="min-h-11 w-full rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
                onClick={() => setGuardianInfoOpen(false)}
                type="button"
              >
                Got it
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-black text-slate-700 [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:bg-white [&_input]:px-4 [&_input]:text-base [&_input]:outline-none [&_input]:transition focus-within:[&_input]:border-primary focus-within:[&_input]:ring-4 focus-within:[&_input]:ring-blue-100 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3 [&_select]:text-base">{label}{children}</label>;
}

function Benefit({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return <div className="rounded-2xl bg-white/10 p-2.5 text-center ring-1 ring-white/15 backdrop-blur sm:p-3"><Icon className="mx-auto size-5 text-amber-300" /><span className="mt-1.5 block text-[11px] font-black sm:text-xs">{label}</span></div>;
}
