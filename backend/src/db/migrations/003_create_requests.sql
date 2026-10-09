-- =========================================================
-- SERVICE REQUESTS
-- =========================================================

CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reference VARCHAR(30) NOT NULL UNIQUE,

    service_id VARCHAR(100) NOT NULL,

    issue_id UUID,

    issue_details TEXT,

    full_name VARCHAR(120) NOT NULL,

    phone VARCHAR(30) NOT NULL,

    email VARCHAR(255) NOT NULL,

    location TEXT NOT NULL,

    directions TEXT,

    requested_date DATE NOT NULL,

    requested_time TIME NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_requests_service
        FOREIGN KEY (service_id)
        REFERENCES services(id),

    CONSTRAINT fk_requests_issue
        FOREIGN KEY (issue_id)
        REFERENCES service_issues(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_requests_status
        CHECK (
            status IN (
                'pending',
                'confirmed',
                'completed',
                'cancelled'
            )
        ),

    CONSTRAINT uq_requests_date_time
        UNIQUE (requested_date, requested_time)
);

CREATE INDEX IF NOT EXISTS idx_requests_requested_date
ON requests (requested_date);

CREATE INDEX IF NOT EXISTS idx_requests_status
ON requests (status);

CREATE INDEX IF NOT EXISTS idx_requests_service_id
ON requests (service_id);