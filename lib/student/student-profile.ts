"use client";

import { useCallback, useEffect, useState } from "react";
import { sampleStudentProfile } from "@/data/sample-student-progress";

const changedEvent = "skulkid:student-profile-changed";

export type AvatarConfig = { gender: "male" | "female"; bodyStyle: "slim" | "classic" | "strong"; headStyle: "block" | "round" | "oval" | "wide"; skinColor: string; hairStyle: "short" | "afro" | "braids" | "locs" | "mohawk" | "long" | "ponytail" | "bald"; hairColor: string; eyeColor: string; shirtStyle: "skulkid" | "math" | "science" | "reader" | "plain"; shirtColor: string; pantsStyle: "trousers" | "shorts" | "skirt"; pantsColor: string; shoeColor: string; equippedPremium: Partial<Record<"shirt" | "bottoms" | "shoes" | "glasses" | "watch" | "skateboard" | "bag" | "cap", string>> };
export const defaultAvatar: AvatarConfig = { gender: "male", bodyStyle: "classic", headStyle: "block", skinColor: "#8D5524", hairStyle: "afro", hairColor: "#21140F", eyeColor: "#3B2414", shirtStyle: "skulkid", shirtColor: "#2563EB", pantsStyle: "trousers", pantsColor: "#172554", shoeColor: "#FFFFFF", equippedPremium: {} };
export type StudentProfileData = { displayName: string; gender: "male" | "female"; age: number; grade: string; school: string; bio: string; favouriteSubject: "Mathematics" | "English" | "Science"; dailyGoalXp: number; avatarUrl: string | null; avatar: AvatarConfig; joinedAt: string };
const initialProfile: StudentProfileData = { displayName: sampleStudentProfile.displayName, gender: "male", age: sampleStudentProfile.age, grade: "Basic 4", school: "", bio: "Ready to learn something amazing every day!", favouriteSubject: "Mathematics", dailyGoalXp: sampleStudentProfile.dailyGoalXp, avatarUrl: null, avatar: defaultAvatar, joinedAt: "2026-07-21T00:00:00.000Z" };
let cachedProfile: StudentProfileData | null = null;
let profileRequest: Promise<StudentProfileData> | null = null;

function mergeProfile(saved: Partial<StudentProfileData>): StudentProfileData {
  const gender = saved.gender ?? saved.avatar?.gender ?? initialProfile.gender;
  return { ...initialProfile, ...saved, gender, avatar: { ...defaultAvatar, ...(saved.avatar ?? {}), gender, equippedPremium: { ...defaultAvatar.equippedPremium, ...(saved.avatar?.equippedPremium ?? {}) } } };
}

export async function readStudentProfile(): Promise<StudentProfileData> {
  if (cachedProfile) return cachedProfile;
  if (profileRequest) return profileRequest;
  profileRequest = (async () => {
    const { createBrowserSupabaseClient } = await import("@/lib/supabase/browser");
    const supabase = createBrowserSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return initialProfile;
    const { data } = await supabase.from("StudentProfile").select("profile").eq("userId", user.id).maybeSingle();
    const metadata = user.user_metadata;
    cachedProfile = mergeProfile({
      displayName: typeof metadata.display_name === "string" ? metadata.display_name : undefined,
      gender: metadata.gender === "female" ? "female" : metadata.gender === "male" ? "male" : undefined,
      age: typeof metadata.age === "number" ? metadata.age : undefined,
      grade: typeof metadata.grade === "number" ? `Basic ${metadata.grade}` : undefined,
      ...(data?.profile as Partial<StudentProfileData> | undefined)
    });
    return cachedProfile;
  })().finally(() => { profileRequest = null; });
  return profileRequest;
}

export async function saveStudentProfile(profile: StudentProfileData) {
  const { createBrowserSupabaseClient } = await import("@/lib/supabase/browser");
  const supabase = createBrowserSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");
  const { error } = await supabase.from("StudentProfile").upsert({ userId: user.id, profile }, { onConflict: "userId" });
  if (error) throw error;
  cachedProfile = profile;
  window.dispatchEvent(new CustomEvent(changedEvent, { detail: profile }));
}

export function useStudentProfile() {
  const [profile, setProfile] = useState(initialProfile);
  useEffect(() => {
    let active = true;
    void readStudentProfile().then((next) => { if (active) setProfile(next); });
    const refresh = (event: Event) => {
      const next = (event as CustomEvent<StudentProfileData>).detail;
      if (next) setProfile(next);
      else void readStudentProfile().then(setProfile);
    };
    window.addEventListener(changedEvent, refresh);
    return () => { active = false; window.removeEventListener(changedEvent, refresh); };
  }, []);
  const save = useCallback(async (next: StudentProfileData) => {
    await saveStudentProfile(next);
    setProfile(next);
  }, []);
  return { profile, save };
}
