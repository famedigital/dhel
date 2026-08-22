-- Dhel Phase 2: master catalog, CMS, billing, B2C, trip ops extensions
-- Requires Phase 1 base tables: agencies, memberships, itineraries, hotels

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT lower(u.email) INTO user_email
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF user_email IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role = 'platform_admin'
  ) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.platform_config pc
    WHERE pc.key = 'platform_admin_email'
      AND lower(pc.value) = user_email
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_agency_member(p_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.agency_id = p_agency_id
  );
$$;

CREATE TABLE IF NOT EXISTS public.platform_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.platform_config IS
  'Platform settings. Set platform_admin_email to match PLATFORM_ADMIN_EMAIL env for RLS.';

-- ---------------------------------------------------------------------------
-- Agency settings & markup
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.agency_settings (
  agency_id uuid PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
  markup_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  plan text NOT NULL DEFAULT 'pilot',
  plan_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Master catalog (platform_admin write, authenticated read)
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
  meal text,
  currency text NOT NULL DEFAULT 'USD',
  valid_from date,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (catalog_hotel_id, room_type)
);

CREATE TABLE IF NOT EXISTS public.catalog_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  languages text,
  license_no text,
  day_rate_usd numeric(12, 2),
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  vehicle_type text,
  plate text,
  day_rate_usd numeric(12, 2),
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agency_hotel_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  catalog_hotel_id uuid REFERENCES public.catalog_hotels(id) ON DELETE SET NULL,
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE SET NULL,
  room_type text NOT NULL,
  net_usd numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_hotel_rates_agency
  ON public.agency_hotel_rates (agency_id);

CREATE TABLE IF NOT EXISTS public.library_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  filename text NOT NULL,
  entity_type text NOT NULL,
  row_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Trip ops extensions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trip_travelers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  name text NOT NULL,
  nationality text,
  id_type text,
  id_number text,
  sdf_amount numeric(12, 2),
  sdf_paid boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_travelers_itinerary
  ON public.trip_travelers (itinerary_id);

CREATE TABLE IF NOT EXISTS public.trip_flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  direction text,
  pnr text,
  airline text,
  flight_number text,
  route_from text,
  route_to text,
  depart_at timestamptz,
  arrive_at timestamptz,
  cost numeric(12, 2),
  currency text NOT NULL DEFAULT 'USD',
  paid_by text,
  status text NOT NULL DEFAULT 'planned',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_flights_itinerary
  ON public.trip_flights (itinerary_id);

-- ---------------------------------------------------------------------------
-- Platform CMS, billing, B2C
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.platform_cms_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  locale text NOT NULL DEFAULT 'en',
  block_type text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  version text,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, locale, block_type, status)
);

CREATE TABLE IF NOT EXISTS public.billing_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  plan text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'BTN',
  screenshot_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  plan_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_submissions_status
  ON public.billing_submissions (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.b2c_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL,
  email text,
  phone text,
  country text,
  brief text,
  source text NOT NULL DEFAULT 'build',
  status text NOT NULL DEFAULT 'new',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2c_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  country text,
  whatsapp boolean NOT NULL DEFAULT false,
  accepted_terms_version text,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Phase 4 stub — agency white-label sites
CREATE TABLE IF NOT EXISTS public.agency_site_settings (
  agency_id uuid PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
  slug text UNIQUE,
  custom_domain text,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_title text,
  seo_description text,
  og_image_url text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_room_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_hotel_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_cms_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2c_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2c_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_site_settings ENABLE ROW LEVEL SECURITY;

-- platform_config: platform_admin only
DROP POLICY IF EXISTS platform_config_admin_all ON public.platform_config;
CREATE POLICY platform_config_admin_all ON public.platform_config
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- agency_settings: members read/write own agency; platform_admin all
DROP POLICY IF EXISTS agency_settings_member_select ON public.agency_settings;
CREATE POLICY agency_settings_member_select ON public.agency_settings
  FOR SELECT
  USING (public.is_agency_member(agency_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS agency_settings_member_write ON public.agency_settings;
CREATE POLICY agency_settings_member_write ON public.agency_settings
  FOR ALL
  USING (public.is_agency_member(agency_id) OR public.is_platform_admin())
  WITH CHECK (public.is_agency_member(agency_id) OR public.is_platform_admin());

-- Master catalog: authenticated read; platform_admin write
DROP POLICY IF EXISTS catalog_hotels_read ON public.catalog_hotels;
CREATE POLICY catalog_hotels_read ON public.catalog_hotels
  FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_platform_admin());

DROP POLICY IF EXISTS catalog_hotels_admin_write ON public.catalog_hotels;
CREATE POLICY catalog_hotels_admin_write ON public.catalog_hotels
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS catalog_room_rates_read ON public.catalog_room_rates;
CREATE POLICY catalog_room_rates_read ON public.catalog_room_rates
  FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_platform_admin());

DROP POLICY IF EXISTS catalog_room_rates_admin_write ON public.catalog_room_rates;
CREATE POLICY catalog_room_rates_admin_write ON public.catalog_room_rates
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS catalog_guides_read ON public.catalog_guides;
CREATE POLICY catalog_guides_read ON public.catalog_guides
  FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_platform_admin());

DROP POLICY IF EXISTS catalog_guides_admin_write ON public.catalog_guides;
CREATE POLICY catalog_guides_admin_write ON public.catalog_guides
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS catalog_drivers_read ON public.catalog_drivers;
CREATE POLICY catalog_drivers_read ON public.catalog_drivers
  FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_platform_admin());

DROP POLICY IF EXISTS catalog_drivers_admin_write ON public.catalog_drivers;
CREATE POLICY catalog_drivers_admin_write ON public.catalog_drivers
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- agency_hotel_rates: agency members own rows; platform_admin all
DROP POLICY IF EXISTS agency_hotel_rates_member ON public.agency_hotel_rates;
CREATE POLICY agency_hotel_rates_member ON public.agency_hotel_rates
  FOR ALL
  USING (public.is_agency_member(agency_id) OR public.is_platform_admin())
  WITH CHECK (public.is_agency_member(agency_id) OR public.is_platform_admin());

-- library_imports: platform_admin only
DROP POLICY IF EXISTS library_imports_admin ON public.library_imports;
CREATE POLICY library_imports_admin ON public.library_imports
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- trip_travelers / trip_flights: agency members on own agency
DROP POLICY IF EXISTS trip_travelers_member ON public.trip_travelers;
CREATE POLICY trip_travelers_member ON public.trip_travelers
  FOR ALL
  USING (public.is_agency_member(agency_id) OR public.is_platform_admin())
  WITH CHECK (public.is_agency_member(agency_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS trip_flights_member ON public.trip_flights;
CREATE POLICY trip_flights_member ON public.trip_flights
  FOR ALL
  USING (public.is_agency_member(agency_id) OR public.is_platform_admin())
  WITH CHECK (public.is_agency_member(agency_id) OR public.is_platform_admin());

-- platform_cms_blocks: public read live; platform_admin write
DROP POLICY IF EXISTS platform_cms_blocks_public_read ON public.platform_cms_blocks;
CREATE POLICY platform_cms_blocks_public_read ON public.platform_cms_blocks
  FOR SELECT
  USING (status = 'live' OR public.is_platform_admin());

DROP POLICY IF EXISTS platform_cms_blocks_admin_write ON public.platform_cms_blocks;
CREATE POLICY platform_cms_blocks_admin_write ON public.platform_cms_blocks
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- billing_submissions: agency insert/read own; platform_admin all
DROP POLICY IF EXISTS billing_submissions_agency ON public.billing_submissions;
CREATE POLICY billing_submissions_agency ON public.billing_submissions
  FOR SELECT
  USING (public.is_agency_member(agency_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS billing_submissions_agency_insert ON public.billing_submissions;
CREATE POLICY billing_submissions_agency_insert ON public.billing_submissions
  FOR INSERT
  WITH CHECK (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS billing_submissions_admin_update ON public.billing_submissions;
CREATE POLICY billing_submissions_admin_update ON public.billing_submissions
  FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- b2c_leads: platform_admin all; assigned agency read assigned
DROP POLICY IF EXISTS b2c_leads_admin ON public.b2c_leads;
CREATE POLICY b2c_leads_admin ON public.b2c_leads
  FOR ALL
  USING (
    public.is_platform_admin()
    OR (assigned_agency_id IS NOT NULL AND public.is_agency_member(assigned_agency_id))
  )
  WITH CHECK (public.is_platform_admin());

-- b2c_profiles: own row; platform_admin read all
DROP POLICY IF EXISTS b2c_profiles_self ON public.b2c_profiles;
CREATE POLICY b2c_profiles_self ON public.b2c_profiles
  FOR ALL
  USING (auth.uid() = user_id OR public.is_platform_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

-- agency_site_settings: agency owner read/write own; platform_admin all
DROP POLICY IF EXISTS agency_site_settings_member ON public.agency_site_settings;
CREATE POLICY agency_site_settings_member ON public.agency_site_settings
  FOR ALL
  USING (public.is_agency_member(agency_id) OR public.is_platform_admin())
  WITH CHECK (public.is_agency_member(agency_id) OR public.is_platform_admin());
