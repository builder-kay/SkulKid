"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AvatarExpression } from "@/lib/student/student-profile";

export type AvatarMotionMode = "static" | "idle" | "expressive";
export type AvatarGesture = "none" | "wave";

const BLINK_MIN_MS = 3_000;
const BLINK_MAX_MS = 7_000;
const FIRST_WAVE_MIN_MS = 5_000;
const FIRST_WAVE_MAX_MS = 8_000;
const WAVE_MIN_MS = 45_000;
const WAVE_MAX_MS = 90_000;
const MOOD_MIN_MS = 14_000;
const MOOD_MAX_MS = 28_000;
const WAVE_DURATION_MS = 2_200;
const MOOD_DURATION_MS = 2_000;

function randomBetween(minimum: number, maximum: number) {
  return minimum + Math.round(Math.random() * (maximum - minimum));
}

function nextMood(baseExpression: AvatarExpression) {
  const moods: AvatarExpression[] = ["happy", "surprised", "wink"];
  const choices = moods.filter((mood) => mood !== baseExpression);
  return choices[Math.floor(Math.random() * choices.length)] ?? "happy";
}

export function useAvatarMotion(mode: AvatarMotionMode, baseExpression: AvatarExpression) {
  const elementRef = useRef<SVGSVGElement | null>(null);
  const gestureRef = useRef<AvatarGesture>("none");
  const manualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inViewport, setInViewport] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [gesture, setGesture] = useState<AvatarGesture>("none");
  const [temporaryExpression, setTemporaryExpression] = useState<AvatarExpression | null>(null);

  const setGestureState = useCallback((value: AvatarGesture) => {
    gestureRef.current = value;
    setGesture(value);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInViewport(entry?.isIntersecting ?? true), {
      rootMargin: "80px"
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [mode]);

  const active = mode !== "static" && inViewport && pageVisible && !reducedMotion;

  useEffect(() => {
    if (!active) {
      setBlinking(false);
      return;
    }
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let cancelled = false;
    const later = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!cancelled) callback();
      }, delay);
      timers.add(timer);
    };
    const schedule = () => later(blink, randomBetween(BLINK_MIN_MS, BLINK_MAX_MS));
    const blink = () => {
      setBlinking(true);
      later(() => {
        setBlinking(false);
        if (Math.random() < 0.16) {
          later(() => {
            setBlinking(true);
            later(() => {
              setBlinking(false);
              schedule();
            }, 125);
          }, 115);
        } else {
          schedule();
        }
      }, 135);
    };
    schedule();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [active]);

  useEffect(() => {
    if (!active || mode !== "expressive") return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let cancelled = false;
    let first = true;
    const later = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!cancelled) callback();
      }, delay);
      timers.add(timer);
    };
    const schedule = () => {
      const delay = first
        ? randomBetween(FIRST_WAVE_MIN_MS, FIRST_WAVE_MAX_MS)
        : randomBetween(WAVE_MIN_MS, WAVE_MAX_MS);
      first = false;
      later(() => {
        if (gestureRef.current !== "none") {
          later(schedule, 4_000);
          return;
        }
        setGestureState("wave");
        setTemporaryExpression("happy");
        later(() => {
          setGestureState("none");
          setTemporaryExpression(null);
          schedule();
        }, WAVE_DURATION_MS);
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (gestureRef.current === "wave") setGestureState("none");
    };
  }, [active, mode, setGestureState]);

  useEffect(() => {
    if (!active || mode !== "expressive") return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let cancelled = false;
    const later = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!cancelled) callback();
      }, delay);
      timers.add(timer);
    };
    const schedule = () => later(() => {
      if (gestureRef.current !== "none") {
        later(schedule, 3_000);
        return;
      }
      setTemporaryExpression(nextMood(baseExpression));
      later(() => {
        setTemporaryExpression(null);
        schedule();
      }, MOOD_DURATION_MS);
    }, randomBetween(MOOD_MIN_MS, MOOD_MAX_MS));
    schedule();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [active, baseExpression, mode]);

  useEffect(() => () => {
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
  }, []);

  const triggerWave = useCallback(() => {
    if (mode !== "expressive" || gestureRef.current !== "none") return;
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    if (reducedMotion) {
      setTemporaryExpression("happy");
      manualTimerRef.current = setTimeout(() => setTemporaryExpression(null), 650);
      return;
    }
    setGestureState("wave");
    setTemporaryExpression("happy");
    manualTimerRef.current = setTimeout(() => {
      setGestureState("none");
      setTemporaryExpression(null);
    }, WAVE_DURATION_MS);
  }, [mode, reducedMotion, setGestureState]);

  return {
    elementRef,
    blinking,
    gesture,
    expression: temporaryExpression ?? baseExpression,
    reducedMotion,
    triggerWave
  };
}
