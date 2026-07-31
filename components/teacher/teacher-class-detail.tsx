"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, ClipboardList, Copy, Layers3, Library, Loader2, MinusCircle, Plus, ShieldCheck, Trophy, Trash2, UserRoundCheck, Users } from "lucide-react";
import type {
  ClassCourseAssignmentView,
  ClassLeaderboardEntry,
  ClassQuizQuestion,
  ClassQuizView,
  ClassRosterMember,
  TeacherClassSummary
} from "@/lib/classes/types";
import { TeacherPerformanceWorkspace } from "@/components/teacher/teacher-performance-workspace";
import { TeacherClassTeam } from "@/components/teacher/teacher-class-team";
import { cn } from "@/lib/utils";

type Tab = "roster" | "courses" | "quizzes" | "leaderboard" | "performance" | "team";
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
  const [quizCourseId, setQuizCourseId] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizStartAt, setQuizStartAt] = useState("");
  const [quizDeadline, setQuizDeadline] = useState("");
  const [quizOffPlatformReward, setQuizOffPlatformReward] = useState("");
  const [quizXp, setQuizXp] = useState(40);
  const [quizPass, setQuizPass] = useState(70);
  const [quizMaxAttempts, setQuizMaxAttempts] = useState(3);
  const [questions, setQuestions] = useState<ClassQuizQuestion[]>([
    { id: "q-1", prompt: "", type: "multiple_choice", options: ["", "", "", ""], correctIndex: 0 }
  ]);
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
      setQuizCourseId((current) => current || payload.courseAssignments?.[0]?.courseId || "");
      setQuizzes(payload.quizzes ?? []);
      setLeaderboard(payload.leaderboard ?? []);
      setPointReports(payload.pointReports ?? []);
      setCourses(coursesPayload.courses ?? []);
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

  async function removeCourse(assignment: ClassCourseAssignmentView) {
    const confirmed = assignment.isClassOnly
      ? window.confirm(`Delete “${assignment.courseName}”? Lessons and quizzes you created in this private subject will also be removed. This cannot be undone.`)
      : window.confirm(`Remove “${assignment.courseName}” from this class? Students will no longer see this subject here.`);
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/courses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          assignment.isClassOnly
            ? { deleteSubject: true, courseId: assignment.courseId }
            : { assignmentId: assignment.id }
        )
      });
      const payload = await response.json() as { courseAssignments?: ClassCourseAssignmentView[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to remove subject.");
      if (payload.courseAssignments) setCourseAssignments(payload.courseAssignments);
      else setCourseAssignments((current) => current.filter((item) => item.id !== assignment.id));
      setMessage(assignment.isClassOnly ? "Subject deleted." : "Subject removed from the class.");
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
          courseId: quizCourseId || null,
          description: quizDescription,
          questions,
          startAt: quizStartAt ? new Date(quizStartAt).toISOString() : null,
          deadline: quizDeadline ? new Date(quizDeadline).toISOString() : null,
          offPlatformReward: quizOffPlatformReward,
          baseXpReward: quizXp,
          passingScore: quizPass,
          maxAttempts: quizMaxAttempts,
          status: "published"
        })
      });
      const payload = await response.json() as { quizzes?: ClassQuizView[]; sms?: { sent: number; failed: number; skipped: number }; moderation?: { state: string; message: string }; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to create quiz.");
      setQuizzes(payload.quizzes ?? []);
      setQuizTitle("");
      setQuizDescription("");
      setQuizStartAt("");
      setQuizDeadline("");
      setQuizOffPlatformReward("");
      setQuizMaxAttempts(3);
      setQuestions([{ id: "q-1", prompt: "", type: "multiple_choice", options: ["", "", "", ""], correctIndex: 0 }]);
      setMessage(payload.moderation && payload.moderation.state !== "published"
        ? payload.moderation.message
        : payload.sms?.failed
        ? `Quiz published. ${payload.sms.failed} SMS message${payload.sms.failed === 1 ? "" : "s"} could not be delivered.`
        : `Quiz published and ${payload.sms?.sent ?? 0} learner SMS message${payload.sms?.sent === 1 ? "" : "s"} sent.`);
      setTab("quizzes");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create quiz.");
    } finally {
      setBusy(false);
    }
  }

  async function endQuiz(quizId: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/teacher/classes/${classId}/quizzes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, status: "closed" })
      });
      const payload = await response.json() as { quizzes?: ClassQuizView[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to end quiz.");
      setQuizzes(payload.quizzes ?? []);
      setMessage("Quiz ended. Learners can no longer access it.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to end quiz.");
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

  const totalModules = courseAssignments.reduce((sum, item) => sum + item.moduleCount, 0);
  const totalLessons = courseAssignments.reduce((sum, item) => sum + item.lessonCount, 0);

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-5 sm:gap-6">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-teal-800 hover:text-teal-950" href="/teacher/classes"><ArrowLeft className="size-4" />All classes</Link>

      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white shadow-[0_24px_60px_rgba(15,23,42,.28)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 20%, rgba(45,212,191,.32), transparent 42%), radial-gradient(circle at 88% 12%, rgba(148,163,184,.18), transparent 36%), linear-gradient(135deg, transparent 40%, rgba(15,118,110,.18))"
          }}
        />
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200/90">Classroom · Basic {classroom.gradeLevel}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{classroom.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {classroom.description || "Share the join link so students can enter this class."}
            </p>
            <dl className="mt-6 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/15">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-teal-100/80">Students</dt>
                <dd className="mt-1 text-2xl font-black">{classroom.memberCount}</dd>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/15">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-teal-100/80">Subjects</dt>
                <dd className="mt-1 text-2xl font-black">{classroom.courseCount}</dd>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/15">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-teal-100/80">Quizzes</dt>
                <dd className="mt-1 text-2xl font-black">{classroom.quizCount}</dd>
              </div>
            </dl>
          </div>
          {classroom.capabilities.manageStudents ? (
            <div className="grid gap-3 rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-teal-100">Join code</p>
                <p className="mt-1 font-black tracking-[0.28em] text-2xl sm:text-3xl">{classroom.joinCode}</p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-300 px-4 font-black text-slate-950 hover:bg-teal-200"
                onClick={() => void copyJoinLink()}
                type="button"
              >
                <Copy className="size-4" />Copy join link
              </button>
            </div>
          ) : (
            <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-xs font-black uppercase tracking-wider text-teal-100">Your role</p>
              <p className="mt-1 text-xl font-black">Subject Teacher</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{classroom.assignedSubjects.map((item) => item.name).join(" · ") || "Assigned subjects will appear here."}</p>
            </div>
          )}
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Class management">
        {([
          ["roster", "Roster", Users],
          ["courses", "Subjects", BookOpen],
          ["quizzes", "Quizzes", ClipboardList],
          ...(classroom.capabilities.viewWholeClassPerformance ? [["leaderboard", "Leaderboard", Trophy] as const] : []),
          ["performance", "Performance", BarChart3],
          ...(classroom.capabilities.manageTeachingTeam ? [["team", "Teaching team", UserRoundCheck] as const] : [])
        ] as const).map(([id, label, Icon]) => (
          <button
            aria-selected={tab === id}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-black transition",
              tab === id ? "bg-teal-700 text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
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
                    {classroom.capabilities.viewWholeClassPerformance ? <>
                    <th className="px-3 py-2">Class XP</th>
                    <th className="px-3 py-2">XP</th>
                    <th className="px-3 py-2">Stars</th>
                    <th className="px-3 py-2">Streak</th>
                    <th className="px-3 py-2">Lessons</th>
                    <th className="px-3 py-2">Quizzes</th>
                    <th className="px-3 py-2">Avg score</th>
                    </> : <th className="px-3 py-2">Membership</th>}
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
              {roster.map((member) => (
                    <tr className="border-b border-slate-100" key={member.studentId}>
                      <td className="px-3 py-3 font-bold text-slate-900">{member.displayName}<div className="text-xs font-medium text-slate-500">{member.grade}</div></td>
                      {classroom.capabilities.viewWholeClassPerformance ? <>
                      <td className="px-3 py-3">{member.classXp}</td>
                      <td className="px-3 py-3">{member.xp}</td>
                      <td className="px-3 py-3">{member.stars}</td>
                      <td className="px-3 py-3">{member.streak}d</td>
                      <td className="px-3 py-3">{member.completedLessons}</td>
                      <td className="px-3 py-3">{member.quizzesPassed}/{member.quizzesTaken}</td>
                      <td className="px-3 py-3">{member.averageQuizScore == null ? "—" : `${member.averageQuizScore}%`}</td>
                      </> : <td className="px-3 py-3 text-slate-500">Active class member</td>}
                      <td className="px-3 py-3">{classroom.capabilities.managePoints ? <button className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-300 px-3 text-xs font-black text-amber-800 disabled:opacity-50" disabled={member.xp < 1} onClick={() => { setDeductionStudent(member); setDeductionAmount(1); setError(""); setMessage(""); }} type="button"><MinusCircle className="size-3.5" /> Deduct</button> : <span className="text-xs text-slate-400">Subject view</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "courses" ? (
        <section className="grid gap-6">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-teal-100 bg-[linear-gradient(135deg,#f0fdfa_0%,#ffffff_45%,#f8fafc_100%)] p-6 sm:p-8">
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Subjects</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Learning for {classroom.name}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
                  Build private class subjects or assign platform subjects. Students see the finished path once modules and lessons are ready.
                </p>
              </div>
              <dl className="grid grid-cols-3 gap-3 text-center lg:min-w-[20rem]">
                <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-200">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Subjects</dt>
                  <dd className="mt-1 text-2xl font-black text-slate-950">{courseAssignments.length}</dd>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-200">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Modules</dt>
                  <dd className="mt-1 text-2xl font-black text-slate-950">{totalModules}</dd>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-200">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lessons</dt>
                  <dd className="mt-1 text-2xl font-black text-slate-950">{totalLessons}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className={cn(
            "grid gap-6",
            classroom.capabilities.manageClass && "xl:grid-cols-[minmax(0,1fr)_22.5rem] xl:items-start"
          )}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-slate-950">All subjects</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {createdSubjects.length} class-only · {assignedPlatformSubjects.length} from platform
                  </p>
                </div>
                {classroom.capabilities.manageClass ? (
                  <Link
                    className="inline-flex min-h-10 items-center gap-2 text-sm font-black text-teal-800 hover:text-teal-950"
                    href={`/teacher/lessons/new?classId=${encodeURIComponent(classId)}`}
                  >
                    Open lesson builder <ArrowRight className="size-4" />
                  </Link>
                ) : null}
              </div>

              {courseAssignments.length ? (
                <div className={cn(
                  "mt-4 grid gap-4 sm:grid-cols-2",
                  classroom.capabilities.manageClass ? "xl:grid-cols-2" : "xl:grid-cols-3"
                )}>
                  {[...createdSubjects, ...assignedPlatformSubjects].map((assignment) => (
                    <article
                      className={cn(
                        "group flex min-h-[17rem] flex-col rounded-[1.5rem] border p-5 transition",
                        assignment.isClassOnly
                          ? "border-teal-200 bg-gradient-to-b from-teal-50/90 to-white"
                          : "border-slate-200 bg-white"
                      )}
                      key={assignment.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={cn(
                          "grid size-12 place-items-center rounded-2xl text-white",
                          assignment.isClassOnly ? "bg-teal-700" : "bg-slate-800"
                        )}>
                          {assignment.isClassOnly ? <BookOpen className="size-5" /> : <Library className="size-5" />}
                        </span>
                        <span className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
                          assignment.isClassOnly ? "bg-teal-100 text-teal-900" : "bg-slate-100 text-slate-700"
                        )}>
                          {assignment.isClassOnly ? "Class only" : "Platform"}
                        </span>
                      </div>
                      <h4 className="mt-4 text-xl font-black tracking-tight text-slate-950">{assignment.courseName}</h4>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                        {assignment.description || assignment.note || (assignment.isClassOnly
                          ? "Private learning path for this class."
                          : "Shared platform subject assigned to this class.")}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-slate-700">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200">
                          <Layers3 className="size-3.5 text-teal-700" />{assignment.moduleCount} modules
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200">
                          <BookOpen className="size-3.5 text-teal-700" />{assignment.lessonCount} lessons
                        </span>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Link
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-black text-white hover:bg-teal-800"
                          href={`/teacher/lessons/new?classId=${encodeURIComponent(classId)}&courseId=${encodeURIComponent(assignment.courseId)}`}
                        >
                          {assignment.isClassOnly ? "Add module or lesson" : "Build lessons"}
                          <ArrowRight className="size-4" />
                        </Link>
                        {classroom.capabilities.manageClass ? (
                          <button
                            aria-label={`Remove ${assignment.courseName}`}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-rose-700 hover:bg-rose-50"
                            disabled={busy}
                            onClick={() => void removeCourse(assignment)}
                            type="button"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-dashed border-teal-300 bg-teal-50/60 px-6 py-12 text-center">
                  <BookOpen className="mx-auto size-10 text-teal-700" />
                  <h3 className="mt-3 text-lg font-black text-slate-950">No subjects yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                    Use the forms on the right to create a class subject or assign one from the platform.
                  </p>
                </div>
              )}

              {!classroom.capabilities.manageClass ? (
                <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                  You can teach the subjects assigned to you. Only the class teacher can create or assign new ones.
                </p>
              ) : null}
            </div>

            {classroom.capabilities.manageClass ? (
              <aside className="grid gap-4 xl:sticky xl:top-4">
                <form className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" onSubmit={createClassOnly}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-teal-100 text-teal-800"><Plus className="size-5" /></span>
                    <div>
                      <h3 className="text-lg font-black text-slate-950">Create a class subject</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Private to this class. Ready immediately in the lesson builder.</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                      Subject name
                      <input className="min-h-11 rounded-xl border border-slate-300 px-3 font-medium" onChange={(event) => setClassOnlyName(event.target.value)} placeholder="e.g. Creative Arts" required value={classOnlyName} />
                    </label>
                    <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                      Description
                      <textarea className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 font-medium" onChange={(event) => setClassOnlyDescription(event.target.value)} placeholder="What will students learn?" value={classOnlyDescription} />
                    </label>
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 font-black text-white hover:bg-teal-800 disabled:opacity-60" disabled={busy || !classOnlyName.trim()} type="submit">
                      {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                      Create subject
                    </button>
                  </div>
                </form>

                <form className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" onSubmit={assignCourse}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-800"><Library className="size-5" /></span>
                    <div>
                      <h3 className="text-lg font-black text-slate-950">Assign a platform subject</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Reuse a published SkulKid subject without recreating it.</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                      Published subject
                      <select className="min-h-11 rounded-xl border border-slate-300 px-3 font-medium" onChange={(event) => setSelectedCourseId(event.target.value)} required value={selectedCourseId}>
                        <option value="">Choose a published subject</option>
                        {availableCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                      Class note <span className="font-medium text-slate-500">(optional)</span>
                      <input className="min-h-11 rounded-xl border border-slate-300 px-3 font-medium" onChange={(event) => setCourseNote(event.target.value)} placeholder="e.g. Term 2 focus" value={courseNote} />
                    </label>
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 font-black text-white hover:bg-slate-800 disabled:opacity-60" disabled={busy || !selectedCourseId || availableCourses.length === 0} type="submit">
                      {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                      Assign subject
                    </button>
                    {availableCourses.length === 0 ? <p className="text-xs font-bold text-slate-500">Every available published subject is already assigned.</p> : null}
                  </div>
                </form>
              </aside>
            ) : null}
          </div>
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
            <p className="mt-1 text-sm text-slate-600">Choose an optional schedule, platform rewards and a real-world class reward. Publishing sends learners an SMS with the direct link.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-bold">Subject<select className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setQuizCourseId(event.target.value)} required={classroom.teacherRole === "subject_teacher"} value={quizCourseId}><option value="">General class quiz</option>{courseAssignments.map((subject) => <option key={subject.courseId} value={subject.courseId}>{subject.courseName}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm font-bold">Title<input className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setQuizTitle(event.target.value)} required value={quizTitle} /></label>
              <label className="grid gap-1.5 text-sm font-bold">Starts at (optional)<input className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setQuizStartAt(event.target.value)} type="datetime-local" value={quizStartAt} /></label>
              <label className="grid gap-1.5 text-sm font-bold">Ends / take by (optional)<input className="min-h-11 rounded-xl border border-slate-300 px-3" onChange={(event) => setQuizDeadline(event.target.value)} type="datetime-local" value={quizDeadline} /></label>
              <label className="grid gap-1.5 text-sm font-bold">XP reward<input className="min-h-11 rounded-xl border border-slate-300 px-3" max={500} min={0} onChange={(event) => setQuizXp(Number(event.target.value))} type="number" value={quizXp} /></label>
              <label className="grid gap-1.5 text-sm font-bold">Passing score %<input className="min-h-11 rounded-xl border border-slate-300 px-3" max={100} min={0} onChange={(event) => setQuizPass(Number(event.target.value))} type="number" value={quizPass} /></label>
              <label className="grid gap-1.5 text-sm font-bold">Max attempts<input className="min-h-11 rounded-xl border border-slate-300 px-3" max={20} min={1} onChange={(event) => setQuizMaxAttempts(Number(event.target.value))} type="number" value={quizMaxAttempts} /></label>
              <label className="grid gap-1.5 text-sm font-bold sm:col-span-2">Description<textarea className="min-h-20 rounded-xl border border-slate-300 px-3 py-2" onChange={(event) => setQuizDescription(event.target.value)} value={quizDescription} /></label>
              <label className="grid gap-1.5 text-sm font-bold sm:col-span-2">Real-world reward (optional)<textarea className="min-h-20 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2" maxLength={500} onChange={(event) => setQuizOffPlatformReward(event.target.value)} placeholder="e.g. Highest score gets a standing clap or no sweeping for a week." value={quizOffPlatformReward} /><span className="text-xs font-normal text-slate-500">Learners will see this alongside XP and stars.</span></label>
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
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-teal-700">{quiz.status}{quiz.startAt ? ` · opens ${new Date(quiz.startAt).toLocaleString()}` : ""}{quiz.deadline ? ` · ends ${new Date(quiz.deadline).toLocaleString()}` : " · open until ended"}</p>
                    {quiz.offPlatformReward ? <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">Class reward: {quiz.offPlatformReward}</p> : null}
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{quiz.attemptCount} attempts</span>
                </div>
                {quiz.status === "published" ? <button className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-rose-200 px-4 text-sm font-black text-rose-700 hover:bg-rose-50 disabled:opacity-50" disabled={busy} onClick={() => void endQuiz(quiz.id)} type="button">End quiz now</button> : null}
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

      {tab === "performance" ? <TeacherPerformanceWorkspace classId={classId} pointReports={pointReports} /> : null}
      {tab === "team" && classroom.capabilities.manageTeachingTeam ? <TeacherClassTeam classId={classId} subjects={courseAssignments} /> : null}
    </main>
  );
}
