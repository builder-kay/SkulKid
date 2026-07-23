"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export async function readAdminSetting<T>(key: string): Promise<T | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.from("AdminDashboardSetting").select("settings").eq("key", key).maybeSingle();
  if (error) throw error;
  return (data?.settings as T | undefined) ?? null;
}

export async function writeAdminSetting(key: string, settings: unknown) {
  const supabase = createBrowserSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");
  const { error } = await supabase.from("AdminDashboardSetting").upsert({ key, settings, updatedBy: user.id }, { onConflict: "key" });
  if (error) throw error;
}

export async function deleteAdminSetting(key: string) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.from("AdminDashboardSetting").delete().eq("key", key);
  if (error) throw error;
}
