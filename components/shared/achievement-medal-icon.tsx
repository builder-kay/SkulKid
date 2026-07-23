"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Realistic gold medal badge for achievements / rewards UI. */
export function AchievementMedalIcon({ className, title }: { className?: string; title?: string }) {
  const uid = useId().replace(/:/g, "");
  const gold = `${uid}-gold`;
  const rim = `${uid}-rim`;
  const ribbonLeft = `${uid}-ribbon-l`;
  const ribbonRight = `${uid}-ribbon-r`;
  const shine = `${uid}-shine`;

  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0", className)}
      fill="none"
      role={title ? "img" : undefined}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gold} x1="14" x2="34" y1="16" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset=".35" stopColor="#F59E0B" />
          <stop offset=".72" stopColor="#D97706" />
          <stop offset="1" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id={rim} x1="16" x2="32" y1="18" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF7ED" />
          <stop offset=".45" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={ribbonLeft} x1="14" x2="22" y1="2" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={ribbonRight} x1="26" x2="34" y1="2" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F87171" />
          <stop offset="1" stopColor="#B91C1C" />
        </linearGradient>
        <radialGradient id={shine} cx="0" cy="0" r="1" gradientTransform="translate(20 24) rotate(45) scale(14)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path d="M18.5 16.5 14 4.5c-.4-1.1.4-2.1 1.5-1.9l7.2 1.4-1.6 12.5z" fill={`url(#${ribbonLeft})`} />
      <path d="M29.5 16.5 34 4.5c.4-1.1-.4-2.1-1.5-1.9l-7.2 1.4 1.6 12.5z" fill={`url(#${ribbonRight})`} />
      <path d="M16.2 6.2 22.8 7.4" opacity=".35" stroke="#fff" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M31.8 6.2 25.2 7.4" opacity=".3" stroke="#fff" strokeLinecap="round" strokeWidth="1.2" />

      <circle cx="24" cy="30" fill={`url(#${gold})`} r="13.5" />
      <circle cx="24" cy="30" fill="none" r="13.5" stroke="#78350F" strokeOpacity=".35" strokeWidth="1.2" />
      <circle cx="24" cy="30" fill="none" r="10.8" stroke={`url(#${rim})`} strokeWidth="2.4" />
      <circle cx="24" cy="30" fill={`url(#${shine})`} r="13.5" />

      <path
        d="M24 21.2l1.9 3.9 4.3.6-3.1 3 0.7 4.3L24 30.8l-3.8 2.2.7-4.3-3.1-3 4.3-.6z"
        fill="#FEF3C7"
        stroke="#92400E"
        strokeLinejoin="round"
        strokeOpacity=".45"
        strokeWidth=".8"
      />
      <path d="M20 22.5c2.2-2.4 5.8-2.4 8 0" fill="none" opacity=".45" stroke="#fff" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

