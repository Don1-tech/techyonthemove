-- =========================================================
-- REVIEWS
-- =========================================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_name VARCHAR(120) NOT NULL,

    rating INTEGER NOT NULL
        CHECK (rating >= 1 AND rating <= 5),

    review_text TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
