-- =========================================================
-- SERVICES
-- =========================================================

CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(100) PRIMARY KEY,

    name VARCHAR(150) NOT NULL UNIQUE,

    description TEXT,

    base_price NUMERIC(10, 2),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_active
ON services (is_active);