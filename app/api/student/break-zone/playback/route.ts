import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/classes/classroom-server";
import { resolvePlaybackApproval } from "@/lib/break-zone/server";
import { createAdminClient } from "@/lib/supabase/admin";

const startSchema = z.object({ action: z.literal("start"), videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/) });
const heartbeatSchema = z.object({ action: z.literal("heartbeat"), sessionId: z.string().uuid(), positionSeconds: z.number().int().nonnegative(), playing: z.boolean() });
const schema = z.discriminatedUnion("action", [startSchema, heartbeatSchema]);

export async function POST(request: Request) {
  try {
    const student = await requireStudent(); const input = schema.parse(await request.json()); const admin = createAdminClient();
    if (input.action === "start") {
      const approval = await resolvePlaybackApproval(student.id, input.videoId);
      if (!approval.allowed) throw new Error(approval.reason);
      const { data: session, error } = await admin.from("BreakZoneViewSession").insert({ studentId: student.id, videoId: input.videoId }).select("id").single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ sessionId: session.id, embedUrl: `https://www.youtube-nocookie.com/embed/${input.videoId}?enablejsapi=1&rel=0&playsinline=1` });
    }
    const { data: session, error } = await admin.from("BreakZoneViewSession").select("*,BreakZoneVideo(durationSeconds)").eq("id", input.sessionId).eq("studentId", student.id).maybeSingle();
    if (error || !session) throw new Error("Playback session not found.");
    const approval = await resolvePlaybackApproval(student.id, String(session.videoId));
    if (!approval.allowed) throw new Error(approval.reason);
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(session.lastHeartbeatAt).getTime()) / 1000));
    const added = input.playing ? Math.min(20, elapsed) : 0;
    const duration = Number((session.BreakZoneVideo as { durationSeconds?: number } | null)?.durationSeconds ?? 0);
    const watched = Math.min(duration, Number(session.watchedSeconds) + added);
    const maximum = Math.min(duration, Math.max(Number(session.maxPositionSeconds), input.positionSeconds));
    const completed = duration > 0 && watched >= duration * 0.8 && maximum >= duration * 0.8;
    await admin.from("BreakZoneViewSession").update({ watchedSeconds: watched, maxPositionSeconds: maximum, lastHeartbeatAt: new Date().toISOString(), completed, completedAt: completed ? new Date().toISOString() : session.completedAt }).eq("id", session.id);
    const reward = completed ? await awardBreakXp(student.id, String(session.videoId), admin) : { xp: 0, state: null };
    return NextResponse.json({ ok: true, completed, earnedXp: reward.xp, state: reward.state });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Playback update failed." }, { status: 400 }); }
}

async function awardBreakXp(studentId: string, videoId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data: config } = await admin.from("BreakZoneConfig").select("dailyXpCap,completionXp").eq("id", true).single();
  const completionXp = Number(config?.completionXp ?? 10);
  const dailyCap = Number(config?.dailyXpCap ?? 30);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Accra" }).format(new Date());
  const { data: existing } = await admin.from("BreakZoneReward").select("id").eq("studentId", studentId).eq("videoId", videoId).eq("rewardDate", day).maybeSingle();
  if (existing) return { xp: 0, state: null };
  const { data: rewards } = await admin.from("BreakZoneReward").select("xp").eq("studentId", studentId).eq("rewardDate", day);
  if ((rewards ?? []).reduce((sum, item) => sum + Number(item.xp), 0) + completionXp > dailyCap) return { xp: 0, state: null };
  const { error } = await admin.from("BreakZoneReward").insert({ studentId, videoId, rewardDate: day, xp: completionXp });
  if (error?.code === "23505") return { xp: 0, state: null };
  if (error) throw new Error(error.message);
  const { data: saved } = await admin.from("StudentGameState").select("state").eq("userId", studentId).maybeSingle();
  const state = (saved?.state && typeof saved.state === "object" ? structuredClone(saved.state) : {}) as Record<string, any>;
  state.xp = Number(state.xp ?? 0) + completionXp; state.avatarPoints = Number(state.avatarPoints ?? state.xp - completionXp) + completionXp;
  state.lastReward = { title: "Break Zone discovery!", detail: "You watched an approved video thoughtfully.", xp: completionXp, stars: 0 };
  state.history = [{ id: `break-${crypto.randomUUID()}`, type: "lesson", title: "Break Zone video completed", detail: `Earned ${completionXp} XP.`, xp: completionXp, stars: 0, rank: 0, createdAt: new Date().toISOString() }, ...(Array.isArray(state.history) ? state.history : [])].slice(0, 100);
  await admin.from("StudentGameState").upsert({ userId: studentId, state }, { onConflict: "userId" });
  return { xp: completionXp, state };
}
