-- Room voucher / confirmation attachment on stays
ALTER TABLE public.itinerary_stays
  ADD COLUMN IF NOT EXISTS voucher_url text;
