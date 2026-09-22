# Bhutan ops catalog — start here

Canonical lookup for hotels, homestays, guides, vehicles, and attractions.

**Use these first:**

| File | Use |
|---|---|
| [MASTER.csv](MASTER.csv) | Spreadsheet: `type`, `name`, `address`, `phone`, `email`, `url`, `photos`, `subtype` |
| [MASTER.json](MASTER.json) | Same rows plus `details` (rates, rooms, licenses, fees) |

Filter `type`: `hotel` | `homestay` | `guide` | `vehicle` | `attraction`.

Do not scrape DOT / GMS from scratch unless this catalog is missing the record. Confirm phone, rooms, and rates before quoting.

## Per-type detail files

- Hotels: `hotels.json` / `hotels.csv`
- Homestays: `homestays.json` / `homestays.csv` / `homestays-by-dzongkhag.json`
- Guides: `guides.json` / `guides.csv` / `guides-by-group.json` / `guide-rates.csv`
- Vehicles: `drivers-and-vehicles.json` / `vehicles.csv`
- Attractions / entry fees: `entry-fees.json` + `images/entry-points/`
- Seasonal costing: `cost-sheet.json`

## Coverage limits

- Hotels and guides are a Silverpine dump (~100 each), not the full national DOT lists.
- Homestays: 123 DOT-certified village homestays + 4 extra licensed portal profiles.
- No public named driver roster. Vehicle rows are hire categories (chauffeur included).
- Guide gender is a name heuristic. Confirm on https://gms.tourism.gov.bt/.
- Overnight tourist stays only at DOT-certified hotels / village homestays.

Rebuild: `node scripts/build-master-sheet.mjs`
