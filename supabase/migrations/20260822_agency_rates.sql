-- Agency resource manual rates for pricing engine
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS net_rate_usd numeric(12, 2);
ALTER TABLE guides ADD COLUMN IF NOT EXISTS day_rate_usd numeric(12, 2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS day_rate_usd numeric(12, 2);
