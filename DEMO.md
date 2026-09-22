# Luma Trips — Agent desk demo

## Quick start (Silverpine pilot)

1. Sign in at `/desk/login`
2. On `/desk`, use the **select wizard** (Basics → Route → Stays → Staff → Cost → Packs)
3. **Build itinerary** creates a deterministic draft (no Gemini required)
4. Optional: **Polish prose with AI** after the draft is ready
5. Open trip in **Trips** → assign rooms, guide, driver in Ops tabs
6. Print guest PDF from preview; share **Field pack** (no rates) with guide

Secondary: “Prefer paste WhatsApp” switches to the legacy chat brief path.

## Support

WhatsApp + email + phone 9:00–18:00 BTT (configure in CMS).

## Pre-launch checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- [ ] Agency Gemini key in Settings (only for optional AI polish)
- [ ] Run `npm run ingest:catalog` (MASTER → generated hotel catalog)
- [ ] Optional: `npm run ingest:catalog:db` when catalog_* tables exist
- [ ] Optional live hotels: `INNORA_API_URL` + `INNORA_API_KEY`
- [ ] Lawyer review before B2C `/build` public marketing
- [ ] Weekly `pg_dump` backup on Supabase Free tier

## Platform admin

Set `PLATFORM_ADMIN_EMAIL` → access `/platform/library`, `/platform/cms`, `/platform/billing`.
