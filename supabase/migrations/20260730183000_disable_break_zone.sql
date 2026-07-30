-- Temporarily disable the student-facing Break Zone feature.
UPDATE public."BreakZoneConfig"
SET "enabled" = false,
    "updatedAt" = now()
WHERE "id" = true;
