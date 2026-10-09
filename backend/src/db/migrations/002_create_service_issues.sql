-- =========================================================
-- SERVICE ISSUES
-- =========================================================

CREATE TABLE IF NOT EXISTS service_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    service_id VARCHAR(100) NOT NULL,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_service_issues_service
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_service_issue_name
        UNIQUE (service_id, name)
);

CREATE INDEX IF NOT EXISTS idx_service_issues_service_id
ON service_issues (service_id);

CREATE INDEX IF NOT EXISTS idx_service_issues_active
ON service_issues (is_active);