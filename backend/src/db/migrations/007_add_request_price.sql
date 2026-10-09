-- =========================================================
-- ADD APPROXIMATE PRICE TO SERVICE REQUESTS
-- =========================================================

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS approximate_price NUMERIC(10, 2);
