"use client";

import { useCallback, useEffect, useState } from "react";
import { sampleStudentProfile } from "@/data/sample-student-progress";

const storageKey = "skulkid-student-profile-v1";
const changedEvent = "skulkid:student-profile-changed";

export type StudentProfileData = { displayName: string; age: number; grade: string; school: string; bio: string; favouriteSubject: "Mathematics" | "English" | "Science"; dailyGoalXp: number; avatarUrl: string | null; joinedAt: string };
const initialProfile: StudentProfileData = { displayName: sampleStudentProfile.displayName, age: sampleStudentProfile.age, grade: "Basic 4", school: "", bio: "Ready to learn something amazing every day!", favouriteSubject: "Mathematics", dailyGoalXp: sampleStudentProfile.dailyGoalXp, avatarUrl: null, joinedAt: "2026-07-21T00:00:00.000Z" };

export function readStudentProfile(): StudentProfileData { if (typeof window === "undefined") return initialProfile; try { return { ...initialProfile, ...JSON.parse(localStorage.getItem(storageKey) ?? "{}") }; } catch { return initialProfile; } }
export function saveStudentProfile(profile: StudentProfileData) { localStorage.setItem(storageKey, JSON.stringify(profile)); window.dispatchEvent(new Event(changedEvent)); }
export function useStudentProfile() { const [profile, setProfile] = useState(initialProfile); useEffect(() => { const refresh = () => setProfile(readStudentProfile()); refresh(); window.addEventListener("storage", refresh); window.addEventListener(changedEvent, refresh); return () => { window.removeEventListener("storage", refresh); window.removeEventListener(changedEvent, refresh); }; }, []); const save = useCallback((next: StudentProfileData) => { saveStudentProfile(next); setProfile(next); }, []); return { profile, save }; }
