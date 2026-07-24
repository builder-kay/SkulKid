import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireTeacher();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("Subject")
      .select("id,name,slug,status,visibility")
      .eq("status", "ACTIVE")
      .neq("visibility", "class")
      .order("name");
    if (error) throw new Error(error.message);
    return NextResponse.json({
      courses: (data ?? []).map((course) => ({
        id: course.id as string,
        name: course.name as string,
        slug: course.slug as string
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load courses.";
    const status = message.includes("required") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
