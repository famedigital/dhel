# Dhel — Agent desk demo

## Quick start (Silverpine pilot)

1. Sign in at `/desk/login`
2. Paste a client WhatsApp message on `/desk` → **Go**
3. Pick a recommended option card → **Download PDF draft**
4. Open trip in **Trips** → assign rooms, guide, driver in Ops tabs
5. Print guest PDF from preview; share **Field pack** (no rates) with guide

## Support

WhatsApp + email + phone 9:00–18:00 BTT (configure in CMS).

## Pre-launch checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- [ ] Agency Gemini key in Settings (or platform `GEMINI_API_KEY`)
- [ ] Run Supabase migrations (`20260822_dhel_phase2.sql`, `20260822_agency_rates.sql`)
- [ ] Lawyer review before B2C `/build` public marketing
- [ ] Weekly `pg_dump` backup on Supabase Free tier

## Platform admin

Set `PLATFORM_ADMIN_EMAIL` → access `/platform/library`, `/platform/cms`, `/platform/billing`.
