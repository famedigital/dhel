-- =============================================================================
-- Silverpine library → Dhel catalog (STEP 3 of 3)
-- Run AFTER pasting library_* INSERT files (STEP 2)
-- =============================================================================

BEGIN;

-- ---- Hotels + room rates ----
INSERT INTO public.catalog_hotels (name, city, source, active, metadata)
SELECT DISTINCT ON (h.name, COALESCE(NULLIF(trim(h.city), ''), NULLIF(trim(h.location), ''), 'Bhutan'))
  h.name,
  COALESCE(NULLIF(trim(h.city), ''), NULLIF(trim(h.location), ''), 'Bhutan') AS city,
  CASE
    WHEN lower(h.name) LIKE '%pelbu%' THEN 'pelbu'
    ELSE 'catalog'
  END AS source,
  COALESCE(h.is_active, true),
  jsonb_strip_nulls(jsonb_build_object(
    'legacy_id', h.id,
    'star_rating', h.star_rating,
    'category', h.category,
    'location', h.location,
    'phone', h.phone,
    'email', h.email,
    'website', h.website,
    'whatsapp', h.whatsapp,
    'image_url', h.image_url,
    'address', h.address,
    'check_in', h.check_in_time,
    'check_out', h.check_out_time,
    'max_occupancy', h.max_occupancy,
    'breakfast_included', h.breakfast_included,
    'meal_plan', h.meal_plan
  ))
FROM public.library_hotels h
WHERE h.name IS NOT NULL
ORDER BY h.name, COALESCE(NULLIF(trim(h.city), ''), NULLIF(trim(h.location), ''), 'Bhutan'), h.updated_at DESC NULLS LAST
ON CONFLICT (name, city) DO UPDATE SET
  active = EXCLUDED.active,
  source = EXCLUDED.source,
  metadata = public.catalog_hotels.metadata || EXCLUDED.metadata,
  updated_at = now();

INSERT INTO public.catalog_room_rates (
  catalog_hotel_id, room_type, net_usd, net_inr, meal, currency
)
SELECT
  ch.id,
  COALESCE(NULLIF(trim(h.room_type), ''), 'Standard') AS room_type,
  GREATEST(COALESCE(h.cost_per_room_usd, 0), 0) AS net_usd,
  NULLIF(h.cost_per_room_inr, 0) AS net_inr,
  CASE
    WHEN upper(COALESCE(h.meal_plan, '')) IN ('MAP', 'BB', 'CP', 'EP') THEN upper(h.meal_plan)
    WHEN h.breakfast_included AND (h.lunch_available OR h.dinner_available) THEN 'MAP'
    WHEN h.breakfast_included THEN 'BB'
    ELSE NULL
  END AS meal,
  CASE WHEN COALESCE(h.cost_per_room_usd, 0) > 0 THEN 'USD' ELSE 'INR' END
FROM public.library_hotels h
JOIN public.catalog_hotels ch
  ON ch.name = h.name
 AND ch.city = COALESCE(NULLIF(trim(h.city), ''), NULLIF(trim(h.location), ''), 'Bhutan')
WHERE COALESCE(h.cost_per_room_usd, h.cost_per_room_inr, 0) > 0
ON CONFLICT (catalog_hotel_id, room_type) DO UPDATE SET
  net_usd = EXCLUDED.net_usd,
  net_inr = EXCLUDED.net_inr,
  meal = COALESCE(EXCLUDED.meal, public.catalog_room_rates.meal),
  currency = EXCLUDED.currency,
  updated_at = now();

-- ---- Guides (dedupe by license_no when present, else name+phone) ----
INSERT INTO public.catalog_guides (
  name, phone, languages, license_no, day_rate_usd, day_rate_inr, active, notes, metadata
)
SELECT DISTINCT ON (
  COALESCE(NULLIF(trim(g.license_no), ''), g.name || '|' || COALESCE(g.phone, ''))
)
  COALESCE(NULLIF(trim(g.guide_name), ''), g.name) AS name,
  g.phone,
  array_to_string(g.languages, ', ') AS languages,
  NULLIF(trim(g.license_no), '') AS license_no,
  NULLIF(g.cost_per_day_usd, 0) AS day_rate_usd,
  NULLIF(g.cost_per_day_inr, 0) AS day_rate_inr,
  COALESCE(g.is_active, true),
  g.guide_type AS notes,
  jsonb_strip_nulls(jsonb_build_object(
    'legacy_id', g.id,
    'guide_type', g.guide_type,
    'city', g.city,
    'email', g.email,
    'whatsapp', g.whatsapp,
    'photo_url', g.photo_url
  ))
FROM public.library_guides g
WHERE COALESCE(NULLIF(trim(g.guide_name), ''), g.name) IS NOT NULL
ORDER BY
  COALESCE(NULLIF(trim(g.license_no), ''), g.name || '|' || COALESCE(g.phone, '')),
  g.created_at DESC NULLS LAST;

-- Remove duplicate guides without unique constraint (keep lowest id per license)
DELETE FROM public.catalog_guides cg
WHERE cg.id NOT IN (
  SELECT DISTINCT ON (COALESCE(license_no, name || '|' || COALESCE(phone, ''))) id
  FROM public.catalog_guides
  ORDER BY COALESCE(license_no, name || '|' || COALESCE(phone, '')), created_at
);

-- ---- Activities (dedupe by normalized name + location) ----
INSERT INTO public.catalog_activities (slug, name, dzongkhag, net_usd, net_inr, currency, active, metadata)
SELECT DISTINCT ON (
  lower(regexp_replace(COALESCE(NULLIF(trim(a.title), ''), a.name), '[^a-zA-Z0-9]+', '-', 'g')),
  COALESCE(NULLIF(trim(a.location), ''), NULLIF(trim(a.dzongkhag), ''), '')
)
  lower(regexp_replace(COALESCE(NULLIF(trim(a.title), ''), a.name), '[^a-zA-Z0-9]+', '-', 'g')) AS slug,
  COALESCE(NULLIF(trim(a.title), ''), a.name) AS name,
  COALESCE(NULLIF(trim(a.location), ''), NULLIF(trim(a.dzongkhag), '')) AS dzongkhag,
  NULLIF(a.cost_usd, 0) AS net_usd,
  NULLIF(a.cost_inr, 0) AS net_inr,
  'USD' AS currency,
  COALESCE(a.is_active, true),
  jsonb_strip_nulls(jsonb_build_object(
    'legacy_id', a.id,
    'category', a.category,
    'subcategory', a.subcategory,
    'duration_hours', a.duration_hours,
    'description', a.description,
    'image_url', a.image_url,
    'included_in_package', a.included_in_package
  ))
FROM public.library_activities a
WHERE COALESCE(NULLIF(trim(a.title), ''), a.name) IS NOT NULL
ORDER BY
  lower(regexp_replace(COALESCE(NULLIF(trim(a.title), ''), a.name), '[^a-zA-Z0-9]+', '-', 'g')),
  COALESCE(NULLIF(trim(a.location), ''), NULLIF(trim(a.dzongkhag), ''), ''),
  a.created_at DESC NULLS LAST
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  dzongkhag = EXCLUDED.dzongkhag,
  net_usd = EXCLUDED.net_usd,
  net_inr = EXCLUDED.net_inr,
  metadata = public.catalog_activities.metadata || EXCLUDED.metadata,
  updated_at = now();

-- Silverpine platform rates
INSERT INTO public.platform_config (key, value) VALUES
  ('guide_day_rate_usd', '35'),
  ('guide_day_rate_inr', '2500'),
  ('fx_usd_inr', '84'),
  ('library_import_version', 'silverpine-2026-03')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

COMMIT;

-- Verify
SELECT 'catalog_hotels' AS entity, count(*) AS rows FROM public.catalog_hotels
UNION ALL SELECT 'catalog_room_rates', count(*) FROM public.catalog_room_rates
UNION ALL SELECT 'catalog_guides', count(*) FROM public.catalog_guides
UNION ALL SELECT 'catalog_activities', count(*) FROM public.catalog_activities
ORDER BY 1;

SELECT city, count(*) AS hotels
FROM public.catalog_hotels
GROUP BY city
ORDER BY count(*) DESC, city
LIMIT 20;
