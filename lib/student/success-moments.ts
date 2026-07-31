"use client";

import { isButtonSoundEnabled } from "@/lib/student/ui-sounds";

export const avatarReactionEvent = "skulkid:avatar-reaction";
export const CELEBRATION_SOUND_STORAGE_KEY = "skulkid:celebration-sound";

export type SuccessMomentKind = "correct" | "level_up" | "streak" | "shop" | "celebrate";

type AudioContextWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type Tone = {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  gap?: number;
};

let sharedContext: AudioContext | null = null;
let lastMomentAt = 0;

function getAudioContext() {
  const AudioContextConstructor =
    window.AudioContext || (window as AudioContextWindow).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  sharedContext = sharedContext || new AudioContextConstructor();
  return sharedContext;
}

function isCelebrationSoundEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(CELEBRATION_SOUND_STORAGE_KEY) !== "off";
}

function shouldPlaySound(kind: SuccessMomentKind) {
  if (kind === "correct" || kind === "shop") return isButtonSoundEnabled();
  return isCelebrationSoundEnabled();
}

function playToneSequence(tones: Tone[]) {
  try {
    const now = performance.now();
    if (now - lastMomentAt < 70) return;
    lastMomentAt = now;

    const context = getAudioContext();
    if (!context) return;

    void context.resume().then(() => {
      let cursor = context.currentTime + 0.01;
      for (const tone of tones) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const peak = tone.gain ?? 0.1;
        oscillator.type = tone.type ?? "triangle";
        oscillator.frequency.setValueAtTime(tone.frequency, cursor);
        gain.gain.setValueAtTime(0.0001, cursor);
        gain.gain.exponentialRampToValueAtTime(peak, cursor + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, cursor + tone.duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(cursor);
        oscillator.stop(cursor + tone.duration + 0.02);
        cursor += tone.duration + (tone.gap ?? 0.03);
      }
    });
  } catch {
    // Audio may be blocked until a gesture; success UI still works silently.
  }
}

export function playSuccessSound(kind: SuccessMomentKind) {
  if (typeof window === "undefined" || !shouldPlaySound(kind)) return;

  if (kind === "correct") {
    playToneSequence([
      { frequency: 784, duration: 0.08, gain: 0.09 },
      { frequency: 988, duration: 0.12, gain: 0.1, gap: 0.02 }
    ]);
    return;
  }

  if (kind === "shop") {
    playToneSequence([
      { frequency: 880, duration: 0.06, type: "sine", gain: 0.08 },
      { frequency: 1175, duration: 0.08, type: "sine", gain: 0.09, gap: 0.015 },
      { frequency: 1568, duration: 0.12, type: "sine", gain: 0.08, gap: 0.02 }
    ]);
    return;
  }

  if (kind === "streak") {
    playToneSequence([
      { frequency: 523, duration: 0.09, gain: 0.09 },
      { frequency: 659, duration: 0.09, gain: 0.1, gap: 0.02 },
      { frequency: 784, duration: 0.14, gain: 0.11, gap: 0.02 }
    ]);
    return;
  }

  if (kind === "level_up") {
    playToneSequence([
      { frequency: 392, duration: 0.1, gain: 0.1 },
      { frequency: 523, duration: 0.1, gain: 0.1, gap: 0.02 },
      { frequency: 659, duration: 0.1, gain: 0.11, gap: 0.02 },
      { frequency: 784, duration: 0.18, gain: 0.12, gap: 0.03 }
    ]);
    return;
  }

  playToneSequence([
    { frequency: 523, duration: 0.1, gain: 0.1 },
    { frequency: 659, duration: 0.1, gain: 0.11, gap: 0.02 },
    { frequency: 784, duration: 0.1, gain: 0.11, gap: 0.02 },
    { frequency: 1047, duration: 0.22, gain: 0.12, gap: 0.03 }
  ]);
}

export function dispatchAvatarReaction(kind: SuccessMomentKind, signal?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ kind: SuccessMomentKind; signal: string }>(avatarReactionEvent, {
      detail: { kind, signal: signal ?? `${kind}-${Date.now()}` }
    })
  );
}

/** Sound + avatar reaction for a kid-facing success beat. */
export function dispatchSuccessMoment(kind: SuccessMomentKind, signal?: string) {
  const id = signal ?? `${kind}-${Date.now()}`;
  dispatchAvatarReaction(kind, id);
  playSuccessSound(kind);
}
