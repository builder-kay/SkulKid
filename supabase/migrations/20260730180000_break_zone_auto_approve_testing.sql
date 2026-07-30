-- Testing-only mode: automatically approve all Break Zone videos.
-- Set this to false before allowing unsupervised production use.
ALTER TABLE public."BreakZoneConfig"
  ADD COLUMN IF NOT EXISTS "autoApproveAll" boolean NOT NULL DEFAULT true;

UPDATE public."BreakZoneConfig"
SET "autoApproveAll" = true,
    "updatedAt" = now()
WHERE "id" = true;

UPDATE public."BreakZoneVideo"
SET "metadataStatus" = 'approved',
    "moderationStatus" = 'approved',
    "severity" = 'none',
    "categories" = '{}',
    "summary" = 'Automatically approved while Break Zone testing mode is enabled.',
    "lastCheckedAt" = now(),
    "nextReviewAt" = NULL,
    "updatedAt" = now();
