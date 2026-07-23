import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const stateSchema = z.record(z.string(), z.unknown());

async function authenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data, error } = await createAdminClient().from("StudentGameState").select("state").eq("userId", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ state: data?.state ?? null });
}

export async function PUT(request: Request) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const state = stateSchema.parse(await request.json());
    const { error } = await createAdminClient().from("StudentGameState").upsert({ userId: user.id, state }, { onConflict: "userId" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid game state." }, { status: 400 });
  }
}
