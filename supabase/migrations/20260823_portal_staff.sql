-- Guide/driver portal fields + trip ops logs

ALTER TABLE public.guides
  ADD COLUMN IF NOT EXISTS portal_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS bio_draft text,
  ADD COLUMN IF NOT EXISTS bank text,
  ADD COLUMN IF NOT EXISTS account_no text,
  ADD COLUMN IF NOT EXISTS payee_name text,
  ADD COLUMN IF NOT EXISTS emv_static text,
  ADD COLUMN IF NOT EXISTS portal_email text;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS portal_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS bio_draft text,
  ADD COLUMN IF NOT EXISTS bank text,
  ADD COLUMN IF NOT EXISTS account_no text,
  ADD COLUMN IF NOT EXISTS payee_name text,
  ADD COLUMN IF NOT EXISTS emv_static text,
  ADD COLUMN IF NOT EXISTS vehicle_photos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS portal_email text;

CREATE TABLE IF NOT EXISTS public.trip_ops_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  day_number integer,
  category text NOT NULL,
  amount_nu numeric(12, 2),
  note text,
  photo_urls text[] NOT NULL DEFAULT '{}',
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('guide', 'driver')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_ops_logs_itinerary_idx ON public.trip_ops_logs (itinerary_id, created_at DESC);
CREATE INDEX IF NOT EXISTS guides_portal_user_idx ON public.guides (portal_user_id);
CREATE INDEX IF NOT EXISTS drivers_portal_user_idx ON public.drivers (portal_user_id);

ALTER TABLE public.trip_ops_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trip_ops_logs_select ON public.trip_ops_logs;
CREATE POLICY trip_ops_logs_select ON public.trip_ops_logs
  FOR SELECT USING (
    public.is_platform_admin()
    OR public.is_agency_member(agency_id)
    OR submitted_by = auth.uid()
  );

DROP POLICY IF EXISTS trip_ops_logs_insert ON public.trip_ops_logs;
CREATE POLICY trip_ops_logs_insert ON public.trip_ops_logs
  FOR INSERT WITH CHECK (
    public.is_platform_admin()
    OR submitted_by = auth.uid()
  );

DROP POLICY IF EXISTS trip_ops_logs_update ON public.trip_ops_logs;
CREATE POLICY trip_ops_logs_update ON public.trip_ops_logs
  FOR UPDATE USING (
    public.is_platform_admin()
    OR submitted_by = auth.uid()
  );

DROP POLICY IF EXISTS guides_portal_self ON public.guides;
CREATE POLICY guides_portal_self ON public.guides
  FOR ALL USING (
    public.is_platform_admin()
    OR portal_user_id = auth.uid()
    OR public.is_agency_member(agency_id)
  )
  WITH CHECK (
    public.is_platform_admin()
    OR portal_user_id = auth.uid()
    OR public.is_agency_member(agency_id)
  );

DROP POLICY IF EXISTS drivers_portal_self ON public.drivers;
CREATE POLICY drivers_portal_self ON public.drivers
  FOR ALL USING (
    public.is_platform_admin()
    OR portal_user_id = auth.uid()
    OR public.is_agency_member(agency_id)
  )
  WITH CHECK (
    public.is_platform_admin()
    OR portal_user_id = auth.uid()
    OR public.is_agency_member(agency_id)
  );
