-- =========================================================
-- ADD SERVICE CATEGORY TO REVIEWS
-- =========================================================

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS service_category VARCHAR(150);
