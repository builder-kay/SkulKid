"use client";

import { useCallback, useEffect, useState } from "react";
import { sampleStudentProfile } from "@/data/sample-student-progress";

const storageKey = "skulkid-student-profile-v1";
const changedEvent = "skulkid:student-profile-changed";

export type AvatarConfig = { bodyStyle: "slim" | "classic" | "strong"; headStyle: "block" | "round" | "oval" | "wide"; skinColor: string; hairStyle: "short" | "afro" | "braids" | "locs" | "mohawk" | "bald"; hairColor: string; eyeColor: string; shirtStyle: "skulkid" | "math" | "science" | "reader" | "plain"; shirtColor: string; pantsStyle: "trousers" | "shorts" | "skirt"; pantsColor: string; shoeColor: string; equippedPremium: Partial<Record<"shirt" | "bottoms" | "shoes" | "glasses" | "watch" | "skateboard" | "bag" | "cap", string>> };
export const defaultAvatar: AvatarConfig = { bodyStyle: "classic", headStyle: "block", skinColor: "#8D5524", hairStyle: "afro", hairColor: "#21140F", eyeColor: "#3B2414", shirtStyle: "skulkid", shirtColor: "#2563EB", pantsStyle: "trousers", pantsColor: "#172554", shoeColor: "#FFFFFF", equippedPremium: {} };
export type StudentProfileData = { displayName: string; age: number; grade: string; school: string; bio: string; favouriteSubject: "Mathematics" | "English" | "Science"; dailyGoalXp: number; avatarUrl: string | null; avatar: AvatarConfig; joinedAt: string };
const initialProfile: StudentProfileData = { displayName: sampleStudentProfile.displayName, age: sampleStudentProfile.age, grade: "Basic 4", school: "", bio: "Ready to learn something amazing every day!", favouriteSubject: "Mathematics", dailyGoalXp: sampleStudentProfile.dailyGoalXp, avatarUrl: null, avatar: defaultAvatar, joinedAt: "2026-07-21T00:00:00.000Z" };

export function readStudentProfile(): StudentProfileData { if (typeof window === "undefined") return initialProfile; try { const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Partial<StudentProfileData>; return { ...initialProfile, ...saved, avatar: { ...defaultAvatar, ...(saved.avatar ?? {}), equippedPremium: { ...defaultAvatar.equippedPremium, ...(saved.avatar?.equippedPremium ?? {}) } } }; } catch { return initialProfile; } }
export function saveStudentProfile(profile: StudentProfileData) { localStorage.setItem(storageKey, JSON.stringify(profile)); window.dispatchEvent(new Event(changedEvent)); }
export function useStudentProfile() { const [profile, setProfile] = useState(initialProfile); useEffect(() => { const refresh = () => setProfile(readStudentProfile()); refresh(); window.addEventListener("storage", refresh); window.addEventListener(changedEvent, refresh); return () => { window.removeEventListener("storage", refresh); window.removeEventListener(changedEvent, refresh); }; }, []); const save = useCallback((next: StudentProfileData) => { saveStudentProfile(next); setProfile(next); }, []); return { profile, save }; }
