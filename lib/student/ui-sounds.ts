"use client";

export const BUTTON_SOUND_STORAGE_KEY = "skulkid:button-sound";
export const BUTTON_SOUND_CHANGE_EVENT = "skulkid:button-sound-change";

type AudioContextWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

let sharedContext: AudioContext | null = null;
let lastClickAt = 0;

export function isButtonSoundEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(BUTTON_SOUND_STORAGE_KEY) !== "off";
}

export function setButtonSoundEnabled(enabled: boolean) {
  window.localStorage.setItem(BUTTON_SOUND_STORAGE_KEY, enabled ? "on" : "off");
  window.dispatchEvent(new CustomEvent(BUTTON_SOUND_CHANGE_EVENT, { detail: { enabled } }));
}

function getAudioContext() {
  const AudioContextConstructor =
    window.AudioContext || (window as AudioContextWindow).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  sharedContext = sharedContext || new AudioContextConstructor();
  return sharedContext;
}

/** Short, friendly tap blip for button / control presses. */
export function playButtonClickSound() {
  try {
    const now = performance.now();
    if (now - lastClickAt < 45) return;
    lastClickAt = now;

    const context = getAudioContext();
    if (!context) return;

    void context.resume().then(() => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startsAt = context.currentTime;

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(980, startsAt);
      oscillator.frequency.exponentialRampToValueAtTime(620, startsAt + 0.07);
      gain.gain.setValueAtTime(0.0001, startsAt);
      gain.gain.exponentialRampToValueAtTime(0.09, startsAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.09);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + 0.1);
    });
  } catch {
    // Browsers may block audio until a gesture; UI stays usable without sound.
  }
}

function isInteractiveControl(element: Element) {
  if (element.closest("[data-no-click-sound]")) return null;
  return element.closest(
    "button, a[href], [role='button'], summary, input[type='button'], input[type='submit'], input[type='checkbox'], input[type='radio'], label[for]"
  );
}

function isControlDisabled(control: Element) {
  if (control.hasAttribute("disabled") || control.getAttribute("aria-disabled") === "true") return true;
  if (control instanceof HTMLInputElement && control.disabled) return true;
  if (control instanceof HTMLButtonElement && control.disabled) return true;
  if (control instanceof HTMLAnchorElement && control.getAttribute("aria-disabled") === "true") return true;
  return false;
}

/** Capture-phase listener so taps feel instant across the student UI. */
export function installButtonClickSounds(getEnabled: () => boolean) {
  function onPointerDown(event: PointerEvent) {
    if (!getEnabled()) return;
    if (event.button !== 0) return;
    if (event.pointerType === "mouse" && event.detail > 1) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const control = isInteractiveControl(target);
    if (!control || isControlDisabled(control)) return;
    playButtonClickSound();
  }

  document.addEventListener("pointerdown", onPointerDown, true);
  return () => document.removeEventListener("pointerdown", onPointerDown, true);
}
