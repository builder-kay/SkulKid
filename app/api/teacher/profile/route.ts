import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { findSupabaseUserByUsername, normalizeUsername } from "@/lib/auth/student-identity";
import { createAdminClient } from "@/lib/supabase/admin";

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  username: z.string().trim().min(3).max(20),
  school: z.string().trim().min(2).max(100),
  subjectsTaught: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(500).default(""),
  qualification: z.string().trim().max(120).default(""),
  yearsExperience: z.number().int().min(0).max(60)
});

function profileFrom(user: { user_metadata?: Record<string, unknown>; phone?: string | null }) {
  const metadata = user.user_metadata ?? {};
  return {
    displayName: typeof metadata.display_name === "string" ? metadata.display_name : "",
    username: typeof metadata.username === "string" ? metadata.username : "",
    school: typeof metadata.school === "string" ? metadata.school : "",
    subjectsTaught: typeof metadata.subjects_taught === "string" ? metadata.subjects_taught : "",
    bio: typeof metadata.bio === "string" ? metadata.bio : "",
    qualification: typeof metadata.qualification === "string" ? metadata.qualification : "",
    yearsExperience: typeof metadata.years_experience === "number" ? metadata.years_experience : 0,
    phone: typeof metadata.phone_e164 === "string" ? metadata.phone_e164 : user.phone ?? ""
  };
}

export async function GET() {
  try {
    const teacher = await requireTeacher();
    return NextResponse.json({ profile: profileFrom(teacher) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load your profile." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const teacher = await requireTeacher();
    const input = profileSchema.parse(await request.json());
    const username = normalizeUsername(input.username);
    const existing = await findSupabaseUserByUsername(username);
    if (existing && existing.id !== teacher.id) {
      return NextResponse.json({ error: "That username is already used by another account." }, { status: 409 });
    }
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.updateUserById(teacher.id, {
      user_metadata: {
        ...teacher.user_metadata,
        display_name: input.displayName,
        username,
        school: input.school,
        subjects_taught: input.subjectsTaught,
        bio: input.bio,
        qualification: input.qualification,
        years_experience: input.yearsExperience
      }
    });
    if (error || !data.user) throw new Error(error?.message || "Unable to save your profile.");
    return NextResponse.json({ profile: profileFrom(data.user) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save your profile." }, { status: 400 });
  }
}
