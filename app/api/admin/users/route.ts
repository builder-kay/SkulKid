import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAppRole, type AppRole } from "@/lib/auth/roles";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw error;

    const users = (data.users ?? []).map((user) => {
      const metadata = user.user_metadata ?? {};
      return {
        id: user.id,
        phone: user.phone ?? null,
        email: user.email ?? null,
        displayName: typeof metadata.display_name === "string" && metadata.display_name.trim()
          ? metadata.display_name
          : user.phone || user.email || "SkulKid user",
        role: resolveAppRole(user.app_metadata?.role),
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load users." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { userId?: string; role?: AppRole };
    if (!body.userId || !body.role) {
      return NextResponse.json({ error: "userId and role are required." }, { status: 400 });
    }
    if (!["student", "teacher", "admin"].includes(body.role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(body.userId, {
      app_metadata: { role: body.role }
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update user." }, { status: 500 });
  }
}
