DROP INDEX IF EXISTS idx_reviews_approved_created_at;

ALTER TABLE reviews
DROP COLUMN IF EXISTS approved;
