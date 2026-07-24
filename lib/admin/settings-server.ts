import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function readAdminSettingServer<T>(key: string): Promise<T | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("AdminDashboardSetting").select("settings").eq("key", key).maybeSingle();
  if (error) throw error;
  return (data?.settings as T | undefined) ?? null;
}

export async function writeAdminSettingServer(key: string, settings: unknown) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const admin = createAdminClient();
  const { error } = await admin.from("AdminDashboardSetting").upsert(
    { key, settings, updatedBy: user.id, updatedAt: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) throw error;
}
