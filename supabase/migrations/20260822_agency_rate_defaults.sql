-- Agency commercial defaults (guide / vehicle / room categories) + brand asset bucket

ALTER TABLE public.agency_settings
  ADD COLUMN IF NOT EXISTS rate_defaults jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Public brand assets (letter photo, logo)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS brand_assets_public_read ON storage.objects;
CREATE POLICY brand_assets_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS brand_assets_agency_upload ON storage.objects;
CREATE POLICY brand_assets_agency_upload ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'brand-assets'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT agency_id::text FROM public.memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS brand_assets_agency_update ON storage.objects;
CREATE POLICY brand_assets_agency_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'brand-assets'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT agency_id::text FROM public.memberships WHERE user_id = auth.uid()
    )
  );
