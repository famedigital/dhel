-- Catalog library: every authenticated agent can read; platform admin writes.
-- Also restores is_platform_admin() if missing and pins Silverpine owner email.

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
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid() AND m.role = 'platform_admin'
  ) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.platform_config pc
    WHERE pc.key = 'platform_admin_email'
      AND lower(pc.value) = user_email
  ) THEN
    RETURN true;
  END IF;

  IF user_email = 'bhutansilverpine@gmail.com' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE TABLE IF NOT EXISTS public.platform_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_config (key, value)
VALUES ('platform_admin_email', 'bhutansilverpine@gmail.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

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

ALTER TABLE public.catalog_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_room_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalog_hotels_read ON public.catalog_hotels;
CREATE POLICY catalog_hotels_read ON public.catalog_hotels
  FOR SELECT USING (auth.role() = 'authenticated' OR public.is_platform_admin());

DROP POLICY IF EXISTS catalog_hotels_admin_write ON public.catalog_hotels;
CREATE POLICY catalog_hotels_admin_write ON public.catalog_hotels
  FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS catalog_room_rates_read ON public.catalog_room_rates;
CREATE POLICY catalog_room_rates_read ON public.catalog_room_rates
  FOR SELECT USING (auth.role() = 'authenticated' OR public.is_platform_admin());

DROP POLICY IF EXISTS catalog_room_rates_admin_write ON public.catalog_room_rates;
CREATE POLICY catalog_room_rates_admin_write ON public.catalog_room_rates
  FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS catalog_guides_read ON public.catalog_guides;
CREATE POLICY catalog_guides_read ON public.catalog_guides
  FOR SELECT USING (auth.role() = 'authenticated' OR public.is_platform_admin());

DROP POLICY IF EXISTS catalog_guides_admin_write ON public.catalog_guides;
CREATE POLICY catalog_guides_admin_write ON public.catalog_guides
  FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS catalog_activities_read ON public.catalog_activities;
CREATE POLICY catalog_activities_read ON public.catalog_activities
  FOR SELECT USING (auth.role() = 'authenticated' OR public.is_platform_admin());

DROP POLICY IF EXISTS catalog_activities_admin_write ON public.catalog_activities;
CREATE POLICY catalog_activities_admin_write ON public.catalog_activities
  FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

GRANT SELECT ON public.catalog_hotels, public.catalog_room_rates, public.catalog_guides, public.catalog_activities TO authenticated;
