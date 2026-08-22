# Pelbu Partner API (Dhel Phase 2 dependency)

Implement in **pelbusuites** repo. Dhel consumes via `src/lib/pelbu/client.ts`.

## Endpoints (v1 — read-only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/partner/v1/properties/{property_id}/rates` | Room types + net agent rates |
| GET | `/api/partner/v1/properties/{property_id}/availability?from=&to=` | Units available per night |

Auth: `Authorization: Bearer {dhel_platform_key}` scoped to opted-in properties.

## Reference tenant

- `property_id`: `pelbu-olakha`
- Reuse `inventory-availability.ts` + `rates.ts` from pelbusuites web lib

## Dhel connector

When live API is configured (`PELBU_API_URL` + `PELBU_API_KEY`), pricing engine prefers live rates over catalog seed.
