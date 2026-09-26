-- Add 'dine-in' as a checkout service type, with an optional table number
-- Date: 2026-09-26

ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number text;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_service_type_check
  CHECK (service_type IN ('dine-in', 'pickup', 'delivery'));
