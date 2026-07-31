"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Award, Star, Volume2, VolumeX, X, Zap } from "lucide-react";
import { CharacterAvatar } from "@/components/student/character-avatar";
import {
  mergeStudentCelebrations,
  studentCelebrationEvent,
  type StudentCelebration
} from "@/lib/gamification/student-celebration";
import {
  CELEBRATION_SOUND_STORAGE_KEY,
  playSuccessSound
} from "@/lib/student/success-moments";
import type { AvatarConfig } from "@/lib/student/student-profile";
import { cn } from "@/lib/utils";

const COMBINE_WINDOW_MS = 750;
const DISPLAY_DURATION_MS = 4_200;
const SOUND_STORAGE_KEY = CELEBRATION_SOUND_STORAGE_KEY;
const seenCelebrationIds = new Set<string>();

const confetti = Array.from({ length: 36 }, (_, index) => ({
  id: index,
  colour: ["#facc15", "#f472b6", "#22d3ee", "#8b5cf6", "#34d399", "#fb7185"][index % 6],
  left: (index * 29 + 7) % 100,
  delay: (index % 9) * 0.07,
  duration: 2.4 + (index % 5) * 0.22,
  rotation: (index * 47) % 180,
  size: 7 + (index % 4) * 2
}));

type Props = {
  avatar: AvatarConfig;
  learnerName: string;
};

export function StudentCelebrationHost({ avatar, learnerName }: Props) {
  const [active, setActive] = useState<StudentCelebration | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const activeRef = useRef<StudentCelebration | null>(null);
  const pendingRef = useRef<StudentCelebration[]>([]);
  const queueRef = useRef<StudentCelebration[]>([]);
  const combineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const displayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPlayedCelebrationRef = useRef("");

  const showNext = useCallback(() => {
    if (activeRef.current || queueRef.current.length === 0) return;
    const next = queueRef.current.shift() ?? null;
    activeRef.current = next;
    setActive(next);
  }, []);

  const finishActive = useCallback(() => {
    if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
    displayTimerRef.current = null;
    activeRef.current = null;
    setActive(null);
    setTimeout(showNext, 0);
  }, [showNext]);

  const playSound = useCallback(() => {
    try {
      playSuccessSound("celebrate");
      setPlaybackBlocked(false);
    } catch {
      setPlaybackBlocked(true);
    }
  }, []);

  useEffect(() => {
    setSoundEnabled(window.localStorage.getItem(SOUND_STORAGE_KEY) !== "off");
  }, []);

  useEffect(() => {
    function receiveCelebration(event: Event) {
      const celebration = (event as CustomEvent<StudentCelebration>).detail;
      if (!celebration?.id || seenCelebrationIds.has(celebration.id)) return;
      seenCelebrationIds.add(celebration.id);
      pendingRef.current.push(celebration);
      if (combineTimerRef.current) clearTimeout(combineTimerRef.current);
      combineTimerRef.current = setTimeout(() => {
        const pending = pendingRef.current.splice(0);
        if (pending.length) queueRef.current.push(mergeStudentCelebrations(pending));
        combineTimerRef.current = null;
        showNext();
      }, COMBINE_WINDOW_MS);
    }

    window.addEventListener(studentCelebrationEvent, receiveCelebration);
    return () => {
      window.removeEventListener(studentCelebrationEvent, receiveCelebration);
      if (combineTimerRef.current) clearTimeout(combineTimerRef.current);
    };
  }, [showNext]);

  useEffect(() => {
    if (!active) return;
    if (soundEnabled && lastPlayedCelebrationRef.current !== active.id) {
      lastPlayedCelebrationRef.current = active.id;
      playSound();
    }
    displayTimerRef.current = setTimeout(finishActive, DISPLAY_DURATION_MS);
    return () => {
      if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
      displayTimerRef.current = null;
    };
  }, [active, finishActive, playSound, soundEnabled]);

  useEffect(() => () => {
    if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
  }, []);

  const announcement = useMemo(() => {
    if (!active) return "";
    const parts = [
      active.title,
      active.xp ? `${active.xp} XP earned` : "",
      active.stars ? `${active.stars} stars earned` : "",
      ...active.achievements.map((achievement) => `${achievement.name} achievement unlocked`)
    ].filter(Boolean);
    return parts.join(". ");
  }, [active]);

  function toggleSound() {
    if (playbackBlocked && soundEnabled) {
      playSound();
      return;
    }
    const next = !soundEnabled;
    setSoundEnabled(next);
    window.localStorage.setItem(SOUND_STORAGE_KEY, next ? "on" : "off");
    setPlaybackBlocked(false);
  }

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[110] grid place-items-center overflow-hidden p-4">
      <p aria-live="polite" className="sr-only" role="status">{announcement}</p>
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="student-celebration-glow absolute inset-0" />
        {confetti.map((piece) => (
          <i
            className={cn(
              "student-celebration-confetti absolute -top-8 block",
              piece.id % 3 === 0 ? "rounded-full" : piece.id % 3 === 1 ? "rounded-sm" : "student-celebration-confetti-star"
            )}
            key={piece.id}
            style={{
              "--celebration-colour": piece.colour,
              "--celebration-delay": `${piece.delay}s`,
              "--celebration-duration": `${piece.duration}s`,
              "--celebration-rotation": `${piece.rotation}deg`,
              "--celebration-size": `${piece.size}px`,
              left: `${piece.left}%`
            } as React.CSSProperties}
          />
        ))}
      </div>

      <section
        aria-label="Learning reward"
        className="student-celebration-card pointer-events-auto relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 p-5 text-center shadow-[0_32px_100px_rgba(76,29,149,.38)] backdrop-blur sm:p-6"
      >
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-amber-400 via-fuchsia-500 to-cyan-400" />
        <div className="absolute right-3 top-3 flex gap-1.5">
          <button
            aria-label={playbackBlocked && soundEnabled ? "Play celebration sound" : soundEnabled ? "Mute celebration sound" : "Turn on celebration sound"}
            className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-violet-100 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            onClick={toggleSound}
            title={playbackBlocked && soundEnabled ? "Play sound" : soundEnabled ? "Mute sound" : "Turn on sound"}
            type="button"
          >
            {soundEnabled ? <Volume2 aria-hidden="true" className="size-5" /> : <VolumeX aria-hidden="true" className="size-5" />}
          </button>
          <button
            aria-label="Close celebration"
            className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-rose-100 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            onClick={finishActive}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="mx-auto mt-5 grid size-48 place-items-center sm:size-52">
          <CharacterAvatar
            avatar={avatar}
            celebrationSignal={active.id}
            className="size-full bg-gradient-to-b from-cyan-100 via-violet-100 to-amber-100 shadow-inner"
            label={`${learnerName}'s celebrating avatar`}
            motion="expressive"
          />
        </div>

        <p className="mt-3 text-xs font-black uppercase tracking-[.18em] text-violet-700">You did it, {learnerName}!</p>
        <h2 className="mt-1 text-3xl font-black text-slate-950">{active.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{active.detail}</p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {active.xp > 0 ? <RewardPill icon={Zap} label={`+${active.xp} XP`} tone="blue" /> : null}
          {active.stars > 0 ? <RewardPill icon={Star} label={`+${active.stars} star${active.stars === 1 ? "" : "s"}`} tone="amber" /> : null}
          {active.achievements.map((achievement) => (
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-100 px-4 text-sm font-black text-emerald-900" key={achievement.id}>
              <Award aria-hidden="true" className="size-4" />
              {achievement.name} unlocked
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function RewardPill({ icon: Icon, label, tone }: {
  icon: typeof Zap;
  label: string;
  tone: "blue" | "amber";
}) {
  return (
    <span className={cn(
      "inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-black",
      tone === "blue" ? "bg-blue-100 text-blue-900" : "bg-amber-100 text-amber-950"
    )}>
      <Icon aria-hidden="true" className={cn("size-4", tone === "amber" && "fill-current")} />
      {label}
    </span>
  );
}
