"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ClipboardList, Copy, Layers3, Loader2, MessageSquareHeart, MinusCircle, Plus, ShieldCheck, Trophy, Trash2, Users } from "lucide-react";
import type {
  AdviceSuggestionType,
  ClassCourseAssignmentView,
  ClassLeaderboardEntry,
  ClassQuizQuestion,
  ClassQuizView,
  ClassRosterMember,
  TeacherClassSummary
} from "@/lib/classes/types";

type Tab = "roster" | "courses" | "quizzes" | "leaderboard" | "monitor";
type PointReport = { id: string; deductionId: string; studentName: string; amount: number; reason: string; message: string; status: string; createdAt: string; resolutionNote: string | null };

export function TeacherClassDetail({ classId }: { classId: string }) {
  const [tab, setTab] = useState<Tab>("roster");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [classroom, setClassroom] = useState<TeacherClassSummary | null>(null);
  const [roster, setRoster] = useState<ClassRosterMember[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<ClassCourseAssignmentView[]>([]);
  const [quizzes, setQuizzes] = useState<ClassQuizView[]>([]);
  const [leaderboard, setLeaderboard] = useState<ClassLeaderboardEntry[]>([]);
  const [pointReports, setPointReports] = useState<PointReport[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseNote, setCourseNote] = useState("");
  const [classOnlyName, setClassOnlyName] = useState("");
  const [classOnlyDescription, setClassOnlyDescription] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizDeadline, setQuizDeadline] = useState("");
  const [quizXp, setQuizXp] = useState(40);
  const [quizPass, setQuizPass] = useState(70);
  const [quizMaxAttempts, setQuizMaxAttempts] = useState(3);
  const [questions, setQuestions] = useState<ClassQuizQuestion[]>([
    { id: "q-1", prompt: "", type: "multiple_choice", options: ["", "", "", ""], correctIndex: 0 }
  ]);
  const [adviceStudentId, setAdviceStudentId] = useState("");
  const [adviceMessage, setAdviceMessage] = useState("");
  const [adviceType, setAdviceType] = useState<AdviceSuggestionType>("class_adventure");
  const [deductionStudent, setDeductionStudent] = useState<ClassRosterMember | null>(null);
  const [deductionAmount, setDeductionAmount] = useState(1);
  const [deductionReason, setDeductionReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [classResponse, coursesResponse] = await Promise.all([
        fetch(`/api/teacher/classes/${classId}`, { cache: "no-store" }),
        fetch("/api/teacher/courses", { cache: "no-store" })
      ]);
      const payload = await classResponse.json() as {
        classroom?: TeacherClassSummary;
        roster?: ClassRosterMember[];
        courseAssignments?: ClassCourseAssignmentView[];
        quizzes?: ClassQuizView[];
        leaderboard?: ClassLeaderboardEntry[];
        pointReports?: PointReport[];
        error?: string;
      };
      const coursesPayload = await coursesResponse.json() as { courses?: Array<{ id: string; name: string; slug: string }>; error?: string };
      if (!classResponse.ok) throw new Error(payload.error || "Unable to load class.");
      setClassroom(payload.classroom ?? null);
      setRoster(payload.roster ?? []);
      setCourseAssignments(payload.courseAssignments ?? []);
      setQuizzes(payload.quizzes ?? []);
      setLeaderboard(payload.leaderboard ?? []);
      setPointReports(payload.pointReports ?? []);
      setCourses(coursesPayload.courses ?? []);
      if (!adviceStudentId && payload.roster?.[0]) setAdviceStudentId(payload.roster[0].studentId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load class.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [classId]);

  const availableCourses = useMemo(
    () => courses.filter((course) => !courseAssignments.some((assignment) => assignment.courseId === course.id)),
    [courses, courseAssignments]
  );
  const createdSubjects = useMemo(() => courseAssignments.filter((assignment) => assignment.isClassOnly), [courseAssignments]);
  const assignedPlatformSubjects = useMemo(() => courseAssignments.filter((assignment) => !assignment.isClassOnly), [courseAssignments]);

  async function copyJoinLink() {
    if (!classroom) return;
    await navigator.clipboard.writeText(`${window.location.origin}${classroom.joinUrl}`);
    setMessage("Join link copied.");
  }

  async function assignCourse(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCourseId) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId, note: courseNote })
      });
      const payload = await response.json() as { courseAssignments?: ClassCourseAssignmentView[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to assign subject.");
      setCourseAssignments(payload.courseAssignments ?? []);
      setSelectedCourseId("");
      setCourseNote("");
      setMessage("Subject assigned to the class.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to assign subject.");
    } finally {
      setBusy(false);
    }
  }

  async function createClassOnly(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createClassOnly: true,
          name: classOnlyName,
          description: classOnlyDescription
        })
      });
      const payload = await response.json() as { courseAssignments?: ClassCourseAssignmentView[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to create class subject.");
      setCourseAssignments(payload.courseAssignments ?? []);
      setClassOnlyName("");
      setClassOnlyDescription("");
      setMessage("Class-only subject created.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create class subject.");
    } finally {
      setBusy(false);
    }
  }

  async function removeCourse(assignmentId: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/courses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to remove subject.");
      setCourseAssignments((current) => current.filter((item) => item.id !== assignmentId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove subject.");
    } finally {
      setBusy(false);
    }
  }

  async function createQuiz(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizTitle,
          description: quizDescription,
          questions,
          deadline: quizDeadline ? new Date(quizDeadline).toISOString() : null,
          baseXpReward: quizXp,
          passingScore: quizPass,
          maxAttempts: quizMaxAttempts,
          status: "published"
        })
      });
      const payload = await response.json() as { quizzes?: ClassQuizView[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to create quiz.");
      setQuizzes(payload.quizzes ?? []);
      setQuizTitle("");
      setQuizDescription("");
      setQuizDeadline("");
      setQuizMaxAttempts(3);
      setQuestions([{ id: "q-1", prompt: "", type: "multiple_choice", options: ["", "", "", ""], correctIndex: 0 }]);
      setMessage("Quiz published for the class.");
      setTab("quizzes");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create quiz.");
    } finally {
      setBusy(false);
    }
  }

  async function sendAdvice(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: adviceStudentId, message: adviceMessage, suggestionType: adviceType })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to send advice.");
      setAdviceMessage("");
      setMessage("Advice sent to the student.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send advice.");
    } finally {
      setBusy(false);
    }
  }

  async function deductPoints(event: React.FormEvent) {
    event.preventDefault();
    if (!deductionStudent) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/deductions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: deductionStudent.studentId, amount: deductionAmount, reason: deductionReason })
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to deduct points.");
      setMessage(`${deductionAmount} points deducted from ${deductionStudent.displayName}. They can see your reason and report it.`);
      setDeductionStudent(null);
      setDeductionAmount(1);
      setDeductionReason("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to deduct points.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto grid w-full max-w-7xl gap-5">
        <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-52 animate-pulse rounded-[2rem] bg-slate-200" />
        <div className="h-72 animate-pulse rounded-[1.75rem] bg-slate-200" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <p className="font-black">{error || "Class not found."}</p>
        <Link className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-teal-800" href="/teacher/classes"><ArrowLeft className="size-4" />Back to classes</Link>
      </div>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-5 sm:gap-6">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-teal-800 hover:text-teal-950" href="/teacher/classes"><ArrowLeft className="size-4" />All classes</Link>

      <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_24px_60px_rgba(15,23,42,.28)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 20%, rgba(45,212,191,.35), transparent 42%), radial-gradient(circle at 90% 10%, rgba(56,189,248,.18), transparent 34%)"
          }}
        />
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-200/90">Classroom · Basic {classroom.gradeLevel}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{classroom.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {classroom.description || "Share the join link so students can enter this class."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold ring-1 ring-white/15">
                <Users className="size-4 text-teal-200" />
                {classroom.memberCount} students
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold ring-1 ring-white/15">
                <BookOpen className="size-4 text-teal-200" />
                {classroom.courseCount} subjects
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold ring-1 ring-white/15">
                <ClipboardList className="size-4 text-teal-200" />
                {classroom.quizCount} quizzes
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:min-w-[16rem]">
            <button
              className="inline-flex min-h-11 items-center justify-between gap-3 rounded-xl bg-teal-300 px-4 font-black text-slate-950 hover:bg-teal-200"
              onClick={() => void copyJoinLink()}
              type="button"
            >
              <span className="inline-flex items-center gap-2"><Copy className="size-4" />Copy join link</span>
            </button>
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <p className="text-[10px] font-black uppercase tracking-wider text-teal-100">Join code</p>
              <p className="mt-1 font-black tracking-[0.2em]">{classroom.joinCode}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Class management">
        {([
          ["roster", "Roster", Users],
          ["courses", "Subjects", BookOpen],
          ["quizzes", "Quizzes", ClipboardList],
          ["leaderboard", "Leaderboard", Trophy],
          ["monitor", "Monitor & advise", MessageSquareHeart]
        ] as const).map(([id, label, Icon]) => (
          <button
            aria-selected={tab === id}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${tab === id ? "bg-teal-700 text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
            key={id}
            onClick={() => setTab(id)}
            role="tab"
            type="button"
          >
            <Icon className="size-4" />{label}
          </button>
        ))}
      </div>
      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{error}</p> : null}

      {tab === "roster" ? (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Students ({roster.length})</h2>
          {deductionStudent ? (
            <form className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4" onSubmit={deductPoints}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-black text-amber-950">Deduct points from {deductionStudent.displayName}</h3><p className="mt-1 text-sm text-amber-900">Current balance: {deductionStudent.xp} points. The student will receive your exact reason.</p></div>
                <button className="text-sm font-bold text-amber-900" onClick={() => setDeductionStudent(null)} type="button">Cancel</button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[10rem_1fr_auto]">
                <label className="grid gap-1 text-xs font-black uppercase tracking-wider text-amber-950">Points (max 50)<input className="min-h-11 rounded-xl border border-amber-300 bg-white px-3 text-base font-medium" max={Math.min(50, deductionStudent.xp)} min={1} onChange={(event) => setDeductionAmount(Number(event.target.value))} required type="number" value={deductionAmount} /></label>
                <label className="grid gap-1 text-xs font-black uppercase tracking-wider text-amber-950">Reason (required)<textarea className="min-h-20 rounded-xl border border-amber-300 bg-white px-3 py-2 text-base font-medium normal-case tracking-normal" maxLength={600} minLength={12} onChange={(event) => setDeductionReason(event.target.value)} placeholder="Describe the physical or offline reward and why points are being deducted." required value={deductionReason} /></label>
                <button className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 font-black text-white disabled:opacity-50" disabled={busy || deductionReason.trim().length < 12 || deductionAmount > deductionStudent.xp} type="submit">{busy ? <Loader2 className="size-4 animate-spin" /> : <MinusCircle className="size-4" />} Confirm</button>
              </div>
              <p className="mt-3 flex items-start gap-2 text-xs font-bold leading-5 text-amber-900"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Safeguards: 50-point action limit, 100 points and 5 actions per student per 24 hours, no negative balances, and a permanent admin audit trail.</p>
            </form>
          ) : null}
          {roster.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No students yet. Share the join link to grow your class.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Class XP</th>
                    <th className="px-3 py-2">XP</th>
                    <th className="px-3 py-2">Stars</th>
                    <th className="px-3 py-2">Streak</th>
                    <th className="px-3 py-2">Lessons</th>
                    <th className="px-3 py-2">Quizzes</th>
                    <th className="px-3 py-2">Avg score</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((member) => (
                    <tr className="border-b border-slate-100" key={member.studentId}>
                      <td className="px-3 py-3 font-bold text-slate-900">{member.displayName}<div className="text-xs font-medium text-slate-500">{member.grade}</div></td>
                      <td className="px-3 py-3">{member.classXp}</td>
                      <td className="px-3 py-3">{member.xp}</td>
                      <td className="px-3 py-3">{member.stars}</td>
                      <td className="px-3 py-3">{member.streak}d</td>
                      <td className="px-3 py-3">{member.completedLessons}</td>
                      <td className="px-3 py-3">{member.quizzesPassed}/{member.quizzesTaken}</td>
                      <td className="px-3 py-3">{member.averageQuizScore == null ? "—" : `${member.averageQuizScore}%`}</td>
                      <td className="px-3 py-3"><button className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-300 px-3 text-xs font-black text-amber-800 disabled:opacity-50" disabled={member.xp < 1} onClick={() => { setDeductionStudent(member); setDeductionAmount(1); setError(""); setMessage(""); }} type="button"><MinusCircle className="size-3.5" /> Deduct</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "courses" ? (
        <section className="grid gap-5">
          <div className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-violet-800 via-indigo-800 to-slate-950 p-6 text-white shadow-xl sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-violet-200">Class subject studio</p><h2 className="mt-2 text-3xl font-black">Subjects made for {classroom.name}</h2><p className="mt-2 max-w-2xl text-violet-100">Create a private subject, organise it into modules, and build lessons directly inside it. Students in this class see the finished learning path.</p></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white/10 p-3"><b className="block text-2xl">{createdSubjects.length}</b><span className="text-xs text-violet-100">Created</span></div><div className="rounded-xl bg-white/10 p-3"><b className="block text-2xl">{createdSubjects.reduce((sum, item) => sum + item.moduleCount, 0)}</b><span className="text-xs text-violet-100">Modules</span></div><div className="rounded-xl bg-white/10 p-3"><b className="block text-2xl">{createdSubjects.reduce((sum, item) => sum + item.lessonCount, 0)}</b><span className="text-xs text-violet-100">Lessons</span></div></div></div>
          </div>

          <form className="rounded-[1.5rem] border border-violet-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={createClassOnly}>
            <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Plus className="size-5" /></span><div><h2 className="text-xl font-black">Create a new class subject</h2><p className="mt-1 text-sm text-slate-600">It will immediately become available in Create Lesson, where you can add a module or place a lesson.</p></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
              <label className="grid gap-1.5 text-sm font-bold">Subject name<input className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setClassOnlyName(event.target.value)} placeholder="e.g. Creative Arts" required value={classOnlyName} /></label>
              <label className="grid gap-1.5 text-sm font-bold">Description<input className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setClassOnlyDescription(event.target.value)} placeholder="What will students learn?" value={classOnlyDescription} /></label>
              <button className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 font-black text-white disabled:opacity-60" disabled={busy || !classOnlyName.trim()} type="submit"><Plus className="size-4" /> Create subject</button>
            </div>
          </form>

          <div>
            <div className="flex items-end justify-between gap-3"><div><h2 className="text-xl font-black">Your class subjects</h2><p className="mt-1 text-sm text-slate-600">Subjects created specifically for this class.</p></div></div>
            {createdSubjects.length ? <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{createdSubjects.map((assignment) => (
              <article className="flex min-h-64 flex-col rounded-[1.5rem] border border-violet-200 bg-gradient-to-b from-violet-50 to-white p-5 shadow-sm" key={assignment.id}>
                <div className="flex items-start justify-between gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-violet-700 text-white"><BookOpen className="size-6" /></span><span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black uppercase text-violet-800">Class only</span></div>
                <h3 className="mt-4 text-xl font-black text-slate-950">{assignment.courseName}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{assignment.description || "A private learning path for this class."}</p>
                <div className="mt-4 flex gap-2 text-xs font-black"><span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200"><Layers3 className="size-3.5" />{assignment.moduleCount} modules</span><span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200"><BookOpen className="size-3.5" />{assignment.lessonCount} lessons</span></div>
                <div className="mt-auto pt-5"><Link className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 font-black text-white" href={`/teacher/lessons/new?classId=${encodeURIComponent(classId)}&courseId=${encodeURIComponent(assignment.courseId)}`}>Create module or lesson <ArrowRight className="size-4" /></Link></div>
              </article>
            ))}</div> : <div className="mt-4 rounded-[1.5rem] border border-dashed border-violet-300 bg-violet-50 p-8 text-center"><BookOpen className="mx-auto size-10 text-violet-500" /><h3 className="mt-3 text-lg font-black">No class subjects yet</h3><p className="mt-1 text-sm text-slate-600">Use the form above to create the first subject for this class.</p></div>}
          </div>

          <details className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer font-black">Assign an existing platform subject ({assignedPlatformSubjects.length} assigned)</summary>
            <p className="mt-2 text-sm text-slate-600">Add an existing published subject without making a new class-only subject.</p>
            <form className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_1fr_auto]" onSubmit={assignCourse}><select className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setSelectedCourseId(event.target.value)} required value={selectedCourseId}><option value="">Choose a published subject</option>{availableCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select><input className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setCourseNote(event.target.value)} placeholder="Optional class note" value={courseNote} /><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 font-black text-white disabled:opacity-60" disabled={busy || !selectedCourseId} type="submit"><Plus className="size-4" /> Assign</button></form>
            {assignedPlatformSubjects.length ? <div className="mt-4 grid gap-2">{assignedPlatformSubjects.map((assignment) => <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3" key={assignment.id}><div><p className="font-black">{assignment.courseName}</p><p className="text-xs text-slate-500">{assignment.note || "Platform subject"}</p></div><button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-rose-700" onClick={() => void removeCourse(assignment.id)} type="button"><Trash2 className="size-4" />Remove</button></div>)}</div> : null}
          </details>
        </section>
      ) : null}

      {tab === "quizzes" ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-gradient-to-r from-violet-700 to-blue-700 p-5 text-white">
            <div><h2 className="text-xl font-black">Reusable quiz library</h2><p className="mt-1 text-sm text-violet-100">Assign an existing challenge to this class or several classes at once.</p></div>
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-violet-800" href="/teacher/quizzes"><ClipboardList className="size-4" />Open quiz library</Link>
          </div>
          <form className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" onSubmit={createQuiz}>
            <h2 className="text-xl font-black">Create a class quiz</h2>
            <p className="mt-1 text-sm text-slate-600">Set a deadline, XP reward, attempts and passing score. Results feed into student gamification.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-bold">Title<input className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setQuizTitle(event.target.value)} required value={quizTitle} /></label>
              <label className="grid gap-1.5 text-sm font-bold">Deadline<input className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setQuizDeadline(event.target.value)} type="datetime-local" value={quizDeadline} /></label>
              <label className="grid gap-1.5 text-sm font-bold">XP reward<input className="min-h-11 rounded-xl border border-slate-300 px-3" max={500} min={0} onChange={(event) => setQuizXp(Number(event.target.value))} type="number" value={quizXp} /></label>
              <label className="grid gap-1.5 text-sm font-bold">Passing score %<input className="min-h-11 rounded-xl border border-slate-300 px-3" max={100} min={0} onChange={(event) => setQuizPass(Number(event.target.value))} type="number" value={quizPass} /></label>
              <label className="grid gap-1.5 text-sm font-bold">Max attempts<input className="min-h-11 rounded-xl border border-slate-300 px-3" max={20} min={1} onChange={(event) => setQuizMaxAttempts(Number(event.target.value))} type="number" value={quizMaxAttempts} /></label>
              <label className="grid gap-1.5 text-sm font-bold sm:col-span-2">Description<textarea className="min-h-20 rounded-xl border border-slate-300 px-3 py-2" onChange={(event) => setQuizDescription(event.target.value)} value={quizDescription} /></label>
            </div>
            <div className="mt-5 grid gap-4">
              {questions.map((question, index) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={question.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-black">Question {index + 1}</p>
                    <select
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      onChange={(event) => {
                        const type = event.target.value as ClassQuizQuestion["type"];
                        setQuestions((current) => current.map((item, itemIndex) => itemIndex === index
                          ? { ...item, type, options: type === "true_false" ? ["True", "False"] : ["", "", "", ""], correctIndex: 0 }
                          : item));
                      }}
                      value={question.type}
                    >
                      <option value="multiple_choice">Multiple choice</option>
                      <option value="true_false">True / False</option>
                    </select>
                  </div>
                  <input
                    className="mt-3 min-h-11 w-full rounded-xl border border-slate-300 px-3"
                    onChange={(event) => setQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, prompt: event.target.value } : item))}
                    placeholder="Question prompt"
                    required
                    value={question.prompt}
                  />
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" key={`${question.id}-${optionIndex}`}>
                        <input
                          checked={question.correctIndex === optionIndex}
                          name={`correct-${question.id}`}
                          onChange={() => setQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, correctIndex: optionIndex } : item))}
                          type="radio"
                        />
                        {question.type === "true_false" ? (
                          <span className="font-bold">{option}</span>
                        ) : (
                          <input
                            className="min-h-9 w-full rounded-lg border border-slate-200 px-2"
                            onChange={(event) => setQuestions((current) => current.map((item, itemIndex) => {
                              if (itemIndex !== index) return item;
                              const options = [...item.options];
                              options[optionIndex] = event.target.value;
                              return { ...item, options };
                            }))}
                            placeholder={`Option ${optionIndex + 1}`}
                            required
                            value={option}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
                onClick={() => setQuestions((current) => [...current, { id: `q-${current.length + 1}`, prompt: "", type: "multiple_choice", options: ["", "", "", ""], correctIndex: 0 }])}
                type="button"
              >
                <Plus className="size-4" /> Add question
              </button>
            </div>
            <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-5 font-black text-white disabled:opacity-60" disabled={busy} type="submit">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ClipboardList className="size-4" />}
              Publish quiz
            </button>
          </form>
          <div className="grid gap-3">
            {quizzes.map((quiz) => (
              <article className="rounded-[1.25rem] border border-slate-200 bg-white p-4" key={quiz.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">{quiz.title}</h3>
                    <p className="text-sm text-slate-600">{quiz.questions.length} questions · {quiz.baseXpReward} XP · pass {quiz.passingScore}% · {quiz.maxAttempts} attempts</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-teal-700">{quiz.status}{quiz.deadline ? ` · due ${new Date(quiz.deadline).toLocaleString()}` : ""}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{quiz.attemptCount} attempts</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "leaderboard" ? (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Class leaderboard</h2>
          <p className="mt-1 text-sm text-slate-600">Ranked by class quiz XP, then best quiz average, then platform XP.</p>
          {leaderboard.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No students on the leaderboard yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Rank</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Class XP</th>
                    <th className="px-3 py-2">Class stars</th>
                    <th className="px-3 py-2">Quiz avg</th>
                    <th className="px-3 py-2">Quizzes passed</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr className="border-b border-slate-100" key={entry.studentId}>
                      <td className="px-3 py-3 font-black text-teal-700">#{entry.rank}</td>
                      <td className="px-3 py-3 font-bold text-slate-900">{entry.displayName}</td>
                      <td className="px-3 py-3">{entry.classXp}</td>
                      <td className="px-3 py-3">{entry.classStars}</td>
                      <td className="px-3 py-3">{entry.bestQuizAverage == null ? "—" : `${entry.bestQuizAverage}%`}</td>
                      <td className="px-3 py-3">{entry.quizzesPassed}/{entry.quizzesAttempted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "monitor" ? (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          {pointReports.length ? (
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 shadow-sm lg:col-span-2">
              <h2 className="text-xl font-black text-rose-950">Student point reports</h2>
              <p className="mt-1 text-sm text-rose-900">These reports are also logged for administrators. Only an admin can uphold or reverse the deduction.</p>
              <div className="mt-4 grid gap-3">
                {pointReports.map((report) => <article className="rounded-xl border border-rose-200 bg-white p-4" key={report.id}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black">{report.studentName} reported a {report.amount}-point deduction</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black uppercase">{report.status}</span></div><p className="mt-2 text-sm"><b>Your reason:</b> {report.reason}</p><p className="mt-1 text-sm"><b>Student’s report:</b> {report.message}</p>{report.resolutionNote ? <p className="mt-2 text-sm font-bold text-emerald-800">Admin response: {report.resolutionNote}</p> : null}</article>)}
              </div>
            </div>
          ) : null}
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">Performance snapshot</h2>
            <p className="mt-1 text-sm text-slate-600">Encourage learners who need more practice in class or on the wider SkulKid platform.</p>
            <div className="mt-4 grid gap-3">
              {roster.length === 0 ? <p className="text-sm text-slate-600">Invite students to start monitoring progress.</p> : null}
              {roster.map((member) => {
                const needsSupport = (member.averageQuizScore != null && member.averageQuizScore < 70) || member.completedLessons < 2;
                return (
                  <article className={`rounded-2xl border p-4 ${needsSupport ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`} key={member.studentId}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-black text-slate-950">{member.displayName}</h3>
                      <span className="text-xs font-black uppercase tracking-wider">{needsSupport ? "Needs a nudge" : "On track"}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {member.classXp} class XP · {member.xp} XP · {member.stars} stars · {member.completedLessons} lessons · quiz avg {member.averageQuizScore == null ? "—" : `${member.averageQuizScore}%`}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {needsSupport
                        ? "Suggest a class quiz retake or a platform adventure in Subjects."
                        : "Celebrate progress and invite them to help classmates or explore a new subject."}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
          <form className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" onSubmit={sendAdvice}>
            <h2 className="text-xl font-black">Send advice</h2>
            <p className="mt-1 text-sm text-slate-600">Guide a student toward more class work or platform adventures.</p>
            <label className="mt-4 grid gap-1.5 text-sm font-bold">
              Student
              <select className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setAdviceStudentId(event.target.value)} required value={adviceStudentId}>
                {roster.map((member) => <option key={member.studentId} value={member.studentId}>{member.displayName}</option>)}
              </select>
            </label>
            <label className="mt-3 grid gap-1.5 text-sm font-bold">
              Suggestion type
              <select className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setAdviceType(event.target.value as AdviceSuggestionType)} value={adviceType}>
                <option value="class_adventure">More adventures in class</option>
                <option value="platform_adventure">Explore the wider platform</option>
                <option value="general">General encouragement</option>
              </select>
            </label>
            <label className="mt-3 grid gap-1.5 text-sm font-bold">
              Message
              <textarea className="min-h-32 rounded-xl border border-slate-300 px-3 py-2" onChange={(event) => setAdviceMessage(event.target.value)} placeholder="Try the new class quiz, or open Mathematics for extra practice." required value={adviceMessage} />
            </label>
            <button className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 font-black text-white disabled:opacity-60" disabled={busy || !adviceStudentId} type="submit">
              <MessageSquareHeart className="size-4" /> Send advice
            </button>
          </form>
        </section>
      ) : null}
    </main>
  );
}
