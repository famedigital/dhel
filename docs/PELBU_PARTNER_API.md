# Innora / Pelbu Partner API (Luma Trips Phase 2 dependency)

Implement in **Hotel OS Bhutan / Innora** (or pelbusuites). Luma Trips consumes via `src/lib/pelbu/client.ts`.

## Endpoints (v1 — read-only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/partner/v1/properties/{property_id}/rates` | Room types + net agent rates |
| GET | `/api/partner/v1/properties/{property_id}/availability?from=&to=` | Units available per night |

Auth: `Authorization: Bearer {platform_key}` scoped to opted-in properties.

## Reference tenant

- `property_id`: `pelbu-olakha`
- Reuse `inventory-availability.ts` + `rates.ts` from Innora web lib

## Luma Trips connector

When live API is configured (`INNORA_API_URL` + `INNORA_API_KEY`, or legacy `PELBU_API_*`),
pricing / availability prefer live rates via `src/lib/innora/client.ts`.
Mock fallback includes `pelbu-olakha` for local testing.
