-- Portal staff can read itineraries/staff/payments for assigned trips

CREATE OR REPLACE FUNCTION public.portal_assigned_itinerary(p_itinerary_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.itinerary_staff s
    LEFT JOIN public.guides g ON g.id = s.guide_id
    LEFT JOIN public.drivers d ON d.id = s.driver_id
    WHERE s.itinerary_id = p_itinerary_id
      AND (
        g.portal_user_id = auth.uid()
        OR d.portal_user_id = auth.uid()
      )
  );
$$;

DROP POLICY IF EXISTS itineraries_portal_assigned ON public.itineraries;
CREATE POLICY itineraries_portal_assigned ON public.itineraries
  FOR SELECT USING (public.portal_assigned_itinerary(id));

DROP POLICY IF EXISTS itinerary_staff_portal_assigned ON public.itinerary_staff;
CREATE POLICY itinerary_staff_portal_assigned ON public.itinerary_staff
  FOR SELECT USING (public.portal_assigned_itinerary(itinerary_id));

DROP POLICY IF EXISTS payments_portal_assigned ON public.payments;
CREATE POLICY payments_portal_assigned ON public.payments
  FOR SELECT USING (public.portal_assigned_itinerary(itinerary_id));

DROP POLICY IF EXISTS itinerary_stays_portal_assigned ON public.itinerary_stays;
CREATE POLICY itinerary_stays_portal_assigned ON public.itinerary_stays
  FOR SELECT USING (public.portal_assigned_itinerary(itinerary_id));
