import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/classes/classroom-server";
import { checkBreakSchedule, resolvePlaybackApproval } from "@/lib/break-zone/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const student = await requireStudent(); const admin = createAdminClient();
    const [{ data: config }, { data: videos }, { data: sessions }, { data: notifications }] = await Promise.all([
      admin.from("BreakZoneConfig").select("enabled").eq("id", true).maybeSingle(),
      admin.from("BreakZoneVideo").select("*").eq("metadataStatus", "approved").in("moderationStatus", ["approved","rejected","pending"]).order("updatedAt", { ascending: false }).limit(48),
      admin.from("BreakZoneViewSession").select("videoId,startedAt,watchedSeconds,completed").eq("studentId", student.id).order("startedAt", { ascending: false }).limit(30),
      admin.from("BreakZoneNotification").select("*").eq("studentId", student.id).order("createdAt", { ascending: false }).limit(20)
    ]);
    const recentIds = [...new Set((sessions ?? []).map((item) => String(item.videoId)))];
    const ordered = [...(videos ?? [])].sort((a, b) => {
      const ai = recentIds.indexOf(String(a.id)); const bi = recentIds.indexOf(String(b.id));
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
    const cards = await Promise.all(ordered.slice(0, 24).map(async (video) => {
      const approval = await resolvePlaybackApproval(student.id, String(video.id));
      return { id: video.id, title: video.title, channelTitle: video.channelTitle, thumbnailUrl: video.thumbnailUrl, durationSeconds: video.durationSeconds, summary: video.summary, moderationStatus: video.moderationStatus, playable: approval.allowed, reason: approval.reason };
    }));
    return NextResponse.json({ featureEnabled: config?.enabled !== false, videos: cards, recentIds, sessions: sessions ?? [], notifications: notifications ?? [], schedule: await checkBreakSchedule(student.id) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load Break Zone." }, { status: 400 }); }
}

export async function DELETE() {
  try {
    const student = await requireStudent(); const admin = createAdminClient();
    await Promise.all([
      admin.from("BreakZoneSearchEvent").delete().eq("studentId", student.id),
      admin.from("BreakZoneViewSession").delete().eq("studentId", student.id),
      admin.from("BreakZoneInterestProfile").delete().eq("studentId", student.id)
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not clear history." }, { status: 400 }); }
}
