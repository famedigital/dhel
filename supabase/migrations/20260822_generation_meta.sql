-- Persist desk chat, AI prompts, and generation audit on itineraries
ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS generation_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.itineraries.generation_meta IS
  'Desk chat thread, AI prompts, reference file, package snapshot, warnings';
