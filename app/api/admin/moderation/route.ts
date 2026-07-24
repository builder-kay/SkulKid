import { NextResponse } from "next/server";
import { readAdminLessonsServer, writeAdminLessonServer } from "@/lib/admin/lesson-library-server";

export async function GET() {
  try {
    const lessons = await readAdminLessonsServer();
    const items = lessons
      .filter((lesson) => lesson.status === "draft")
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 40)
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        subject: lesson.subject,
        status: lesson.status,
        grade: lesson.grade,
        updatedAt: lesson.updatedAt
      }));
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load moderation queue." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { id?: string; status?: "published" | "draft" | "archived" };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "id and status are required." }, { status: 400 });
    }

    const lessons = await readAdminLessonsServer();
    const lesson = lessons.find((item) => item.id === body.id);
    if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

    if (body.status === "archived") {
      await writeAdminLessonServer({ ...lesson, status: "draft", updatedAt: new Date().toISOString() });
      return NextResponse.json({ ok: true, note: "Lesson returned to draft for teacher revision." });
    }

    await writeAdminLessonServer({ ...lesson, status: body.status, updatedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update content." }, { status: 500 });
  }
}
