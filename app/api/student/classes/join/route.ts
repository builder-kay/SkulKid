import { NextResponse } from "next/server";
import { z } from "zod";
import { joinClassByCode, previewJoinClass, requireStudent } from "@/lib/classes/classroom-server";

const schema = z.object({ code: z.string().min(4).max(24) });

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code") ?? "";
    const preview = await previewJoinClass(code);
    return NextResponse.json({ classroom: preview });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid join link." }, { status: 404 });
  }
}

export async function POST(request: Request) {
  try {
    const student = await requireStudent();
    const input = schema.parse(await request.json());
    const classroom = await joinClassByCode(student.id, input.code);
    return NextResponse.json({ classroom }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to join class.";
    const status = message.includes("required") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
