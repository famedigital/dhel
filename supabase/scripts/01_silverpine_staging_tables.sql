-- =============================================================================
-- Silverpine library → Dhel catalog (STEP 1 of 3)
-- Run in Supabase SQL Editor on project npqxvxvwjanpjlpggddx
-- Prerequisite: 20260822_dhel_phase2.sql applied
-- =============================================================================

-- Dhel catalog targets (ensure exist)
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

ALTER TABLE public.catalog_room_rates ADD COLUMN IF NOT EXISTS net_inr numeric(12, 2);

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

-- Source staging (matches Silverpine library_* export schema)
DROP TABLE IF EXISTS public.library_hotels CASCADE;
CREATE TABLE public.library_hotels (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  location text,
  category text,
  star_rating integer,
  cost_per_room_inr numeric(12, 2),
  cost_per_room_usd numeric(12, 2),
  room_type text,
  max_occupancy integer,
  extra_bed_cost_inr numeric(12, 2),
  breakfast_included boolean,
  lunch_available boolean,
  dinner_available boolean,
  meal_plan text,
  image_url text,
  images jsonb,
  brochure_url text,
  address text,
  city text,
  altitude text,
  check_in_time time,
  check_out_time time,
  amenities jsonb,
  room_heating boolean,
  hot_water boolean,
  phone text,
  email text,
  website text,
  is_active boolean DEFAULT true,
  created_at timestamptz,
  updated_at timestamptz,
  created_by text,
  is_universal boolean,
  whatsapp text,
  contact_person text,
  contact_notes text,
  last_contacted timestamptz,
  tags jsonb,
  is_favorite boolean,
  owner_id uuid
);

DROP TABLE IF EXISTS public.library_guides CASCADE;
CREATE TABLE public.library_guides (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  languages text[],
  guide_type text,
  license_no text,
  certified_since date,
  certification_level text,
  cost_per_day_inr numeric(12, 2),
  cost_per_day_usd numeric(12, 2),
  specializations jsonb,
  city text,
  phone text,
  photo_url text,
  rating numeric(4, 2),
  total_trips integer,
  is_active boolean DEFAULT true,
  created_at timestamptz,
  created_by text,
  is_universal boolean,
  guide_name text,
  whatsapp text,
  email text,
  last_contacted timestamptz,
  tags jsonb,
  is_favorite boolean,
  owner_id uuid
);

DROP TABLE IF EXISTS public.library_activities CASCADE;
CREATE TABLE public.library_activities (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  location text,
  category text,
  subcategory text,
  duration_hours numeric(6, 2),
  duration_text text,
  best_time_of_day text,
  cost_usd numeric(12, 2),
  cost_inr numeric(12, 2),
  included_in_package boolean,
  difficulty text,
  min_age integer,
  max_age integer,
  description text,
  highlights jsonb,
  included_items jsonb,
  image_url text,
  images text[],
  gallery_url text,
  latitude numeric(12, 8),
  longitude numeric(12, 8),
  altitude numeric(12, 2),
  best_season text,
  closed_months text,
  unesco_site boolean,
  dzongkhag text,
  is_active boolean DEFAULT true,
  created_at timestamptz,
  created_by text,
  is_universal boolean,
  tags jsonb,
  is_favorite boolean,
  title text,
  owner_id uuid
);

-- Legacy id map (for future itinerary references)
CREATE TABLE IF NOT EXISTS public.library_import_map (
  entity_type text NOT NULL,
  legacy_id uuid NOT NULL,
  catalog_id uuid NOT NULL,
  PRIMARY KEY (entity_type, legacy_id)
);

SELECT 'Staging tables ready — paste library_hotels_rows.sql, library_guides_rows.sql, library_activities_rows.sql next' AS status;
