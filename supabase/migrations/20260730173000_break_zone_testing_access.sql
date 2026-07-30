-- Allow unrestricted Break Zone access during supervised testing.
-- Administrators can enable schedule enforcement from the Break Zone configuration later.
ALTER TABLE public."BreakZoneConfig"
  ADD COLUMN IF NOT EXISTS "enforceSchedules" boolean NOT NULL DEFAULT false;

UPDATE public."BreakZoneConfig"
SET "enforceSchedules" = false,
    "updatedAt" = now()
WHERE "id" = true;
