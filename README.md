# Itinerary Studio

White-label **multi-agency agent desk** for Bhutan tours:

1. **Narrative** — brief → Gemini letter/day prose (EN/ZH)  
2. **Live ops** — hotels, **room numbers**, guides, drivers (create & update anytime)  
3. **Money** — client in / supplier out ledger  
4. **Docs** — Classic Luxury guest PDF + ops voucher pack  

> Portals stay free. Value is stitching live information + technical support; commission on flow is the business model (Stripe not required for v1 ledger).

See **[PRESENTATION.md](./PRESENTATION.md)** and **[DEMO.md](./DEMO.md)**.

## Daily path

1. Sign up / create agency  
2. **Resources** — hotels (seed Pelbu Suites), rooms, guides, drivers  
3. **Clients** — guest master  
4. **New itinerary** → generate narrative  
5. Trip tabs: **Stays** (hotel + room #) · **Staff** · **Payments** · **Docs**  
6. Print **Guest PDF** or **Ops vouchers**

## Stack

- Next.js 16 · Supabase Auth + RLS · Gemini · Print CSS PDF  

## Live tables (per agency)

`clients` · `hotels` · `rooms` · `guides` · `drivers` · `itinerary_stays` · `itinerary_staff` · `payments`

## Gemini rule

Does **not** invent hotel names, room numbers, guide/driver phones. Overnights are “TBD — assign in Ops” until stays are assigned from inventory.

## Setup

```bash
npm install
cp .env.example .env.local
# fill Supabase + optional GEMINI / service role
npm run dev
```

Health: `/api/health` → `demoReady: true`

## Demo

Dashboard → **Seed demo PDF** seeds client + Pelbu Suites room # + guide + driver + payments + guest preview.

## Out of scope (this repo)

Guide/driver login portals, hotel PMS UI, external ERP HTTP, Amadeus shopping, Stripe.
