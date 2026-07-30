import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/classes/classroom-server";
import { checkBreakSchedule, requestVideo, resolvePlaybackApproval, searchYouTube } from "@/lib/break-zone/server";

export const runtime = "nodejs";
export const maxDuration = 60;
const querySchema = z.string().trim().min(2).max(100);

export async function GET(request: Request) {
  try {
    const student = await requireStudent();
    const query = querySchema.parse(new URL(request.url).searchParams.get("q"));
    const videos = await searchYouTube(query, student.id);
    const schedule = await checkBreakSchedule(student.id);
    const results = await Promise.all(videos.map(async (video) => {
      const approval = await resolvePlaybackApproval(student.id, video.id);
      return { ...video, description: video.description.slice(0, 240), playable: approval.allowed, state: approval.allowed ? "playable" : video.moderationStatus === "rejected" ? "teacher_review" : video.moderationStatus === "suspended" ? "suspended" : "unreviewed" };
    }));
    return NextResponse.json({ results, schedule });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Search failed." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const student = await requireStudent();
    const { videoId } = z.object({ videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/) }).parse(await request.json());
    return NextResponse.json(await requestVideo(videoId, student.id), { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not request this video." }, { status: 400 });
  }
}
