-- Optional: portal staff SELECT on hotels/rooms for their agency roster.
-- Prefer server loads via service role; apply only if portal field pack uses user RLS.

DROP POLICY IF EXISTS hotels_portal_roster ON public.hotels;
CREATE POLICY hotels_portal_roster ON public.hotels
  FOR SELECT USING (
    public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM public.guides g WHERE g.portal_user_id = auth.uid() AND g.agency_id = hotels.agency_id)
    OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.portal_user_id = auth.uid() AND d.agency_id = hotels.agency_id)
  );

DROP POLICY IF EXISTS rooms_portal_roster ON public.rooms;
CREATE POLICY rooms_portal_roster ON public.rooms
  FOR SELECT USING (
    public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM public.guides g WHERE g.portal_user_id = auth.uid() AND g.agency_id = rooms.agency_id)
    OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.portal_user_id = auth.uid() AND d.agency_id = rooms.agency_id)
  );
