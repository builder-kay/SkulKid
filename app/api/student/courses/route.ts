import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listApprovedPublicLearningSnapshots } from "@/lib/public-learning/publication-server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const publications = await listApprovedPublicLearningSnapshots();
    const courses = publications
      .map(({ snapshot }) => ({ ...snapshot.course, units: snapshot.units }))
      .sort((a, b) => a.order - b.order)
      .map(({ order: _order, ...course }) => course);
    return NextResponse.json({ courses }, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load Public Learning." }, { status: 500 });
  }
}
