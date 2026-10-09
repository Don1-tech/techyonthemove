-- =========================================================
-- REVIEWS QUERIES
-- =========================================================


-- =========================================================
-- CREATE REVIEW
-- New reviews are unapproved by default.
-- =========================================================

INSERT INTO reviews (
    customer_name,
    rating,
    review_text
)
VALUES (
    $1,
    $2,
    $3
)
RETURNING
    id,
    customer_name,
    rating,
    review_text,
    approved,
    created_at;


-- =========================================================
-- GET PUBLIC REVIEWS
-- Only approved reviews are visible to customers.
-- Newest reviews appear first.
-- =========================================================

SELECT
    id,
    customer_name,
    rating,
    review_text,
    created_at
FROM reviews
WHERE approved = TRUE
ORDER BY created_at DESC;


-- =========================================================
-- GET ALL REVIEWS
-- Intended for owner/admin use.
-- =========================================================

SELECT
    id,
    customer_name,
    rating,
    review_text,
    approved,
    created_at
FROM reviews
ORDER BY created_at DESC;


-- =========================================================
-- APPROVE REVIEW
-- =========================================================

UPDATE reviews
SET approved = TRUE
WHERE id = $1
RETURNING
    id,
    customer_name,
    rating,
    review_text,
    approved,
    created_at;


-- =========================================================
-- DELETE REVIEW
-- Owner/admin operation.
-- =========================================================

DELETE FROM reviews
WHERE id = $1
RETURNING
    id,
    customer_name,
    rating,
    review_text,
    approved,
    created_at;
