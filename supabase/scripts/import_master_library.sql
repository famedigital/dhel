-- =============================================================================
-- Dhel — Master library import (paste in Supabase SQL Editor)
-- Project: npqxvxvwjanpjlpggddx (or your Dhel project)
--
-- HOW TO USE
-- 1. Run STEP 1 once (creates catalog + staging tables).
-- 2. Export CSV from your OTHER project: hotels, room rates, guides, activities.
-- 3. Either:
--    A) Paste INSERT rows into staging tables (STEP 2 examples), OR
--    B) Supabase Table Editor → import CSV into staging_* tables, OR
--    C) If old tables live in THIS database, edit STEP 3 column mapping.
-- 4. Run STEP 4 to merge staging → catalog_*.
-- 5. Run STEP 5 to verify counts.
--
-- Paste as platform admin / postgres role in SQL Editor (bypasses RLS).
-- Prerequisite: run supabase/migrations/20260822_dhel_phase2.sql once (creates is_platform_admin).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.platform_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- STEP 1 — Ensure catalog tables (+ activities) exist
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.catalog_hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  pelbu_property_id text,
  source text NOT NULL DEFAULT 'catalog',
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, city)
);

CREATE TABLE IF NOT EXISTS public.catalog_room_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_hotel_id uuid NOT NULL REFERENCES public.catalog_hotels(id) ON DELETE CASCADE,
  room_type text NOT NULL,
  net_usd numeric(12, 2) NOT NULL,
  net_inr numeric(12, 2),
  meal text,
  currency text NOT NULL DEFAULT 'USD',
  valid_from date,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (catalog_hotel_id, room_type)
);

ALTER TABLE public.catalog_room_rates
  ADD COLUMN IF NOT EXISTS net_inr numeric(12, 2);

CREATE TABLE IF NOT EXISTS public.catalog_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  languages text,
  license_no text,
  day_rate_usd numeric(12, 2),
  day_rate_inr numeric(12, 2),
  active boolean NOT NULL DEFAULT true,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_guides
  ADD COLUMN IF NOT EXISTS day_rate_inr numeric(12, 2),
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.catalog_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  vehicle_type text,
  plate text,
  day_rate_usd numeric(12, 2),
  day_rate_inr numeric(12, 2),
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_drivers
  ADD COLUMN IF NOT EXISTS day_rate_inr numeric(12, 2);

CREATE TABLE IF NOT EXISTS public.catalog_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  name text NOT NULL,
  dzongkhag text,
  net_usd numeric(12, 2),
  net_inr numeric(12, 2),
  currency text NOT NULL DEFAULT 'USD',
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Staging tables (safe to truncate & reload)
CREATE TABLE IF NOT EXISTS public.staging_hotels (
  name text NOT NULL,
  city text,
  star_rating integer,
  pelbu_property_id text,
  source text DEFAULT 'catalog',
  notes text
);

CREATE TABLE IF NOT EXISTS public.staging_room_rates (
  hotel_name text NOT NULL,
  hotel_city text,
  room_type text NOT NULL,
  net_usd numeric(12, 2),
  net_inr numeric(12, 2),
  meal text,
  currency text DEFAULT 'USD'
);

CREATE TABLE IF NOT EXISTS public.staging_guides (
  name text NOT NULL,
  phone text,
  languages text,
  license_no text,
  day_rate_usd numeric(12, 2),
  day_rate_inr numeric(12, 2),
  notes text
);

CREATE TABLE IF NOT EXISTS public.staging_activities (
  slug text,
  name text NOT NULL,
  dzongkhag text,
  net_usd numeric(12, 2),
  net_inr numeric(12, 2),
  currency text DEFAULT 'USD',
  notes text
);

-- RLS (skip if is_platform_admin() not created yet — run phase2 migration first)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_platform_admin'
  ) THEN
    ALTER TABLE public.catalog_activities ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS catalog_activities_read ON public.catalog_activities;
    CREATE POLICY catalog_activities_read ON public.catalog_activities
      FOR SELECT USING (auth.role() = 'authenticated' OR public.is_platform_admin());
    DROP POLICY IF EXISTS catalog_activities_admin_write ON public.catalog_activities;
    CREATE POLICY catalog_activities_admin_write ON public.catalog_activities
      FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
  END IF;
END $$;

-- Staging: no RLS (SQL Editor only — do not expose via API)
ALTER TABLE public.staging_hotels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_room_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_guides DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_activities DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- STEP 2 — Load YOUR data into staging (edit / duplicate rows)
-- Export from old project → match these columns → paste INSERTs or CSV import
-- ---------------------------------------------------------------------------

TRUNCATE public.staging_hotels, public.staging_room_rates, public.staging_guides, public.staging_activities;

-- === HOTELS (add one INSERT per hotel from your old list) ===
INSERT INTO public.staging_hotels (name, city, star_rating, source, notes) VALUES
  ('Pelbu Suites Olakha', 'Thimphu', 3, 'pelbu', 'MAP rates in room table'),
  ('Hotel Druk', 'Thimphu', 3, 'catalog', NULL),
  ('Damchen Resort', 'Paro', 3, 'catalog', NULL),
  ('RKPO Green Resort', 'Punakha', 3, 'catalog', NULL),
  ('Densa Boutique Residency', 'Thimphu', 3, 'catalog', NULL),
  ('Terma Linca Resort & Spa', 'Paro', 5, 'catalog', 'Luxury — not 3-star FIT'),
  ('Le Meridien Paro', 'Paro', 5, 'catalog', NULL),
  ('Amankora Paro', 'Paro', 5, 'catalog', 'Luxury only');

-- === ROOM RATES ===
INSERT INTO public.staging_room_rates (hotel_name, hotel_city, room_type, net_usd, net_inr, meal, currency) VALUES
  ('Pelbu Suites Olakha', 'Thimphu', 'Deluxe Twin', 95, 7980, 'MAP', 'USD'),
  ('Pelbu Suites Olakha', 'Thimphu', 'Executive King', 120, 10080, 'MAP', 'USD'),
  ('Hotel Druk', 'Thimphu', 'Standard', 82, 6888, 'BB', 'USD'),
  ('Damchen Resort', 'Paro', 'Standard', 70, 5880, 'BB', 'USD'),
  ('RKPO Green Resort', 'Punakha', 'Standard', 75, 6300, 'MAP', 'USD'),
  ('Densa Boutique Residency', 'Thimphu', 'Deluxe', 88, 7392, 'BB', 'USD'),
  ('Densa Boutique Residency', 'Thimphu', 'Suite', 110, 9240, 'BB', 'USD');

-- === GUIDES (paste your full guide list) ===
INSERT INTO public.staging_guides (name, phone, languages, license_no, day_rate_usd, day_rate_inr, notes) VALUES
  ('Guide TBD — English', NULL, 'English', NULL, 85, 7140, 'Replace with your roster'),
  ('Guide TBD — Hindi', NULL, 'Hindi', NULL, 85, 7140, 'Indian FIT market');

-- === ACTIVITIES / MONUMENTS / ENTRIES ===
INSERT INTO public.staging_activities (slug, name, dzongkhag, net_usd, net_inr, currency, notes) VALUES
  ('tigers-nest', 'Tiger''s Nest hike', 'Paro', 15, 1260, 'USD', 'Entry / monument'),
  ('punakha-dzong', 'Punakha Dzong visit', 'Punakha', 8, 672, 'USD', NULL),
  ('thimphu-buddha', 'Buddha Dordenma', 'Thimphu', 5, 420, 'USD', NULL),
  ('dochu-la', 'Dochu La pass stop', 'Thimphu', 0, 0, 'USD', 'No entry fee');

-- ---------------------------------------------------------------------------
-- STEP 3 — OPTIONAL: copy from legacy tables IN THIS DATABASE
-- Uncomment and fix table/column names to match your other app's schema.
-- ---------------------------------------------------------------------------

/*
INSERT INTO public.staging_hotels (name, city, star_rating, source, notes)
SELECT
  h.name,                          -- was: hotel_name
  h.city,                          -- was: location / dzongkhag
  h.star_rating::integer,
  COALESCE(h.source, 'catalog'),
  h.notes
FROM public.hotels h               -- ← YOUR OLD TABLE NAME
WHERE h.active IS DISTINCT FROM false;

INSERT INTO public.staging_room_rates (hotel_name, hotel_city, room_type, net_usd, net_inr, meal, currency)
SELECT
  h.name,
  h.city,
  r.room_type,
  r.rate_usd,
  r.rate_inr,
  r.meal_plan,
  COALESCE(r.currency, 'USD')
FROM public.rooms r
JOIN public.hotels h ON h.id = r.hotel_id;

INSERT INTO public.staging_guides (name, phone, languages, license_no, day_rate_usd, day_rate_inr, notes)
SELECT
  g.name,
  g.phone,
  g.languages,
  g.license_number,
  g.day_rate_usd,
  g.day_rate_inr,
  g.notes
FROM public.guides g;

INSERT INTO public.staging_activities (slug, name, dzongkhag, net_usd, net_inr, currency, notes)
SELECT
  a.slug,
  a.name,
  a.dzongkhag,
  a.price_usd,
  a.price_inr,
  COALESCE(a.currency, 'USD'),
  a.notes
FROM public.activities a;
*/

-- ---------------------------------------------------------------------------
-- STEP 4 — Merge staging → master catalog (upsert)
-- ---------------------------------------------------------------------------

-- Hotels
INSERT INTO public.catalog_hotels (name, city, pelbu_property_id, source, active, metadata)
SELECT
  s.name,
  s.city,
  s.pelbu_property_id,
  COALESCE(s.source, 'catalog'),
  true,
  jsonb_strip_nulls(jsonb_build_object(
    'star_rating', s.star_rating,
    'notes', s.notes
  ))
FROM public.staging_hotels s
ON CONFLICT (name, city) DO UPDATE SET
  pelbu_property_id = EXCLUDED.pelbu_property_id,
  source = EXCLUDED.source,
  metadata = public.catalog_hotels.metadata || EXCLUDED.metadata,
  updated_at = now();

-- Room rates
INSERT INTO public.catalog_room_rates (
  catalog_hotel_id, room_type, net_usd, net_inr, meal, currency
)
SELECT
  h.id,
  r.room_type,
  COALESCE(r.net_usd, CASE WHEN r.net_inr IS NOT NULL THEN round(r.net_inr / 84.0, 2) ELSE 0 END),
  r.net_inr,
  r.meal,
  COALESCE(r.currency, 'USD')
FROM public.staging_room_rates r
JOIN public.catalog_hotels h
  ON h.name = r.hotel_name
 AND (h.city IS NOT DISTINCT FROM r.hotel_city)
ON CONFLICT (catalog_hotel_id, room_type) DO UPDATE SET
  net_usd = EXCLUDED.net_usd,
  net_inr = EXCLUDED.net_inr,
  meal = EXCLUDED.meal,
  currency = EXCLUDED.currency,
  updated_at = now();

-- Guides (match by name — edit if you use license_no as unique key)
INSERT INTO public.catalog_guides (name, phone, languages, license_no, day_rate_usd, day_rate_inr, active, notes)
SELECT
  s.name,
  s.phone,
  s.languages,
  s.license_no,
  s.day_rate_usd,
  s.day_rate_inr,
  true,
  s.notes
FROM public.staging_guides s
WHERE NOT EXISTS (
  SELECT 1 FROM public.catalog_guides g
  WHERE g.name = s.name
    AND (g.license_no IS NOT DISTINCT FROM s.license_no)
);

-- Activities
INSERT INTO public.catalog_activities (slug, name, dzongkhag, net_usd, net_inr, currency, active, metadata)
SELECT
  COALESCE(NULLIF(trim(s.slug), ''), lower(regexp_replace(s.name, '[^a-zA-Z0-9]+', '-', 'g'))),
  s.name,
  s.dzongkhag,
  s.net_usd,
  s.net_inr,
  COALESCE(s.currency, 'USD'),
  true,
  jsonb_strip_nulls(jsonb_build_object('notes', s.notes))
FROM public.staging_activities s
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  dzongkhag = EXCLUDED.dzongkhag,
  net_usd = EXCLUDED.net_usd,
  net_inr = EXCLUDED.net_inr,
  currency = EXCLUDED.currency,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- Platform land rates (guide/car/SDF) — store in platform_config for pricing engine hook
INSERT INTO public.platform_config (key, value) VALUES
  ('guide_day_rate_usd', '85'),
  ('car_day_rate_usd', '235'),
  ('pickup_bagdogra_usd', '95'),
  ('drop_bagdogra_usd', '95'),
  ('fx_usd_inr', '84'),
  ('sdf_indian_daily_usd', '15'),
  ('sdf_international_daily_usd', '100')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ---------------------------------------------------------------------------
-- STEP 5 — Verify
-- ---------------------------------------------------------------------------

SELECT 'catalog_hotels' AS entity, count(*) AS rows FROM public.catalog_hotels
UNION ALL SELECT 'catalog_room_rates', count(*) FROM public.catalog_room_rates
UNION ALL SELECT 'catalog_guides', count(*) FROM public.catalog_guides
UNION ALL SELECT 'catalog_activities', count(*) FROM public.catalog_activities
ORDER BY 1;

-- Sample join: hotels with rates
SELECT
  h.name,
  h.city,
  h.metadata->>'star_rating' AS star_rating,
  r.room_type,
  r.meal,
  r.net_usd,
  r.net_inr,
  r.currency
FROM public.catalog_hotels h
LEFT JOIN public.catalog_room_rates r ON r.catalog_hotel_id = h.id
WHERE h.active
ORDER BY h.city, h.name, r.room_type;

-- ---------------------------------------------------------------------------
-- CLEANUP (optional — after you confirm import)
-- ---------------------------------------------------------------------------
-- TRUNCATE public.staging_hotels, public.staging_room_rates, public.staging_guides, public.staging_activities;
