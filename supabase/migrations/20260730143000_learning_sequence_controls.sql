-- Teacher-controlled open or sequential learning paths.
ALTER TABLE public."Unit"
  ADD COLUMN IF NOT EXISTS "requiresPrevious" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public."Unit"."requiresPrevious"
IS 'When true, learners must complete every lesson in the previous ordered strand before this strand unlocks.';
