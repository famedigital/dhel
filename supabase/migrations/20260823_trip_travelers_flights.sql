-- Trip travelers (guest list / SDF) and flights
CREATE TABLE IF NOT EXISTS public.trip_travelers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  name text NOT NULL,
  nationality text,
  id_type text,
  id_number text,
  sdf_category text NOT NULL DEFAULT 'other',
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

ALTER TABLE public.trip_travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_flights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trip_travelers_member ON public.trip_travelers;
CREATE POLICY trip_travelers_member ON public.trip_travelers
  FOR ALL
  USING (public.is_agency_member(agency_id))
  WITH CHECK (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS trip_flights_member ON public.trip_flights;
CREATE POLICY trip_flights_member ON public.trip_flights
  FOR ALL
  USING (public.is_agency_member(agency_id))
  WITH CHECK (public.is_agency_member(agency_id));
